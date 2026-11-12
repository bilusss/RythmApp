import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import { z } from 'zod';
import { db, requireUser } from './supabase.js';
import { startScheduler } from './scheduler.js';
import { rateLimit } from './rateLimit.js';

const app = express();
// Behind Cloudflare Tunnel (cloudflared on the same host): trust the local proxy hop for req.ip.
app.set('trust proxy', 'loopback');
// Bearer tokens only, no cookies, so an open CORS policy does not expose sessions.
app.use(cors(), express.json({ limit: '100kb' }));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));
app.get('/health', (_, res) => res.json({ ok: true }));

// Sign-up without e-mail confirmation: the account is created already confirmed, the app then signs in.
app.post('/auth/signup', rateLimit({ windowMs: 3_600_000, max: 5, message: 'Za dużo rejestracji z tego adresu, spróbuj za godzinę.' }), async (req, res) => {
  const { email, password } = z.object({ email: z.email(), password: z.string().min(8) }).parse(req.body);
  const { error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) {
    const exists = /already|registered|exists/i.test(error.message);
    return res.status(exists ? 409 : 400).json({ error: exists ? 'Konto z tym adresem już istnieje.' : error.message });
  }
  res.sendStatus(201);
});

app.use(requireUser, routes);
app.use((err, req, res, next) => {
  if (err.name !== 'ZodError' && !err.status) console.error(err);
  res.status(err.status ?? (err.name === 'ZodError' ? 400 : 500)).json({ error: err.message });
});

// Localhost only: the public way in is the Cloudflare Tunnel (infra/cloudflared).
const host = process.env.HOST ?? '127.0.0.1';
const port = process.env.PORT ?? 3000;
app.listen(port, host, () => console.log(`backend up on ${host}:${port}`));
startScheduler();
