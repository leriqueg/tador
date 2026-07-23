/**
 * Admin usage statistics application service (013 US5).
 */

import type { AdminStatisticsReadRepository } from '../ports/admin-statistics-read-repository.js';
import {
  assignToBucket,
  buildUtcBuckets,
  type Granularity,
} from './admin-statistics-bucketing.js';

export interface StatisticsSeriesPoint {
  key: string;
  registrations: number;
  logins: number;
  apuntesCreated: number;
  activeUsers: number;
}

export interface StatisticsOverview {
  from: string;
  to: string;
  granularity: Granularity;
  series: StatisticsSeriesPoint[];
}

export interface AdminStatisticsApplicationService {
  overview(
    from: string,
    to: string,
    granularity: Granularity,
  ): Promise<StatisticsOverview>;
}

function parseRange(
  from: string,
  to: string,
): { start: Date; endExclusive: Date } | null {
  const start = new Date(`${from}T00:00:00.000Z`);
  const endDay = new Date(`${to}T00:00:00.000Z`);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(endDay.getTime()) ||
    start > endDay
  ) {
    return null;
  }
  const endExclusive = new Date(endDay);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return { start, endExclusive };
}

export function createAdminStatisticsApplicationService(
  reads: AdminStatisticsReadRepository,
): AdminStatisticsApplicationService {
  return {
    async overview(from, to, granularity) {
      const range = parseRange(from, to);
      const buckets = buildUtcBuckets(from, to, granularity);
      const series: StatisticsSeriesPoint[] = buckets.map((b) => ({
        key: b.key,
        registrations: 0,
        logins: 0,
        apuntesCreated: 0,
        activeUsers: 0,
      }));

      if (!range || series.length === 0) {
        return { from, to, granularity, series };
      }

      const [users, sessions, apuntes] = await Promise.all([
        reads.listUserCreatedAts(range.start, range.endExclusive),
        reads.listSessionCreatedAts(range.start, range.endExclusive),
        reads.listApunteCreatedAts(range.start, range.endExclusive),
      ]);

      const regBuckets = buildUtcBuckets(from, to, granularity);
      const loginBuckets = buildUtcBuckets(from, to, granularity);
      const apunteBuckets = buildUtcBuckets(from, to, granularity);
      const activeByKey = new Map<string, Set<string>>();

      for (const createdAt of users) {
        assignToBucket(regBuckets, createdAt, granularity);
      }
      for (const s of sessions) {
        assignToBucket(loginBuckets, s.createdAt, granularity);
        const bucket = loginBuckets.find(
          (b) => s.createdAt >= b.start && s.createdAt < b.end,
        );
        if (bucket) {
          if (!activeByKey.has(bucket.key)) {
            activeByKey.set(bucket.key, new Set());
          }
          activeByKey.get(bucket.key)!.add(s.userId);
        }
      }
      for (const createdAt of apuntes) {
        assignToBucket(apunteBuckets, createdAt, granularity);
      }

      return {
        from,
        to,
        granularity,
        series: series.map((point, i) => ({
          key: point.key,
          registrations: regBuckets[i]?.count ?? 0,
          logins: loginBuckets[i]?.count ?? 0,
          apuntesCreated: apunteBuckets[i]?.count ?? 0,
          activeUsers: activeByKey.get(point.key)?.size ?? 0,
        })),
      };
    },
  };
}
