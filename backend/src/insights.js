import { z } from 'zod';

const result = z.object({
  summary: z.string(),
  happiest_time: z.string(),
  energy_boosters: z.array(z.string()),
  energy_drainers: z.array(z.string()),
});

const PROMPT = `Jesteś analitykiem nawyków. Dostajesz listę wpisów (dzień tygodnia, godzina, kategoria, opis, nastrój 1-5, energia 0-100, miejsce).
Znajdź korelacje między opisami, porą dnia, miejscem a nastrojem i energią. Odpowiedz po polsku, jako JSON:
summary (krótkie podsumowanie), happiest_time (kiedy użytkownik jest najszczęśliwszy), energy_boosters i energy_drainers (listy krótkich haseł).`;

// Anonymised payload: no ids, no coordinates - places are just P1, P2... (coords rounded to ~1 km).
export function anonymise(rows) {
  const places = new Map();
  return rows.map((c) => {
    const d = new Date(c.scheduled_at);
    const key = c.latitude == null ? null : `${c.latitude.toFixed(2)},${c.longitude.toFixed(2)}`;
    if (key && !places.has(key)) places.set(key, `P${places.size + 1}`);
    return {
      day: d.toLocaleDateString('en', { weekday: 'long' }),
      hour: d.getHours(),
      category: c.category?.name,
      description: c.description,
      mood: c.mood,
      energy: c.energy_level,
      place: places.get(key),
    };
  });
}

// Asks Bielik (vLLM, OpenAI-compatible) for structured insights; one retry, then a friendly error.
export async function makeInsight(rows) {
  const { BIELIK_BASE_URL, BIELIK_API_KEY, BIELIK_MODEL, LLM_TIMEOUT = 60000 } = process.env;
  const body = JSON.stringify({
    model: BIELIK_MODEL,
    temperature: 0.3,
    messages: [{ role: 'system', content: PROMPT }, { role: 'user', content: JSON.stringify(anonymise(rows)) }],
    response_format: { type: 'json_schema', json_schema: { name: 'insight', schema: z.toJSONSchema(result) } },
  });
  for (let i = 0; i < 2; i++) {
    try {
      const res = await fetch(`${BIELIK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${BIELIK_API_KEY}` },
        body,
        signal: AbortSignal.timeout(+LLM_TIMEOUT),
      });
      if (!res.ok) throw new Error(`LLM ${res.status}`);
      return result.parse(JSON.parse((await res.json()).choices[0].message.content));
    } catch (e) {
      console.error('insight attempt failed:', e.message);
    }
  }
  throw Object.assign(new Error('Analiza chwilowo niedostępna, spróbuj później'), { status: 503 });
}
