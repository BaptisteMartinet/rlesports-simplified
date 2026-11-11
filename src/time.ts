// Date and time helpers. Calendar dates are plain `YYYY-MM-DD` strings;
// instants are `Date` objects (always UTC internally).

export const TIME_ZONES = [
  { label: 'GMT', tz: 'UTC' },
  { label: 'Paris', tz: 'Europe/Paris' },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'LA', tz: 'America/Los_Angeles' },
] as const;

const MS_PER_DAY = 86_400_000;

function parseDate(date: string): [number, number, number] {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) throw new Error(`Invalid date "${date}"`);
  return [y, m, d];
}

function toDateString(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = parseDate(date);
  return toDateString(Date.UTC(y, m - 1, d) + days * MS_PER_DAY);
}

/** Adds calendar months, clamping to the last day of the month (Mar 31 − 1 month = Feb 28/29). */
export function addMonths(date: string, months: number): string {
  const [y, m, d] = parseDate(date);
  const lastDay = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate();
  return toDateString(Date.UTC(y, m - 1 + months, Math.min(d, lastDay)));
}

/** Offset of `tz` from UTC at the given instant, in milliseconds. */
function tzOffsetMs(instant: Date, tz: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
      .formatToParts(instant)
      .map((p) => [p.type, Number(p.value)]),
  );
  const asUtc = Date.UTC(parts.year!, parts.month! - 1, parts.day!, parts.hour!, parts.minute!, parts.second!);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** The instant when it is `time` (`HH:MM`) on `date` in time zone `tz`. */
export function zonedTime(date: string, time: string, tz: string): Date {
  const [y, m, d] = parseDate(date);
  const [hh, mm] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh!, mm!);
  // Two passes handle instants close to a daylight-saving change.
  let result = guess - tzOffsetMs(new Date(guess), tz);
  result = guess - tzOffsetMs(new Date(result), tz);
  return new Date(result);
}

/** Calendar date (`YYYY-MM-DD`) of an instant in a time zone. */
export function dateIn(instant: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(instant);
}

/** "4pm", "4:30pm", "12am". */
function clock(instant: Date, tz: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  );
  const minutes = parts.minute === '00' ? '' : `:${parts.minute}`;
  return `${parts.hour}${minutes}${parts.dayPeriod!.toLowerCase()}`;
}

/**
 * The same instant in every display time zone, for example
 * `["4pm GMT", "5pm Paris", "11am New York", "8am LA"]`.
 * A zone whose local day differs from the GMT day gets the weekday, so a
 * late-night European match reads "6pm Mon LA" rather than looking like the same day.
 * `approx` adds "~" for estimated start times.
 */
export function formatTimes(instant: Date, { approx = false } = {}): string[] {
  const gmtDay = dateIn(instant, 'UTC');
  return TIME_ZONES.map(({ label, tz }) => {
    const day =
      dateIn(instant, tz) === gmtDay
        ? ''
        : ` ${new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(instant)}`;
    return `${approx ? '~' : ''}${clock(instant, tz)}${day} ${label}`;
  });
}

const monthShort = (date: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));

/** "Dec 9–13", "Nov 30 – Dec 2", "Dec 30, 2026 – Jan 2, 2027". */
export function formatDateRange(start: string, end: string): string {
  const [sy, , sd] = parseDate(start);
  const [ey, , ed] = parseDate(end);
  if (start === end) return `${monthShort(start)} ${sd}`;
  if (sy !== ey) return `${monthShort(start)} ${sd}, ${sy} – ${monthShort(end)} ${ed}, ${ey}`;
  if (start.slice(0, 7) === end.slice(0, 7)) return `${monthShort(start)} ${sd}–${ed}`;
  return `${monthShort(start)} ${sd} – ${monthShort(end)} ${ed}`;
}

/** "December 2026" for a `YYYY-MM` month. */
export function formatMonth(month: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${month}-15T12:00:00Z`),
  );
}
