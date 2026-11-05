import { createClient } from '@supabase/supabase-js';

// Service-role client: bypasses RLS, so every query below filters by user_id itself.
export const db = createClient(process.env.SUPABASE_URL ?? 'http://localhost', process.env.SUPABASE_SERVICE_KEY ?? 'x', {
  auth: { persistSession: false },
});

// Unwraps a supabase response: throws on error, returns data.
export const ok = ({ data, error }) => {
  if (error) throw error;
  return data;
};

// Verifies the Supabase JWT sent by the app (Authorization: Bearer <access_token>).
export const requireUser = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data } = token ? await db.auth.getUser(token) : {};
  if (!data?.user) return res.status(401).json({ error: 'unauthorized' });
  req.user = data.user;
  next();
};
