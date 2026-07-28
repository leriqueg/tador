/**
 * UTC bucketing helpers for admin usage statistics (013 US5).
 */

export type Granularity = 'day' | 'week' | 'month';

export interface CountBucket {
  key: string;
  start: Date;
  end: Date;
  count: number;
}

function parseUtcDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatMonthKey(d: Date): string {
  return d.toISOString().slice(0, 7);
}

/** ISO week key: YYYY-Www (UTC). */
function formatWeekKey(d: Date): string {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  // Thursday in current week decides the year.
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function startOfUtcWeek(d: Date): Date {
  const day = startOfUtcDay(d);
  const dow = day.getUTCDay() || 7; // Mon=1 ... Sun=7
  day.setUTCDate(day.getUTCDate() - (dow - 1));
  return day;
}

function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addUtcDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + n);
  return next;
}

function addUtcMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

export function bucketKeyFor(date: Date, granularity: Granularity): string {
  if (granularity === 'day') return formatDayKey(date);
  if (granularity === 'month') return formatMonthKey(date);
  return formatWeekKey(date);
}

export function buildUtcBuckets(
  fromIso: string,
  toIso: string,
  granularity: Granularity,
): CountBucket[] {
  const from = parseUtcDate(fromIso);
  const to = parseUtcDate(toIso);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return [];
  }

  const buckets: CountBucket[] = [];

  if (granularity === 'day') {
    let cursor = startOfUtcDay(from);
    const end = startOfUtcDay(to);
    while (cursor <= end) {
      const next = addUtcDays(cursor, 1);
      buckets.push({
        key: formatDayKey(cursor),
        start: cursor,
        end: next,
        count: 0,
      });
      cursor = next;
    }
    return buckets;
  }

  if (granularity === 'month') {
    let cursor = startOfUtcMonth(from);
    const end = startOfUtcMonth(to);
    while (cursor <= end) {
      const next = addUtcMonths(cursor, 1);
      buckets.push({
        key: formatMonthKey(cursor),
        start: cursor,
        end: next,
        count: 0,
      });
      cursor = next;
    }
    return buckets;
  }

  // week
  let cursor = startOfUtcWeek(from);
  const end = startOfUtcWeek(to);
  while (cursor <= end) {
    const next = addUtcDays(cursor, 7);
    buckets.push({
      key: formatWeekKey(cursor),
      start: cursor,
      end: next,
      count: 0,
    });
    cursor = next;
  }
  return buckets;
}

export function assignToBucket(
  buckets: CountBucket[],
  timestamp: Date,
  granularity: Granularity,
): void {
  const key = bucketKeyFor(timestamp, granularity);
  const bucket = buckets.find((b) => b.key === key);
  if (bucket) bucket.count += 1;
}
