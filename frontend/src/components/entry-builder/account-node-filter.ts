/**
 * Filter account options for a pick_account graph node.
 */

import type { AccountSummary, ChartGlobalNode } from '../../lib/api.ts';
import type { PickAccountNode } from './decision-graph.ts';

function ancestorCodigos(
  chartById: Map<string, ChartGlobalNode>,
  startId: string,
): string[] {
  const codes: string[] = [];
  const visited = new Set<string>();
  let current: string | null = startId;
  let depth = 0;
  while (current && depth < 12) {
    if (visited.has(current)) break;
    visited.add(current);
    const node = chartById.get(current);
    if (!node) break;
    codes.push(node.codigo);
    current = node.parentId;
    depth++;
  }
  return codes;
}

function resolveChartId(
  account: AccountSummary,
  chartByCodigo: Map<string, ChartGlobalNode>,
  chartById: Map<string, ChartGlobalNode>,
): string | null {
  if (chartById.has(account.id)) return account.id;
  if (account.codigo && chartByCodigo.has(account.codigo)) {
    return chartByCodigo.get(account.codigo)!.id;
  }
  return null;
}

export function filterAccountsForPickNode(
  accounts: AccountSummary[],
  node: PickAccountNode,
  chart: ChartGlobalNode[] = [],
): AccountSummary[] {
  const chartById = new Map(chart.map((n) => [n.id, n]));
  const chartByCodigo = new Map(chart.map((n) => [n.codigo, n]));
  const groups = new Set(node.groupCodes ?? []);

  return accounts.filter((account) => {
    if (account.activa === false) return false;
    if (node.tipoCuenta?.length && !node.tipoCuenta.includes(account.tipoCuenta)) {
      return false;
    }
    if (groups.size === 0) return true;

    const chartId = resolveChartId(account, chartByCodigo, chartById);
    if (chartId) {
      const ancestors = ancestorCodigos(chartById, chartId);
      if (ancestors.some((c) => groups.has(c))) return true;
    }

    if (account.codigo) {
      for (const g of groups) {
        if (account.codigo === g || account.codigo.startsWith(g)) return true;
        // User codes [A][BBB][1][DDD] under mother ABBB…
        if (g.length >= 4 && account.codigo.slice(0, 4) === g.slice(0, 4)) return true;
      }
    }
    return false;
  });
}
