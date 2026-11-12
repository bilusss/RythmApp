import { INSIGHT_DAYS } from '../utils/insights';
import { filterByDays } from '../utils/stats';
import { toCheckin, toCheckinBody, toInsight, toProfileBody, toUser } from './mappers';
import { getSupabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request(method, path, body) {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Nie można połączyć się z serwerem.');
  }
  if (res.status === 204) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Błąd serwera (${res.status})`);
  return json;
}

const authError = (error) => {
  if (!error) return;
  throw new Error(
    error.message === 'Invalid login credentials'
      ? 'Nieprawidłowy e-mail lub hasło.'
      : error.message
  );
};

// Everything the screens need from the backend. App takes this as a prop so tests can fake it.
export const api = {
  async hasSession() {
    const { data } = await getSupabase().auth.getSession();
    return Boolean(data.session);
  },

  async signIn(email, password) {
    authError((await getSupabase().auth.signInWithPassword({ email, password })).error);
  },

  // The backend creates the account already confirmed (no e-mail step), then we sign in.
  async signUp(email, password) {
    await request('POST', '/auth/signup', { email, password });
    await this.signIn(email, password);
  },

  async signOut() {
    await getSupabase().auth.signOut();
  },

  async resetPassword(email) {
    authError((await getSupabase().auth.resetPasswordForEmail(email)).error);
  },

  // Profile + settings + recent check-ins + the last AI insight (shown at once, no LLM call).
  async load() {
    const [me, rows, last] = await Promise.all([
      request('GET', '/me'),
      request('GET', '/checkins'),
      request('GET', '/insights/latest'),
    ]);
    const checkins = rows.map(toCheckin);
    const insight = last ? toInsight(last, filterByDays(checkins, INSIGHT_DAYS).length) : null;
    return { user: toUser(me), checkins, insight };
  },

  // Asks the backend to analyse the last `days` days with Bielik (LLM on the GPU PC); takes a few seconds.
  async generateInsight(days, total) {
    return toInsight(await request('POST', '/insights', { days }), total);
  },

  // Saves onboarding/settings; categories that were deselected are archived on the server.
  async saveSettings(settings) {
    await request('PUT', '/me', toProfileBody(settings));
    const selected = new Set(settings.categories.map(({ name }) => name));
    const me = await request('GET', '/me');
    await Promise.all(
      me.categories
        .filter((c) => !selected.has(c.name))
        .map((c) => request('DELETE', `/categories/${c.id}`))
    );
    return toUser({ ...me, categories: me.categories.filter((c) => selected.has(c.name)) })
      .settings;
  },

  async createCheckin(entry, serverCategoryId, coords) {
    const row = await request('POST', '/checkins', toCheckinBody(entry, serverCategoryId, coords));
    return toCheckin({ ...row, category: null });
  },
};
