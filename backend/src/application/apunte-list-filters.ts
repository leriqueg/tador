/**
 * Pure helpers for apunte list filters (unit-tested; used by route).
 */

export interface ApunteListQuery {
  dateFrom?: string;
  dateTo?: string;
  amountMin?: string;
  amountMax?: string;
  q?: string;
  accountId?: string;
}

export function buildApunteListWhere(
  userId: string,
  query: ApunteListQuery,
): Record<string, unknown> {
  const where: Record<string, unknown> = { userId };

  if (query.dateFrom || query.dateTo) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (query.dateFrom) {
      const d = new Date(query.dateFrom);
      if (!Number.isNaN(d.getTime())) dateFilter.gte = d;
    }
    if (query.dateTo) {
      const d = new Date(query.dateTo);
      if (!Number.isNaN(d.getTime())) {
        d.setUTCHours(23, 59, 59, 999);
        dateFilter.lte = d;
      }
    }
    if (Object.keys(dateFilter).length > 0) where.date = dateFilter;
  }

  if (query.amountMin || query.amountMax) {
    const amountFilter: { gte?: number; lte?: number } = {};
    if (query.amountMin) {
      const n = Number(query.amountMin);
      if (Number.isFinite(n)) amountFilter.gte = n;
    }
    if (query.amountMax) {
      const n = Number(query.amountMax);
      if (Number.isFinite(n)) amountFilter.lte = n;
    }
    if (Object.keys(amountFilter).length > 0) where.amount = amountFilter;
  }

  if (query.q?.trim()) {
    where.concept = {
      contains: query.q.trim(),
      mode: 'insensitive',
    };
  }

  if (query.accountId?.trim()) {
    const accountId = query.accountId.trim();
    where.asiento = {
      lineas: {
        some: {
          OR: [{ cuentaId: accountId }, { cuentaGlobalId: accountId }],
        },
      },
    };
  }

  return where;
}
