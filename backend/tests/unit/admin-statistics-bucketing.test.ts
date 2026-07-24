/**
 * Unit tests: admin statistics bucketing (013 T083).
 */

import { describe, it, expect } from 'vitest';
import {
  buildUtcBuckets,
  assignToBucket,
  type Granularity,
} from '../../src/application/admin/admin-statistics-bucketing.js';

describe('admin-statistics-bucketing', () => {
  it('builds 7 daily buckets for a week range', () => {
    const buckets = buildUtcBuckets(
      '2026-07-01',
      '2026-07-07',
      'day',
    );
    expect(buckets).toHaveLength(7);
    expect(buckets[0].key).toBe('2026-07-01');
    expect(buckets[6].key).toBe('2026-07-07');
    expect(buckets.every((b) => b.count === 0)).toBe(true);
  });

  it('builds week and month buckets with different keys', () => {
    const weeks = buildUtcBuckets('2026-07-01', '2026-07-31', 'week');
    const months = buildUtcBuckets('2026-06-01', '2026-08-31', 'month');
    expect(weeks.length).toBeGreaterThanOrEqual(4);
    expect(months.map((b) => b.key)).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
    ]);
    expect(weeks[0].key).not.toEqual(months[0].key);
  });

  it('assigns timestamps into the correct day bucket', () => {
    const buckets = buildUtcBuckets('2026-07-01', '2026-07-03', 'day');
    const g: Granularity = 'day';
    assignToBucket(buckets, new Date('2026-07-02T15:00:00.000Z'), g);
    assignToBucket(buckets, new Date('2026-07-02T23:59:59.000Z'), g);
    assignToBucket(buckets, new Date('2026-07-04T00:00:00.000Z'), g);
    expect(buckets.find((b) => b.key === '2026-07-02')?.count).toBe(2);
    expect(buckets.find((b) => b.key === '2026-07-01')?.count).toBe(0);
    expect(buckets.find((b) => b.key === '2026-07-03')?.count).toBe(0);
  });
});
