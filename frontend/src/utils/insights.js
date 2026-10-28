import { filterByDays } from './stats';
import { formatDecimal } from './date';

export const INSIGHT_DAYS = 14;
export const MIN_INSIGHT_ENTRIES = 3;

const STOP_WORDS = new Set([
  'oraz',
  'jest',
  'tylko',
  'jako',
  'przez',
  'bardzo',
  'trochę',
  'teraz',
  'robię',
  'robie',
  'jestem',
  'bardziej',
  'dalej',
  'jeszcze',
  'który',
  'która',
  'które',
]);

const average = (items, pick) =>
  items.length === 0 ? 0 : items.reduce((sum, item) => sum + pick(item), 0) / items.length;

const signed = (value) => `${value < 0 ? '−' : '+'}${formatDecimal(Math.abs(value))}`;
const hourLabel = (hour) => `${String(hour).padStart(2, '0')}:00`;

function wordStats(entries, overallMood, overallEnergy) {
  const byWord = new Map();
  entries.forEach((item) => {
    const words = new Set(
      (item.description ?? '')
        .toLowerCase()
        .split(/[^\p{L}]+/u)
        .filter((word) => word.length >= 4 && !STOP_WORDS.has(word))
    );
    words.forEach((word) => byWord.set(word, [...(byWord.get(word) ?? []), item]));
  });

  return [...byWord.entries()]
    .filter(([, items]) => items.length >= 2)
    .map(([word, items]) => ({
      word,
      moodDelta: average(items, (item) => item.mood) - overallMood,
      energyDelta: average(items, (item) => item.energyLevel) - overallEnergy,
    }));
}

// Deterministic analysis of the user's own entries, shaped like the backend's structured answer.
export function generateInsights(checkins, categories, now = new Date()) {
  const entries = filterByDays(checkins, INSIGHT_DAYS, now);
  if (entries.length < MIN_INSIGHT_ENTRIES) {
    return { status: 'insufficient', total: entries.length, days: INSIGHT_DAYS };
  }

  const nameOf = (id) => categories.find((category) => category.id === id)?.name ?? '';
  const overallMood = average(entries, (item) => item.mood);
  const overallEnergy = average(entries, (item) => item.energyLevel);

  // Happiest two-hour window.
  let best = null;
  for (let start = 0; start < 24; start += 1) {
    const inWindow = entries.filter((item) => {
      const hour = item.scheduledAt.getHours();
      return hour >= start && hour < start + 2;
    });
    if (inWindow.length === 0) continue;
    const mood = average(inWindow, (item) => item.mood);
    if (
      !best ||
      mood > best.mood ||
      (mood === best.mood && inWindow.length > best.entries.length)
    ) {
      best = { start, mood, entries: inWindow };
    }
  }

  const topCategory = Object.entries(
    best.entries.reduce(
      (acc, item) => ({ ...acc, [item.categoryId]: (acc[item.categoryId] ?? 0) + 1 }),
      {}
    )
  ).sort((a, b) => b[1] - a[1])[0][0];

  const words = wordStats(entries, overallMood, overallEnergy);
  const bullets = [];
  const chips = [
    {
      tone: 'green',
      text: `Nastrój śr. ${formatDecimal(best.mood)} / 5 o ${hourLabel(best.start + 1)}`,
    },
  ];

  const energyWord = words
    .filter((item) => item.energyDelta > 0)
    .sort((a, b) => b.energyDelta - a.energyDelta)[0];
  if (energyWord) {
    bullets.push({
      tone: 'green',
      text: `Wpisy ze słowem „${energyWord.word}” wiążą się ze wzrostem energii średnio o ${Math.round(energyWord.energyDelta)} pkt.`,
    });
  }

  const categoryMoods = [...new Set(entries.map((item) => item.categoryId))]
    .map((id) => {
      const items = entries.filter((item) => item.categoryId === id);
      return { id, count: items.length, mood: average(items, (item) => item.mood) };
    })
    .filter((item) => item.count >= 2)
    .sort((a, b) => a.mood - b.mood)[0];
  if (categoryMoods && categoryMoods.mood - overallMood <= -0.3) {
    bullets.push({
      tone: 'orange',
      text: `Kategoria ${nameOf(categoryMoods.id)} obniża nastrój: średnio ${formatDecimal(categoryMoods.mood)} / 5 wobec ${formatDecimal(overallMood)} ogółem.`,
    });
  }

  const earlier = entries.filter((item) => item.scheduledAt.getHours() < 11);
  const later = entries.filter((item) => item.scheduledAt.getHours() >= 11);
  if (earlier.length > 0 && later.length > 0) {
    bullets.push({
      tone: 'purple',
      text: `Przed 11:00 Twoja średnia energia to ${Math.round(average(earlier, (item) => item.energyLevel))}%, a później ${Math.round(average(later, (item) => item.energyLevel))}%.`,
    });
  }

  const moodWord = words
    .filter((item) => item.moodDelta < 0)
    .sort((a, b) => a.moodDelta - b.moodDelta)[0];
  if (moodWord) {
    chips.push({ tone: 'orange', text: `${signed(moodWord.moodDelta)} pkt w „${moodWord.word}”` });
  } else if (categoryMoods && categoryMoods.mood - overallMood < 0) {
    chips.push({
      tone: 'orange',
      text: `${signed(categoryMoods.mood - overallMood)} pkt w ${nameOf(categoryMoods.id)}`,
    });
  }

  return {
    status: 'ready',
    total: entries.length,
    days: INSIGHT_DAYS,
    title: `Najszczęśliwszy jesteś między ${hourLabel(best.start)} a ${hourLabel(best.start + 2)}, zwykle w kategorii ${nameOf(topCategory)}.`,
    bullets,
    chips,
  };
}
