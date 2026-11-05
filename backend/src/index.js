import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import { z } from 'zod';
import { db, requireUser } from './supabase.js';
import { startScheduler } from './scheduler.js';

const app = express();
app.use(cors(), express.json());
app.get('/health', (_, res) => res.json({ ok: true }));

// Sign-up without e-mail confirmation: the account is created already confirmed, the app then signs in.
app.post('/auth/signup', async (req, res) => {
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

app.listen(process.env.PORT ?? 3000, () => console.log('backend up'));
startScheduler();
