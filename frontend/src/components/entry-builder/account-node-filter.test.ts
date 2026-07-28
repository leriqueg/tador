import { describe, expect, it } from 'vitest';
import { filterAccountsForPickNode } from './account-node-filter.ts';
import type { AccountSummary, ChartGlobalNode } from '../../lib/api.ts';
import type { PickAccountNode } from './decision-graph.ts';

const chart: ChartGlobalNode[] = [
  { id: 'g-liq', parentId: null, codigo: '11110000', nombre: 'Efectivo', esPostable: false },
  { id: 'g-bill', parentId: 'g-liq', codigo: '11110001', nombre: 'Billetera', esPostable: true },
  { id: 'g-ing', parentId: null, codigo: '41010000', nombre: 'Trabajo', esPostable: false },
  { id: 'g-sueldo', parentId: 'g-ing', codigo: '41010001', nombre: 'Sueldo', esPostable: true },
  { id: 'g-exp', parentId: null, codigo: '61000000', nombre: 'Gastos', esPostable: false },
];

function acc(partial: Partial<AccountSummary>): AccountSummary {
  return {
    id: 'a',
    codigo: null,
    nombre: 'X',
    tipoCuenta: 'wallet',
    entidadId: null,
    isEntityProvisioned: false,
    activa: true,
    ...partial,
  };
}

describe('filterAccountsForPickNode', () => {
  it('keeps liquidity accounts under 11110000 / 11120000', () => {
    const node: PickAccountNode = {
      id: 'n',
      kind: 'pick_account',
      question: '¿Dónde?',
      role: 'debit',
      groupCodes: ['11110000', '11120000'],
      next: 'x',
    };
    const accounts = [
      acc({ id: 'g-bill', codigo: '11110001', tipoCuenta: 'wallet', nombre: 'Billetera' }),
      acc({ id: 'g-sueldo', codigo: '41010001', tipoCuenta: 'incomeCategory', nombre: 'Sueldo' }),
    ];
    const filtered = filterAccountsForPickNode(accounts, node, chart);
    expect(filtered.map((a) => a.id)).toEqual(['g-bill']);
  });

  it('keeps income under 41010000 for salary category step', () => {
    const node: PickAccountNode = {
      id: 'n',
      kind: 'pick_account',
      question: 'Categoría',
      role: 'credit',
      groupCodes: ['41010000'],
      next: 'x',
    };
    const accounts = [
      acc({ id: 'g-sueldo', codigo: '41010001', tipoCuenta: 'incomeCategory' }),
      acc({ id: 'g-bill', codigo: '11110001', tipoCuenta: 'wallet' }),
    ];
    expect(filterAccountsForPickNode(accounts, node, chart).map((a) => a.id)).toEqual([
      'g-sueldo',
    ]);
  });
});
