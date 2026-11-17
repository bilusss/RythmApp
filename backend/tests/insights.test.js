import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPrompt, tidy, userTimeZone } from '../src/insights.js';

const row = (iso, extra = {}) => ({ scheduled_at: iso, category: { name: 'Praca' }, description: null, mood: 3, energy_level: 50, latitude: null, longitude: null, ...extra });
const entryLines = (prompt) => prompt.split('\n').filter((line) => /^\d\d\.\d\d \| /.test(line));

test('entries use Polish weekdays and the user time zone', () => {
  // 19:05 UTC is 20:05 in Warsaw (CET) and 14:05 in New York.
  const rows = [row('2026-11-12T19:05:00Z', { description: 'serial ze znajomymi' })];
  assert.equal(entryLines(buildPrompt(rows, { timeZone: 'Europe/Warsaw' }))[0], '12.11 | czwartek | 20:05 | Praca | 3 | 50% | serial ze znajomymi');
  assert.match(buildPrompt(rows, { timeZone: 'America/New_York' }), /12\.11 \| czwartek \| 14:05 \|/);
  assert.match(buildPrompt(rows, { timeZone: 'Not/AZone' }), /12\.11 \| czwartek \| 20:05 \|/);
});

test('missing descriptions stay empty, long ones are cleaned and shortened', () => {
  const rows = [row('2026-11-12T08:00:00Z'), row('2026-11-12T09:00:00Z', { description: `kod | review\n${'bardzo długie zdanie '.repeat(20)}` })];
  const [empty, long] = entryLines(buildPrompt(rows));
  assert.ok(empty.endsWith('| 50% | '));
  assert.ok(!long.includes('\n') && long.split(' | ').length === 7);
  assert.ok(long.length < 220 && long.endsWith('…'));
  assert.match(buildPrompt(rows), /Wpisów: 2 z 1 dnia, w tym z opisem: 1\./);
});

test('places are clustered by distance and named by frequency, never by coordinates', () => {
  const home = { latitude: 50.0647, longitude: 19.945 };
  const near = { latitude: 50.0651, longitude: 19.9455 }; // ~55 m from home
  const work = { latitude: 50.0675, longitude: 19.9123 }; // ~2.4 km away
  const rows = [row('2026-11-12T08:00:00Z', home), row('2026-11-12T09:00:00Z', near), row('2026-11-12T10:00:00Z', work)];
  const prompt = buildPrompt(rows);
  assert.deepEqual(
    entryLines(prompt).map((line) => line.split(' | ')[6]),
    ['M1', 'M1', 'M2']
  );
  assert.match(prompt, /- M1 \(najczęściej: Praca\): 2 wpisy/);
  assert.ok(!prompt.includes('50.06') && !prompt.includes('19.9'));
  // A single place carries no information: no place column at all.
  assert.equal(entryLines(buildPrompt([row('2026-11-12T08:00:00Z', home)]))[0].split(' | ').length, 7);
});

test('stats are exact and cover entries that do not fit the table', () => {
  const rows = Array.from({ length: 1000 }, (_, i) =>
    row(new Date(Date.UTC(2026, 9, 1) + i * 3_600_000).toISOString(), { mood: i % 2 ? 5 : 1, energy_level: 40, description: 'x'.repeat(150) })
  );
  const prompt = buildPrompt(rows, { days: 90 });
  const shown = entryLines(prompt);
  assert.ok(prompt.length < 30_000, `prompt has ${prompt.length} chars`);
  assert.ok(shown.length > 50 && shown.length < 1000);
  assert.match(prompt, new RegExp(`Wpisy \\(${shown.length} najnowszych z 1000, od najstarszego\\)`));
  assert.match(prompt, /Wszystkie wpisy: 1000 wpisów, nastrój 3,0, energia 40%/);
  assert.ok(shown.at(-1).startsWith('11.11 | środa | '), 'the newest entries are kept');
});

test('tidy trims the answer to what the app can show', () => {
  const answer = tidy({
    summary: '  Najlepiej czujesz się wieczorem.  ',
    happiest_time: 'Wieczorem, przy relaksie.',
    energy_boosters: ['bieganie.', 'bieganie', 'kawa', 'spacer', 'sen'],
    energy_drainers: ['bardzo długie spotkania bez agendy w czwartkowe popołudnia po obiedzie'],
  });
  assert.equal(answer.summary, 'Najlepiej czujesz się wieczorem.');
  assert.equal(answer.happiest_time, 'wieczorem, przy relaksie');
  assert.deepEqual(answer.energy_boosters, ['bieganie', 'kawa', 'spacer']);
  assert.ok(answer.energy_drainers[0].length <= 40 && answer.energy_drainers[0].endsWith('…'));

  const first = 'Najlepiej czujesz się wieczorem, gdy odpoczywasz po pracy albo biegasz w parku ze znajomymi.';
  const long = tidy({ ...answer, summary: `${first} ${'Energia spada w czasie długich spotkań i jazdy autem w korkach. '.repeat(4)}` });
  assert.ok(long.summary.startsWith(first) && long.summary.endsWith('korkach.') && long.summary.length <= 240, long.summary);
  assert.ok(tidy({ ...answer, summary: 'słowo '.repeat(80) }).summary.endsWith('…'));
});

test('userTimeZone falls back to Poland', () => {
  assert.equal(userTimeZone('Europe/London'), 'Europe/London');
  assert.equal(userTimeZone(undefined), 'Europe/Warsaw');
  assert.equal(userTimeZone('Mars/Olympus'), 'Europe/Warsaw');
});
