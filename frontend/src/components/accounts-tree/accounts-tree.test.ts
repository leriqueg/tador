import { describe, expect, it } from 'vitest';
import {
  buildAccountsTree,
  findAccountsTreeGroup,
  friendlyAccountCreateError,
  listAllowedCreateMothers,
  manualCreateAccountTypes,
  resolveParentCodigo,
} from './accounts-tree.ts';
import type { AccountSummary, ChartGlobalNode } from '../../lib/api.ts';

function chartNode(overrides: Partial<ChartGlobalNode>): ChartGlobalNode {
  return {
    id: 'g1',
    parentId: null,
    codigo: '61000000',
    nombre: 'Gastos',
    esPostable: false,
    ...overrides,
  };
}

function account(overrides: Partial<AccountSummary>): AccountSummary {
  return {
    id: 'a1',
    codigo: '61010001',
    nombre: 'Servicios',
    tipoCuenta: 'expenseCategory',
    entidadId: null,
    isEntityProvisioned: false,
    activa: true,
    ...overrides,
  };
}

describe('accounts-tree — hierarchy (US4, T022)', () => {
  const chart: ChartGlobalNode[] = [
    chartNode({ id: 'root-exp', codigo: '61000000', nombre: 'Gastos', esPostable: false }),
    chartNode({
      id: 'grp-serv',
      parentId: 'root-exp',
      codigo: '61010000',
      nombre: 'Servicios',
      esPostable: false,
    }),
    chartNode({
      id: 'grp-ing',
      parentId: null,
      codigo: '41010000',
      nombre: 'Ingresos operacionales',
      esPostable: false,
    }),
  ];

  it('nests user accounts under the closest chart mother by codigo prefix', () => {
    const accounts = [
      account({ id: 'u1', codigo: '61010001', nombre: 'Internet' }),
      account({ id: 'u2', codigo: '41010002', nombre: 'Ventas', tipoCuenta: 'incomeCategory' }),
    ];
    const tree = buildAccountsTree(chart, accounts, {});
    const servicios = findAccountsTreeGroup(tree, '61010000');
    expect(servicios?.accounts.map((a) => a.id)).toEqual(['u1']);
    const ingresos = findAccountsTreeGroup(tree, '41010000');
    expect(ingresos?.accounts.map((a) => a.id)).toEqual(['u2']);
  });

  it('attaches saldo when balance map is provided', () => {
    const accounts = [account({ id: 'u1', codigo: '61010001' })];
    const tree = buildAccountsTree(chart, accounts, { u1: 250.5 });
    const servicios = findAccountsTreeGroup(tree, '61010000');
    expect(servicios?.accounts[0]?.saldo).toBe(250.5);
  });

  it('resolves parent codigo for an account', () => {
    expect(resolveParentCodigo(chart, account({ codigo: '61010001' }))).toBe('61010000');
  });
});

describe('accounts-tree — create under mother (US4, T023)', () => {
  const chart: ChartGlobalNode[] = [
    chartNode({ id: 'g-exp', codigo: '61000000', nombre: 'Gastos', esPostable: false }),
    chartNode({
      id: 'g-bridge',
      codigo: '11990000',
      nombre: 'Puente',
      esPostable: false,
    }),
    chartNode({
      id: 'g-postable',
      codigo: '61010000',
      nombre: 'Servicios',
      esPostable: true,
    }),
  ];

  it('lists non-postable chart nodes as allowed mothers', () => {
    const mothers = listAllowedCreateMothers(chart);
    expect(mothers.map((m) => m.codigo)).toEqual(['11990000', '61000000']);
  });

  it('excludes bank/card from manual create types', () => {
    expect(manualCreateAccountTypes()).not.toContain('bank');
    expect(manualCreateAccountTypes()).not.toContain('card');
    expect(manualCreateAccountTypes()).toContain('expenseCategory');
  });

  it('maps bank/card API 422 to everyday language', () => {
    expect(
      friendlyAccountCreateError(
        'bank and card accounts must be created via POST /api/entities (FR-004b)',
      ),
    ).toMatch(/entidad/i);
  });
});
