// Runs the real makeInsight() against Bielik without Supabase: `node --env-file=.env scripts/bielik-smoke.js`
import { makeInsight } from '../src/insights.js';

const at = (day, h, m) => new Date(2026, 10, 9 + day, h, m).toISOString();
const rows = [
  [0, 8, 40, 'Jazda autem', 'korek do pracy', 2, 35, [50.06, 19.94]],
  [0, 11, 15, 'Praca', 'code review, spokojnie', 4, 70, [50.07, 19.91]],
  [0, 15, 30, 'Praca', 'długie spotkanie bez agendy', 2, 30, [50.07, 19.91]],
  [0, 19, 50, 'Relaks', 'bieganie w parku', 5, 80, [50.05, 19.93]],
  [1, 9, 5, 'Nauka', 'C++ szablony, kawa', 4, 75, [50.03, 19.95]],
  [1, 13, 40, 'Praca', 'po obiedzie, senność', 3, 40, [50.07, 19.91]],
  [1, 17, 20, 'Obowiązki domowe', 'zakupy i pranie', 3, 50, [50.03, 19.95]],
  [1, 21, 30, 'Relaks', 'serial ze znajomymi', 5, 45, [50.03, 19.95]],
  [2, 7, 50, 'Relaks', 'poranny spacer', 4, 65, [50.05, 19.93]],
  [2, 12, 10, 'Praca', 'debugowanie produkcji, stres', 1, 55, [50.07, 19.91]],
].map(([d, h, m, name, description, mood, energy_level, [latitude, longitude]]) => ({
  scheduled_at: at(d, h, m), category: { name }, description, mood, energy_level, latitude, longitude,
}));

const t0 = Date.now();
console.log(JSON.stringify(await makeInsight(rows), null, 2));
console.log(`OK in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
