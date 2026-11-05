import { db, ok } from './supabase.js';

export const mins = (t) => {
  const [h, m] = t.split(':');
  return h * 60 + +m;
};

// End of the waking window in minutes since midnight; a sleep time at or before the wake time
// means going to bed after midnight, so the window ends on the next day (> 1440).
export const windowEnd = (start, end) => (end > start ? end : end + 1440);

// Length of the waking window in hours (handles sleeping after midnight).
export const awakeHours = (wake, sleep) => {
  const start = mins(wake);
  return (windowEnd(start, mins(sleep)) - start) / 60;
};

// Splits [start, end] minutes into n equal blocks and picks one random minute per block,
// padded from the block edges so notifications stay apart.
export function slots(n, start, end, rand = Math.random) {
  const len = (end - start) / n;
  const pad = Math.min(15, len / 4);
  return Array.from({ length: n }, (_, i) => Math.round(start + i * len + pad + rand() * (len - 2 * pad)));
}

// (Re)creates today's remaining 'queued' check-ins for one profile.
// TODO: uses server time; should use profile.timezone.
export async function planDay(p) {
  const midnight = new Date().setHours(0, 0, 0, 0);
  const start = mins(p.wake_time);
  const rows = slots(p.notifications_count, start, windowEnd(start, mins(p.sleep_time)))
    .map((m) => new Date(midnight + m * 60000))
    .filter((d) => d > new Date())
    .map((d) => ({ user_id: p.id, status: 'queued', scheduled_at: d }));
  ok(await db.from('checkins').delete().eq('user_id', p.id).eq('status', 'queued').gte('scheduled_at', new Date(midnight).toISOString()));
  if (rows.length) ok(await db.from('checkins').insert(rows));
}

let planned = '';

// Every minute: plan the day once per date, then mark due check-ins as 'sent'.
async function tick() {
  const today = new Date().toDateString();
  if (planned !== today) {
    planned = today;
    const users = ok(await db.from('profiles').select().eq('is_onboarded', true).eq('notifications_enabled', true));
    for (const p of users) await planDay(p);
  }
  const due = ok(await db.from('checkins').update({ status: 'sent' }).eq('status', 'queued').lte('scheduled_at', new Date().toISOString()).select('id, user_id'));
  for (const c of due) {
    // TODO: send the push notification (FCM/Expo) to profiles.push_token of c.user_id, opening check-in c.id.
  }
}

export const startScheduler = () => setInterval(() => tick().catch(console.error), 60000);
