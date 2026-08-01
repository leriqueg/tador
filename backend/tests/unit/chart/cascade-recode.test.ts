import { describe, expect, it } from 'vitest';
import {
  collectSubtreeIds,
  planReparentCascade,
  type ChartNode,
} from '../../../src/domain/chart/cascade-recode.js';

const nodes: ChartNode[] = [
  { id: 'g4', parentId: null, codigo: '41000000', esPostable: false },
  { id: 'g4101', parentId: 'g4', codigo: '41010000', esPostable: false },
  { id: 'g4102', parentId: 'g4', codigo: '41020000', esPostable: false },
  {
    id: 'sueldo',
    parentId: 'g4101',
    codigo: '41010001',
    esPostable: true,
  },
  {
    id: 'extra',
    parentId: 'g4101',
    codigo: '41010002',
    esPostable: true,
  },
  { id: 'g6', parentId: null, codigo: '61000000', esPostable: false },
  { id: 'g6112', parentId: 'g6', codigo: '61120000', esPostable: false },
];

describe('cascade-recode', () => {
  it('collects subtree', () => {
    expect([...collectSubtreeIds(nodes, 'g4101')].sort()).toEqual(
      ['extra', 'g4101', 'sueldo'].sort(),
    );
  });

  it('reparents postable leaf under new group same class', () => {
    const plan = planReparentCascade(nodes, 'sueldo', 'g4102');
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.changes).toHaveLength(1);
    expect(plan.changes[0]).toMatchObject({
      id: 'sueldo',
      codigoBefore: '41010001',
      codigoAfter: '41020001',
      parentIdAfter: 'g4102',
    });
  });

  it('rejects cross-class reparent', () => {
    const plan = planReparentCascade(nodes, 'sueldo', 'g6112');
    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.error).toMatch(/cross-class/i);
  });

  it('rejects cycle', () => {
    const plan = planReparentCascade(nodes, 'g4', 'g4101');
    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.error).toMatch(/cycle/i);
  });

  it('reparents group with BBB rewrite for subtree', () => {
    const plan = planReparentCascade(nodes, 'g4101', 'g4102');
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const byId = Object.fromEntries(plan.changes.map((c) => [c.id, c]));
    expect(byId.g4101?.parentIdAfter).toBe('g4102');
    const newBbb = byId.g4101!.codigoAfter.slice(1, 4);
    expect(byId.g4101?.codigoAfter).toBe(`4${newBbb}0` + '000');
    expect(byId.sueldo?.codigoAfter).toBe(`4${newBbb}0` + '001');
    expect(byId.extra?.codigoAfter).toBe(`4${newBbb}0` + '002');
  });
});
