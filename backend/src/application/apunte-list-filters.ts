/**
 * Pure helpers for apunte list filters (unit-tested; adapter maps to persistence).
 */

export interface ApunteListQuery {
  dateFrom?: string;
  dateTo?: string;
  amountMin?: string;
  amountMax?: string;
  q?: string;
  accountId?: string;
}

export interface ApunteListFilter {
  userId: string;
  dateGte?: Date;
  dateLte?: Date;
  amountGte?: string;
  amountLte?: string;
  conceptContains?: string;
  accountId?: string;
}

export function buildApunteListFilter(
  userId: string,
  query: ApunteListQuery,
): ApunteListFilter {
  const filter: ApunteListFilter = { userId };

  if (query.dateFrom || query.dateTo) {
    if (query.dateFrom) {
      const d = new Date(query.dateFrom);
      if (!Number.isNaN(d.getTime())) filter.dateGte = d;
    }
    if (query.dateTo) {
      const d = new Date(query.dateTo);
      if (!Number.isNaN(d.getTime())) {
        d.setUTCHours(23, 59, 59, 999);
        filter.dateLte = d;
      }
    }
  }

  if (query.amountMin?.trim()) {
    const n = Number(query.amountMin);
    if (Number.isFinite(n)) filter.amountGte = query.amountMin.trim();
  }
  if (query.amountMax?.trim()) {
    const n = Number(query.amountMax);
    if (Number.isFinite(n)) filter.amountLte = query.amountMax.trim();
  }

  if (query.q?.trim()) {
    filter.conceptContains = query.q.trim();
  }

  if (query.accountId?.trim()) {
    filter.accountId = query.accountId.trim();
  }

  return filter;
}

export function parseApunteListPagination(query: {
  limit?: string;
  offset?: string;
}): { limit: number; offset: number } {
  const limitRaw = query.limit ? parseInt(query.limit, 10) : 20;
  const offsetRaw = query.offset ? parseInt(query.offset, 10) : 0;
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 100)
    : 20;
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;
  return { limit, offset };
}
