import { Router } from 'express';
import { z } from 'zod';
import { db, ok } from './supabase.js';
import { planDay, awakeHours } from './scheduler.js';
import { makeInsight } from './insights.js';
import { rateLimit } from './rateLimit.js';

const r = Router();
const time = z.string().regex(/^\d\d:\d\d(:\d\d)?$/);
const category = z.object({ name: z.string().trim().min(1), color: z.string() });
const profile = z
  .object({
    notifications_count: z.int().min(1).max(10),
    wake_time: time,
    sleep_time: time,
    timezone: z.string(),
    notifications_enabled: z.boolean(),
    gps_enabled: z.boolean(),
    push_token: z.string().nullable(),
    is_onboarded: z.boolean(),
  })
  .partial();
const entry = z.object({
  category_id: z.number(),
  description: z.string().max(500).optional(),
  mood: z.int().min(1).max(5),
  energy_level: z.int().min(0).max(100),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
});

// ---- profile + onboarding settings ----
r.get('/me', async (req, res) => {
  const p = ok(await db.from('profiles').select().eq('id', req.user.id).maybeSingle());
  const categories = ok(await db.from('categories').select('id, name, color').eq('user_id', req.user.id).eq('archived', false));
  res.json({ email: req.user.email, is_onboarded: false, ...p, categories });
});

r.put('/me', async (req, res) => {
  const { categories, ...fields } = profile.extend({ categories: z.array(category) }).partial().parse(req.body);
  const p = ok(await db.from('profiles').upsert({ id: req.user.id, ...fields }).select().single());
  if (categories) {
    ok(await db.from('categories').upsert(categories.map((c) => ({ ...c, user_id: p.id, archived: false })), { onConflict: 'user_id,name' }));
  }
  if (p.is_onboarded && p.notifications_enabled) await planDay(p);
  res.json(p);
});

// ---- categories ----
r.post('/categories', async (req, res) => {
  const c = category.parse(req.body);
  res.status(201).json(ok(await db.from('categories').upsert({ ...c, user_id: req.user.id, archived: false }, { onConflict: 'user_id,name' }).select('id, name, color').single()));
});

// Soft delete, so old charts keep working.
r.delete('/categories/:id', async (req, res) => {
  ok(await db.from('categories').update({ archived: true }).eq('id', req.params.id).eq('user_id', req.user.id));
  res.sendStatus(204);
});

// ---- check-ins ----
// Manual entry ("+" button) or an offline-queued one: saved straight as 'done'.
r.post('/checkins', async (req, res) => {
  const body = entry.extend({ scheduled_at: z.iso.datetime().optional() }).parse(req.body);
  const now = new Date().toISOString();
  res.status(201).json(ok(await db.from('checkins').insert({ ...body, scheduled_at: body.scheduled_at ?? now, user_id: req.user.id, status: 'done', is_manual: true, completed_at: now }).select().single()));
});

// Notifications that were sent but not filled in yet.
r.get('/checkins/pending', async (req, res) => {
  res.json(ok(await db.from('checkins').select().eq('user_id', req.user.id).eq('status', 'sent').order('scheduled_at')));
});

// History: done check-ins from the 14 days before `before` (default now). Page by passing the oldest date back as `before`.
r.get('/checkins', async (req, res) => {
  const before = new Date(req.query.before ?? Date.now());
  const from = new Date(before - 14 * 864e5);
  res.json(ok(await db.from('checkins').select('*, category:categories(name, color)').eq('user_id', req.user.id).eq('status', 'done').gte('scheduled_at', from.toISOString()).lt('scheduled_at', before.toISOString()).order('scheduled_at', { ascending: false })));
});

// "Zapisz status" on a notification check-in.
r.patch('/checkins/:id', async (req, res) => {
  const body = entry.parse(req.body);
  res.json(ok(await db.from('checkins').update({ ...body, status: 'done', completed_at: new Date().toISOString() }).eq('id', req.params.id).eq('user_id', req.user.id).in('status', ['queued', 'sent']).select().single()));
});

// "Odpuść check-in".
r.delete('/checkins/:id', async (req, res) => {
  ok(await db.from('checkins').update({ status: 'deleted', completed_at: new Date().toISOString() }).eq('id', req.params.id).eq('user_id', req.user.id));
  res.sendStatus(204);
});

// ---- dashboard: category shares, hourly energy, heatmap points ----
r.get('/dashboard', async (req, res) => {
  const days = { day: 1, week: 7, month: 30 }[req.query.range] ?? 7;
  const since = (d) => new Date(Date.now() - d * 864e5).toISOString();
  const done = () => db.from('checkins').select('*, category:categories(name, color)').eq('user_id', req.user.id).eq('status', 'done');
  const [rows, recent, p] = await Promise.all([
    done().gte('scheduled_at', since(days)).then(ok),
    done().gte('scheduled_at', since(7)).not('latitude', 'is', null).then(ok),
    db.from('profiles').select('wake_time, sleep_time').eq('id', req.user.id).maybeSingle().then(ok),
  ]);
  const activeHours = p ? awakeHours(p.wake_time, p.sleep_time) : 16;

  const categories = Object.values(Object.groupBy(rows, (c) => c.category?.name ?? 'Inne')).map((list) => {
    const percent = (list.length / rows.length) * 100;
    return { name: list[0].category?.name ?? 'Inne', color: list[0].category?.color ?? '#64748B', count: list.length, percent, hours: (percent / 100) * activeHours * days };
  });
  // TODO: group by hour in the user's timezone (now server time).
  const energy = Array.from({ length: 24 }, (_, h) => {
    const v = rows.filter((c) => new Date(c.scheduled_at).getHours() === h).map((c) => c.energy_level);
    return v.length ? v.reduce((a, b) => a + b) / v.length : null;
  });
  res.json({ categories, energy, heatmap: recent.map((c) => ({ latitude: c.latitude, longitude: c.longitude })) });
});

// ---- AI insights ----
r.get('/insights/latest', async (req, res) => {
  res.json(ok(await db.from('insights').select().eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()));
});

// The LLM runs on one home GPU: cap generation per user.
const insightLimit = rateLimit({ windowMs: 3_600_000, max: 20, key: (req) => req.user.id, message: 'Limit analiz na godzinę wyczerpany, spróbuj później.' });
r.post('/insights', insightLimit, async (req, res) => {
  const days = z.object({ days: z.int().min(1).max(90).default(30) }).parse(req.body ?? {}).days;
  const from = new Date(Date.now() - days * 864e5);
  const rows = ok(await db.from('checkins').select('*, category:categories(name)').eq('user_id', req.user.id).eq('status', 'done').gte('scheduled_at', from.toISOString()));
  if (!rows.length) return res.status(400).json({ error: 'Brak wpisów do analizy' });
  const { summary, ...structured } = await makeInsight(rows);
  res.status(201).json(ok(await db.from('insights').insert({ user_id: req.user.id, description: summary, structured_data: structured, from_date: from.toISOString().slice(0, 10), to_date: new Date().toISOString().slice(0, 10) }).select().single()));
});

export default r;
