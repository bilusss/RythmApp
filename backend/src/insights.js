import { z } from 'zod';

// Bielik runs with a 16k-token context (infra/vllm: --max-model-len 16384) and its tokenizer gives
// ~2.7 characters of Polish text per token. The entry table is capped at ~24k characters (~9k tokens),
// so with the stats, the instructions and the answer every request fits. Entries that do not fit
// (the oldest ones) still count in the stats.
const ENTRY_BUDGET = 24_000;
const DESCRIPTION_MAX = 160;
const MAX_TOKENS = 700;
const PLACE_RADIUS_M = 150;
const DEFAULT_TIME_ZONE = 'Europe/Warsaw';

const SYSTEM = `Jesteś asystentem aplikacji Rytm. Użytkownik kilka razy dziennie zapisuje, co robi, jak się czuje i ile ma energii (metoda ESM). Dostajesz statystyki policzone z jego wpisów i same wpisy.

Jak czytać dane:
- nastrój: 1 bardzo źle, 2 źle, 3 neutralnie, 4 dobrze, 5 świetnie;
- energia: 0% to wyczerpanie, 100% to pełnia energii;
- data i godzina to czas lokalny użytkownika;
- M1, M2… to anonimowe miejsca (M1 = najczęstsze), „–” = brak lokalizacji;
- brak opisu znaczy tylko, że użytkownik nic nie wpisał.

Zadanie: znajdź powtarzające się zależności nastroju i energii od pory dnia, dnia tygodnia, kategorii, miejsca i treści opisów.

Zasady:
- pisz po polsku, krótko i życzliwie, zwracaj się do użytkownika bezpośrednio, np. „Najlepiej czujesz się…”, „Twoja energia spada…”; nie pisz o nim „użytkownik”;
- opieraj się wyłącznie na danych; średnie bierz ze statystyk, nie licz ich sam; wniosek musi wynikać z kilku wpisów z różnych dni, a nie z jednego;
- nie podawaj liczb, średnich ani pojedynczych wpisów — opisz zależność słowami, np. „wyraźnie więcej energii”;
- nie używaj kodów miejsc (M1, M2) — miejsce opisz tym, co tam zwykle robisz, np. „tam, gdzie zwykle pracujesz”;
- gdy wpisów jest mniej niż ok. 15 albo pochodzą z 1–2 dni, napisz w summary, że to za mało danych na pewne wnioski, i zachęć do kolejnych check-inów; nie zgaduj.

Pola odpowiedzi:
- summary: najważniejszy wniosek, 1–2 krótkie zdania, razem maks. 30 słów;
- happiest_time: kiedy masz najlepszy nastrój, krótka fraza do 60 znaków (np. „w weekendowe poranki”, „po treningu”);
- energy_boosters: do 3 rzeczy, które podnoszą Twoją energię lub nastrój, każda 1–3 słowa;
- energy_drainers: do 3 rzeczy, które je obniżają, każda 1–3 słowa; pusta lista, jeśli nic wyraźnie nie obniża.`;

// Lengths are asked for in the prompt and enforced in tidy(): length limits in the JSON schema itself make
// vLLM cut a string mid-word and then pad the JSON with whitespace until max_tokens.
const answer = z.object({
  summary: z.string(),
  happiest_time: z.string(),
  energy_boosters: z.array(z.string()),
  energy_drainers: z.array(z.string()),
});
const LIMITS = { summary: 240, happiest_time: 80, item: 40, items: 3 };

const DAY_PARTS = [
  { name: 'rano (5–11)', from: 5, to: 11 },
  { name: 'południe (11–14)', from: 11, to: 14 },
  { name: 'popołudnie (14–18)', from: 14, to: 18 },
  { name: 'wieczór (18–22)', from: 18, to: 22 },
  { name: 'noc (22–5)', from: 22, to: 29 },
];
const WEEKDAYS = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela'];

const clean = (text) => (text ?? '').replace(/\s+/g, ' ').replaceAll('|', '/').trim();
const clip = (text, max) => (text.length <= max ? text : `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`);
const decimal = (value) => value.toFixed(1).replace('.', ',');
const entriesWord = (n) => {
  if (n === 1) return 'wpis';
  return n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14) ? 'wpisy' : 'wpisów';
};

