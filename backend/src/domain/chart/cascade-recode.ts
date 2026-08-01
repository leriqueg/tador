/**
 * Pure cascade recode planner for chart reparent.
 */

import { isGroupCodigo } from '../cuenta-global.js';
import {
  buildCodigo,
  isSameClass,
  nextFreeDdd,
  nextFreeGroupBbb,
  parseCodigo,
} from './codigo-segments.js';

export interface ChartNode {
  id: string;
  parentId: string | null;
  codigo: string;
  esPostable: boolean;
  nombre?: string;
}

export interface CodeChange {
  id: string;
  codigoBefore: string;
  codigoAfter: string;
  parentIdBefore: string | null;
  parentIdAfter: string | null;
}

export type CascadePlanResult =
  | { ok: true; changes: CodeChange[] }
  | { ok: false; error: string };

function childrenMap(nodes: ChartNode[]): Map<string, ChartNode[]> {
  const map = new Map<string, ChartNode[]>();
  for (const n of nodes) {
    if (!n.parentId) continue;
    const list = map.get(n.parentId) ?? [];
    list.push(n);
    map.set(n.parentId, list);
  }
  return map;
}

export function collectSubtreeIds(
  nodes: ChartNode[],
  rootId: string,
): Set<string> {
  const byParent = childrenMap(nodes);
  const out = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (out.has(id)) continue;
    out.add(id);
    for (const child of byParent.get(id) ?? []) {
      stack.push(child.id);
    }
  }
  return out;
}

export function planReparentCascade(
  nodes: ChartNode[],
  accountId: string,
  newParentId: string,
): CascadePlanResult {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const account = byId.get(accountId);
  const newParent = byId.get(newParentId);

  if (!account) return { ok: false, error: 'account not found' };
  if (!newParent) return { ok: false, error: 'parent not found' };
  if (newParent.esPostable) {
    return { ok: false, error: 'parent must be a non-postable group' };
  }
  if (!isSameClass(account.codigo, newParent.codigo)) {
    return { ok: false, error: 'cross-class reparent is not allowed' };
  }
  if (accountId === newParentId) {
    return { ok: false, error: 'cannot reparent account under itself' };
  }

  const subtree = collectSubtreeIds(nodes, accountId);
  if (subtree.has(newParentId)) {
    return { ok: false, error: 'cycle: new parent is in account subtree' };
  }

  const occupied = new Set(
    nodes.filter((n) => !subtree.has(n.id)).map((n) => n.codigo),
  );

  const parentSeg = parseCodigo(newParent.codigo);
  if (!parentSeg) return { ok: false, error: 'invalid parent codigo' };

  const subtreeNodes = nodes.filter((n) => subtree.has(n.id));
  const changes: CodeChange[] = [];

  if (!account.esPostable || isGroupCodigo(account.codigo)) {
    // Move group: allocate new BBB under same class, rewrite BBB for whole subtree.
    const groupCodes = new Set(
      [...occupied].filter((c) => isGroupCodigo(c)),
    );
    const newBbb = nextFreeGroupBbb(groupCodes, parentSeg.classDigit);
    if (!newBbb) return { ok: false, error: 'no free group BBB available' };

    for (const node of subtreeNodes) {
      const seg = parseCodigo(node.codigo);
      if (!seg) return { ok: false, error: `invalid codigo ${node.codigo}` };
      const after = buildCodigo({
        classDigit: seg.classDigit,
        bbb: newBbb,
        scope: seg.scope,
        ddd: seg.ddd,
      });
      if (occupied.has(after)) {
        return { ok: false, error: `codigo collision ${after}` };
      }
      occupied.add(after);
      changes.push({
        id: node.id,
        codigoBefore: node.codigo,
        codigoAfter: after,
        parentIdBefore: node.parentId,
        parentIdAfter: node.id === accountId ? newParentId : node.parentId,
      });
    }
    return { ok: true, changes };
  }

  // Postable leaf (and rare postable-with-descendants): root gets new DDD under parent BBB.
  const ddd = nextFreeDdd(
    occupied,
    parentSeg.classDigit,
    parentSeg.bbb,
    '0',
  );
  if (!ddd) return { ok: false, error: 'no free DDD under parent group' };

  const rootAfter = buildCodigo({
    classDigit: parentSeg.classDigit,
    bbb: parentSeg.bbb,
    scope: '0',
    ddd,
  });
  occupied.add(rootAfter);
  changes.push({
    id: account.id,
    codigoBefore: account.codigo,
    codigoAfter: rootAfter,
    parentIdBefore: account.parentId,
    parentIdAfter: newParentId,
  });

  const oldSeg = parseCodigo(account.codigo);
  if (!oldSeg) return { ok: false, error: 'invalid account codigo' };

  for (const node of subtreeNodes) {
    if (node.id === accountId) continue;
    const seg = parseCodigo(node.codigo);
    if (!seg) return { ok: false, error: `invalid codigo ${node.codigo}` };
    let after = buildCodigo({
      classDigit: parentSeg.classDigit,
      bbb: parentSeg.bbb,
      scope: seg.scope,
      ddd: seg.ddd,
    });
    if (occupied.has(after)) {
      const free = nextFreeDdd(
        occupied,
        parentSeg.classDigit,
        parentSeg.bbb,
        seg.scope,
      );
      if (!free) return { ok: false, error: 'no free DDD for descendant' };
      after = buildCodigo({
        classDigit: parentSeg.classDigit,
        bbb: parentSeg.bbb,
        scope: seg.scope,
        ddd: free,
      });
    }
    occupied.add(after);
    changes.push({
      id: node.id,
      codigoBefore: node.codigo,
      codigoAfter: after,
      parentIdBefore: node.parentId,
      parentIdAfter: node.parentId,
    });
  }

  return { ok: true, changes };
}
