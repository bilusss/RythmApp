import { activeHoursPerDay, formatDayHeading, formatTime12, pluralize } from '../src/utils/date';
import { generateInsights } from '../src/utils/insights';
import {
  averageEnergy,
  categoryBreakdown,
  energyAt,
  energyByHour,
  filterByRange,
  locationClusters,
} from '../src/utils/stats';

const now = new Date(2026, 9, 15, 14, 20);
const categories = [
  { id: 'praca', name: 'Praca' },
  { id: 'nauka', name: 'Nauka' },
];
const entry = (day, hour, categoryId, energyLevel, mood = 3, extra = {}) => ({
  id: `${day}-${hour}-${categoryId}`,
  status: 'done',
  categoryId,
  description: '',
  mood,
  energyLevel,
  scheduledAt: new Date(2026, 9, day, hour, 0),
  latitude: null,
  longitude: null,
  ...extra,
});

describe('date helpers', () => {
  it('formats 12h times, headings and plurals', () => {
    expect(formatTime12('23:00')).toBe('11:00 PM');
    expect(formatTime12('00:30')).toBe('12:30 AM');
    expect(formatTime12('')).toBe('--:--');
    expect(formatDayHeading(new Date(2026, 9, 15), now)).toBe('Dzisiaj · czw., 15 paź');
    expect(formatDayHeading(new Date(2026, 9, 14), now)).toBe('Wczoraj · śr., 14 paź');
    expect(formatDayHeading(new Date(2026, 9, 13), now)).toBe('Wt., 13 paź');
    expect([1, 2, 5, 12, 22].map((n) => pluralize(n, ['wpis', 'wpisy', 'wpisów']))).toEqual([
      'wpis',
      'wpisy',
      'wpisów',
      'wpisów',
      'wpisy',
    ]);
  });

  it('computes the waking window, also across midnight', () => {
    expect(activeHoursPerDay('07:00', '23:00')).toBe(16);
    expect(activeHoursPerDay('08:00', '01:00')).toBe(17);
    expect(activeHoursPerDay('', '23:00')).toBe(0);
  });
});

describe('stats', () => {
  it('returns zeros for no data', () => {
    expect(averageEnergy([])).toBe(0);
    expect(energyByHour([])).toEqual([]);
    const rows = categoryBreakdown([], categories, 16, 1);
    expect(rows.map((row) => [row.percent, row.hours])).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });

  it('filters by range and ignores deleted entries', () => {
    const entries = [
      entry(15, 9, 'praca', 50),
      entry(14, 9, 'praca', 50),
      entry(1, 9, 'praca', 50),
      entry(15, 10, 'praca', 50, 3, { status: 'deleted' }),
    ];
    expect(filterByRange(entries, 'day', now)).toHaveLength(1);
    expect(filterByRange(entries, 'week', now)).toHaveLength(2);
    expect(filterByRange(entries, 'month', now)).toHaveLength(3);
  });

  it('computes share and hours from entry counts', () => {
    const entries = [
      entry(15, 8, 'praca', 50),
      entry(15, 9, 'praca', 50),
      entry(15, 10, 'nauka', 50),
    ];
    const [first, second] = categoryBreakdown(entries, categories, 16, 1);
    expect(first.category.id).toBe('praca');
    expect(first.percent).toBe(67);
    expect(first.hours).toBeCloseTo(10.67, 1);
    expect(second.percent).toBe(33);
  });

  it('averages energy per hour and interpolates the current time', () => {
    const points = energyByHour([
      entry(15, 10, 'praca', 40),
      entry(14, 10, 'praca', 60),
      entry(15, 12, 'praca', 80),
    ]);
    expect(points.map((point) => [point.hour, point.value])).toEqual([
      [10, 50],
      [12, 80],
    ]);
    expect(energyAt(points, 11)).toBe(65);
    expect(energyAt(points, 20)).toBeNull();
  });

  it('clusters nearby GPS entries from the last 7 days', () => {
    const at = (day, lat, lng) => entry(day, 9, 'praca', 50, 3, { latitude: lat, longitude: lng });
    const clusters = locationClusters(
      [at(15, 52.2301, 21.0101), at(14, 52.2302, 21.0102), at(13, 52.3, 21.1), at(1, 50, 20)],
      categories,
      now
    );
    expect(clusters).toHaveLength(2);
    expect(clusters.find((cluster) => cluster.count === 2).label).toBe('Praca');
  });
});

describe('insights', () => {
  it('reports insufficient data instead of inventing conclusions', () => {
    expect(generateInsights([entry(15, 9, 'praca', 50)], categories, now)).toEqual({
      status: 'insufficient',
      total: 1,
      days: 14,
    });
  });

  it('finds the happiest window from real entries', () => {
    const entries = [
      entry(15, 9, 'praca', 40, 2),
      entry(14, 9, 'praca', 45, 2),
      entry(15, 18, 'nauka', 80, 5),
      entry(14, 18, 'nauka', 70, 5),
    ];
    const result = generateInsights(entries, categories, now);
    expect(result.status).toBe('ready');
    expect(result.title).toContain('17:00 a 19:00');
    expect(result.title).toContain('Nauka');
    expect(result.chips[0].text).toBe('Nastrój śr. 5 / 5 o 18:00');
  });
});