// The profile's IANA time zone, or Poland's when it is missing or invalid.
export function userTimeZone(timeZone) {
  if (!timeZone) return DEFAULT_TIME_ZONE;
  try {
    return new Intl.DateTimeFormat('en', { timeZone }).resolvedOptions().timeZone;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

// Date parts in the user's time zone, with Polish weekday names (the server may run in another zone).
function localTime(timeZone) {
  const format = new Intl.DateTimeFormat('pl-PL', {
    timeZone: userTimeZone(timeZone),
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return (date) => {
    const p = Object.fromEntries(format.formatToParts(date).map(({ type, value }) => [type, value]));
    return { ...p, hourNumber: Number(p.hour), date: `${p.day}.${p.month}` };
  };
}

// GPS points within ~150 m are one place; places get anonymous codes M1, M2... (M1 = most entries).
// Coordinates never leave the server.
function placeCodes(rows) {
  const places = [];
  const assigned = rows.map((c) => {
    if (c.latitude == null || c.longitude == null) return null;
    let place = null;
    let nearest = PLACE_RADIUS_M;
    for (const p of places) {
      const dy = (c.latitude - p.lat) * 111_320;
      const dx = (c.longitude - p.lon) * 111_320 * Math.cos((p.lat * Math.PI) / 180);
      const distance = Math.hypot(dx, dy);
      if (distance <= nearest) [place, nearest] = [p, distance];
    }
    if (!place) places.push((place = { lat: c.latitude, lon: c.longitude, n: 0 }));
    place.n += 1;
    place.lat += (c.latitude - place.lat) / place.n;
    place.lon += (c.longitude - place.lon) / place.n;
    return place;
  });
  [...places].sort((a, b) => b.n - a.n).forEach((p, i) => (p.code = `M${i + 1}`));
  return { codes: assigned.map((p) => p?.code ?? null), count: places.length };
}

function stats(items) {
  const mood = items.reduce((sum, c) => sum + c.mood, 0) / items.length;
  const energy = items.reduce((sum, c) => sum + c.energy, 0) / items.length;
  return `${items.length} ${entriesWord(items.length)}, nastrój ${decimal(mood)}, energia ${Math.round(energy)}%`;
}

function statSection(title, groups) {
  const lines = groups.filter(([, items]) => items.length > 0).map(([name, items]) => `- ${name}: ${stats(items)}`);
  return lines.length ? [`${title}:`, ...lines] : [];
}

const byCount = (items, key) => Object.entries(Object.groupBy(items, key)).sort((a, b) => b[1].length - a[1].length);
// Night (22-5) is one span: hours after midnight count as 24-28.
const dayHour = (e) => (e.hourNumber < 5 ? e.hourNumber + 24 : e.hourNumber);

// The user message for Bielik: exact stats computed here (an 11B model should not do the arithmetic over
// hundreds of rows) and as many of the newest entries as fit the budget, oldest first.
export function buildPrompt(rows, { timeZone, days } = {}) {
  if (!rows.length) return 'Brak wpisów.';
  const time = localTime(timeZone);
  const sorted = [...rows].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const places = placeCodes(sorted);
  const withPlaces = places.count > 1;
  const entries = sorted.map((c, i) => ({
    ...time(new Date(c.scheduled_at)),
    category: clean(c.category?.name) || 'bez kategorii',
    mood: c.mood,
    energy: c.energy_level,
    place: places.codes[i],
    description: clip(clean(c.description), DESCRIPTION_MAX),
  }));

  const byDayPart = DAY_PARTS.map(({ name, from, to }) => [name, entries.filter((e) => dayHour(e) >= from && dayHour(e) < to)]);
  const byWeekday = WEEKDAYS.map((day) => [day, entries.filter((e) => e.weekday === day)]);
  const located = entries.filter((e) => e.place);
  const byPlace = withPlaces ? byCount(located, (e) => e.place).map(([code, items]) => [`${code} (najczęściej: ${byCount(items, (e) => e.category)[0][0]})`, items]) : [];

  const line = (e) => [e.date, e.weekday, `${e.hour}:${e.minute}`, e.category, e.mood, `${e.energy}%`, ...(withPlaces ? [e.place ?? '–'] : []), e.description].join(' | ');
  const shown = [];
  let used = 0;
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const text = line(entries[i]);
    if (used + text.length + 1 > ENTRY_BUDGET) break;
    shown.unshift(text);
    used += text.length + 1;
  }

  const described = entries.filter((e) => e.description).length;
  const activeDays = new Set(entries.map((e) => `${e.year}-${e.date}`)).size;
  const first = entries[0];
  const last = entries.at(-1);
  const period = !days ? `${first.date}.${first.year}–${last.date}.${last.year}` : days === 1 ? 'ostatni dzień' : `ostatnie ${days} dni`;
  const columns = ['data', 'dzień', 'godzina', 'kategoria', 'nastrój', 'energia', ...(withPlaces ? ['miejsce'] : []), 'opis'].join(' | ');

  return [
    `Okres: ${period}. Wpisów: ${entries.length} z ${activeDays} ${activeDays === 1 ? 'dnia' : 'dni'}, w tym z opisem: ${described}.`,
    '',
    `Wszystkie wpisy: ${stats(entries)}`,
    ...statSection('Według kategorii', byCount(entries, (e) => e.category)),
    ...statSection('Według pory dnia', byDayPart),
    ...statSection('Według dnia tygodnia', byWeekday),
    ...statSection('Według miejsca', byPlace),
    '',
    shown.length < entries.length ? `Wpisy (${shown.length} najnowszych z ${entries.length}, od najstarszego): ${columns}` : `Wpisy (od najstarszego): ${columns}`,
    ...shown,
  ].join('\n');
}

// Too long: keep the whole sentences that fit, else cut at a word.
function clipSentences(text, max) {
  if (text.length <= max) return text;
  const end = [...text.slice(0, max + 1).matchAll(/[.!?…](?=\s|$)/g)].at(-1)?.index;
  return end >= max / 3 ? text.slice(0, end + 1) : clip(text, max);
}

// Trims what the model wrote to the lengths the app can show.
export function tidy(a) {
  const text = (value, max) => clip(clean(value), max);
  const list = (items) => [...new Set(items.map((item) => text(item, LIMITS.item).replace(/[.,;:]+$/, '')).filter(Boolean))].slice(0, LIMITS.items);
  return {
    summary: clipSentences(clean(a.summary), LIMITS.summary),
    happiest_time: text(a.happiest_time, LIMITS.happiest_time)
      .replace(/[.]+$/, '')
      .replace(/^\p{Lu}(?=\p{Ll})/u, (m) => m.toLowerCase()),
    energy_boosters: list(a.energy_boosters),
    energy_drainers: list(a.energy_drainers),
  };
}

// Asks Bielik (vLLM, OpenAI-compatible) for structured insights. Retries once on a network error, a server
// error or an unreadable answer; a rejected request (4xx) would fail the same way again.
export async function makeInsight(rows, { timeZone, days } = {}) {
  const { BIELIK_BASE_URL, BIELIK_API_KEY, BIELIK_MODEL, LLM_TIMEOUT = 60000 } = process.env;
  const body = JSON.stringify({
    model: BIELIK_MODEL,
    temperature: 0.3,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: buildPrompt(rows, { timeZone, days }) },
    ],
    response_format: { type: 'json_schema', json_schema: { name: 'insight', schema: z.toJSONSchema(answer) } },
  });
  for (let attempt = 1; attempt <= 2; attempt++) {
    let res;
    try {
      res = await fetch(`${BIELIK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${BIELIK_API_KEY}` },
        body,
        signal: AbortSignal.timeout(+LLM_TIMEOUT),
      });
    } catch (e) {
      console.error(`insight attempt ${attempt} failed: ${e.message}`);
      continue;
    }
    if (!res.ok) {
      console.error(`insight attempt ${attempt} failed: LLM ${res.status} ${(await res.text()).slice(0, 300)}`);
      if (res.status < 500) break;
      continue;
    }
    try {
      const { choices } = await res.json();
      return tidy(answer.parse(JSON.parse(choices[0].message.content)));
    } catch (e) {
      console.error(`insight attempt ${attempt} failed: ${e.message}`);
    }
  }
  throw Object.assign(new Error('Analiza chwilowo niedostępna, spróbuj później'), { status: 503 });
}
