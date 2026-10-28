const WEEKDAYS = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
const WEEKDAYS_SHORT = ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'];
const MONTHS = [
  'stycznia',
  'lutego',
  'marca',
  'kwietnia',
  'maja',
  'czerwca',
  'lipca',
  'sierpnia',
  'września',
  'października',
  'listopada',
  'grudnia',
];
const MONTHS_SHORT = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
];

export const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (value) => String(value).padStart(2, '0');
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const dayKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// "14:20"
export const formatTime = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

// "Czwartek, 15 października"
export const formatLongDate = (date) =>
  `${capitalize(WEEKDAYS[date.getDay()])}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;

// "czw., 15 paź"
export const formatShortDate = (date) =>
  `${WEEKDAYS_SHORT[date.getDay()]}, ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;

// "Dzisiaj · czw., 15 paź" / "Wczoraj · śr., 14 paź" / "Wt., 13 paź"
export function formatDayHeading(date, now = new Date()) {
  const diff = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (diff === 0) return `Dzisiaj · ${formatShortDate(date)}`;
  if (diff === 1) return `Wczoraj · ${formatShortDate(date)}`;
  return capitalize(formatShortDate(date));
}

// "07:00" -> minutes since midnight, null when unset or malformed.
export function timeToMinutes(time) {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

// "23:00" -> "11:00 PM", unset -> "--:--"
export function formatTime12(time) {
  const minutes = timeToMinutes(time);
  if (minutes === null) return '--:--';
  const hours = Math.floor(minutes / 60);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${pad(hours % 12 === 0 ? 12 : hours % 12)}:${pad(minutes % 60)} ${suffix}`;
}

export const makeTime = (hours, minutes) => `${pad(hours)}:${pad(minutes)}`;

// Length of the user's waking window in hours (handles a sleep time after midnight).
export function activeHoursPerDay(wakeTime, sleepTime) {
  const start = timeToMinutes(wakeTime);
  const end = timeToMinutes(sleepTime);
  if (start === null || end === null) return 0;
  const diff = end - start;
  return (diff > 0 ? diff : diff + 24 * 60) / 60;
}

export function pluralize(count, [one, few, many]) {
  if (count === 1) return one;
  const lastTwo = count % 100;
  const last = count % 10;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return few;
  return many;
}

export const formatDecimal = (value, digits = 1) =>
  Number(value.toFixed(digits)).toString().replace('.', ',');
