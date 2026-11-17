import { DAY_MS, startOfDay } from './date';

export const RANGES = [
  { value: 'day', label: 'Dzień', days: 1 },
  { value: 'week', label: 'Tydzień', days: 7 },
  { value: 'month', label: 'Miesiąc', days: 30 },
];

export const rangeDays = (range) => RANGES.find((item) => item.value === range)?.days ?? 1;

// Only finished entries count towards any statistic.
export const doneCheckins = (checkins) => checkins.filter((item) => item.status === 'done');

export function filterByDays(checkins, days, now = new Date()) {
  const from = startOfDay(now).getTime() - (days - 1) * DAY_MS;
  return doneCheckins(checkins).filter((item) => {
    const time = item.scheduledAt.getTime();
    return time >= from && time <= now.getTime();
  });
}

export const filterByRange = (checkins, range, now = new Date()) =>
  filterByDays(checkins, rangeDays(range), now);

export function categoryBreakdown(checkins, categories, activeHours, days) {
  const total = checkins.length;
  const counts = new Map();
  checkins.forEach((item) => counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1));

  const rows = categories.map((category) => {
    const count = counts.get(category.id) ?? 0;
    const share = total === 0 ? 0 : count / total;
    return {
      category,
      count,
      share,
      percent: Math.round(share * 100),
      hours: share * activeHours * days,
    };
  });

  return rows.sort((a, b) => b.count - a.count);
}

const hourOf = (item) => item.scheduledAt.getHours() + item.scheduledAt.getMinutes() / 60;

// Average energy per clock hour, plotted at the mean time of the entries in that hour.
export function energyByHour(checkins) {
  const buckets = Array.from({ length: 24 }, () => []);
  checkins.forEach((item) => buckets[item.scheduledAt.getHours()].push(item));

  return buckets
    .map((entries, hour) => {
      if (entries.length === 0) return null;
      const value = entries.reduce((sum, item) => sum + item.energyLevel, 0) / entries.length;
      const x = entries.reduce((sum, item) => sum + hourOf(item), 0) / entries.length;
      return { hour, x, value };
    })
    .filter(Boolean);
}

export function averageEnergy(checkins) {
  if (checkins.length === 0) return 0;
  return Math.round(checkins.reduce((sum, item) => sum + item.energyLevel, 0) / checkins.length);
}

// Linear interpolation of the energy curve at a given hour; null outside the measured span.
export function energyAt(points, x) {
  if (points.length === 0) return null;
  if (x < points[0].x || x > points[points.length - 1].x) return null;
  for (let index = 0; index < points.length - 1; index += 1) {
    const left = points[index];
    const right = points[index + 1];
    if (x >= left.x && x <= right.x) {
      const span = right.x - left.x;
      return span === 0
        ? left.value
        : left.value + ((right.value - left.value) * (x - left.x)) / span;
    }
  }
  return points[points.length - 1].value;
}

const CLUSTER_RADIUS_M = 150;

const metersBetween = (a, b) => {
  const dy = (b.latitude - a.latitude) * 111320;
  const dx = (b.longitude - a.longitude) * 111320 * Math.cos((a.latitude * Math.PI) / 180);
  return Math.hypot(dx, dy);
};

// Groups GPS entries from the last 7 days into places: an entry joins the nearest place within ~150 m.
// (A fixed ~100 m grid split one place in two whenever its GPS points fell on both sides of a cell
// border, which drew two spots with overlapping labels.)
export function locationClusters(checkins, categories, now = new Date()) {
  const clusters = [];

  filterByDays(checkins, 7, now)
    .filter((item) => item.latitude != null && item.longitude != null)
    .forEach((item) => {
      let cluster = null;
      let nearest = CLUSTER_RADIUS_M;
      clusters.forEach((candidate) => {
        const distance = metersBetween(candidate, item);
        if (distance <= nearest) {
          cluster = candidate;
          nearest = distance;
        }
      });
      if (!cluster) {
        cluster = { latitude: item.latitude, longitude: item.longitude, count: 0, categories: {} };
        clusters.push(cluster);
      }
      cluster.count += 1;
      cluster.latitude += (item.latitude - cluster.latitude) / cluster.count;
      cluster.longitude += (item.longitude - cluster.longitude) / cluster.count;
      cluster.categories[item.categoryId] = (cluster.categories[item.categoryId] ?? 0) + 1;
    });

  return clusters.map((cluster) => {
    const topId = Object.entries(cluster.categories).sort((a, b) => b[1] - a[1])[0][0];
    return {
      latitude: cluster.latitude,
      longitude: cluster.longitude,
      count: cluster.count,
      label: categories.find((category) => category.id === topId)?.name ?? '',
    };
  });
}
