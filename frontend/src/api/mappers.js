import { buildCategory, categoryId } from '../models/categories';
import { EMPTY_SETTINGS } from '../state/appReducer';

const hhmm = (time) => (time ? time.slice(0, 5) : '');

export function toCategory(row) {
  return { ...buildCategory(row.name, row.color), serverId: row.id };
}

// GET /me -> app user. A profile that is not onboarded yet keeps the empty settings.
export function toUser(me) {
  const settings = me.is_onboarded
    ? {
        categories: me.categories.map(toCategory),
        notificationsCount: me.notifications_count,
        wakeTime: hhmm(me.wake_time),
        sleepTime: hhmm(me.sleep_time),
        notificationsEnabled: me.notifications_enabled,
        gpsEnabled: me.gps_enabled,
      }
    : EMPTY_SETTINGS;
  return { email: me.email, isOnboarded: Boolean(me.is_onboarded), settings };
}

// Settings from the onboarding screen -> PUT /me body.
export function toProfileBody(settings) {
  return {
    notifications_count: settings.notificationsCount,
    wake_time: settings.wakeTime,
    sleep_time: settings.sleepTime,
    notifications_enabled: settings.notificationsEnabled,
    gps_enabled: settings.gpsEnabled,
    is_onboarded: true,
    categories: settings.categories.map(({ name, color }) => ({ name, color })),
  };
}

// Server check-in row -> app check-in.
export function toCheckin(row) {
  return {
    id: String(row.id),
    categoryId: row.category ? categoryId(row.category.name) : null,
    description: row.description ?? '',
    mood: row.mood,
    energyLevel: row.energy_level,
    status: row.status,
    latitude: row.latitude,
    longitude: row.longitude,
    scheduledAt: new Date(row.scheduled_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    isManual: row.is_manual,
  };
}

// App check-in entry -> POST /checkins body (needs the server id of the category).
export function toCheckinBody(entry, serverCategoryId, coords) {
  return {
    category_id: serverCategoryId,
    description: entry.description || undefined,
    mood: entry.mood,
    energy_level: entry.energyLevel,
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
    scheduled_at: entry.scheduledAt ? new Date(entry.scheduledAt).toISOString() : undefined,
  };
}

// POST /insights or GET /insights/latest row (Bielik's answer) -> the card shape InsightsScreen draws.
// `total` is how many of the user's entries fall into the analysed window.
export function toInsight(row, total) {
  const data = row.structured_data ?? {};
  const days = Math.max(1, Math.round((new Date(row.to_date) - new Date(row.from_date)) / 864e5));
  return {
    status: 'ready',
    total,
    days,
    title: row.description,
    bullets: data.happiest_time
      ? [{ tone: 'purple', text: `Najszczęśliwszy jesteś: ${data.happiest_time}` }]
      : [],
    chips: [
      ...(data.energy_boosters ?? []).map((text) => ({ tone: 'green', text: `↑ ${text}` })),
      ...(data.energy_drainers ?? []).map((text) => ({ tone: 'orange', text: `↓ ${text}` })),
    ],
  };
}
