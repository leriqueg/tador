import { describe, it, expect } from 'vitest';
import {
  ancestorCodesOf,
  matchesGroups,
  resolveLineAccounts,
} from '../../src/application/plantilla-account-resolver.js';

describe('plantilla-account-resolver (in-memory)', () => {
  const byId = new Map([
    [
      'g-root',
      {
        id: 'g-root',
        codigo: '60000000',
        nombre: 'Gastos',
        parentId: null,
        esPostable: false,
      },
    ],
    [
      'g-group',
      {
        id: 'g-group',
        codigo: '61130000',
        nombre: 'Alimentación',
        parentId: 'g-root',
        esPostable: false,
      },
    ],
    [
      'g-leaf',
      {
        id: 'g-leaf',
        codigo: '61130001',
        nombre: 'Supermercado',
        parentId: 'g-group',
        esPostable: true,
      },
    ],
    [
      'g-bank',
      {
        id: 'g-bank',
        codigo: '11120000',
        nombre: 'Bancos',
        parentId: null,
        esPostable: false,
      },
    ],
    [
      'g-bank-leaf',
      {
        id: 'g-bank-leaf',
        codigo: '11120001',
        nombre: 'Cuenta corriente',
        parentId: 'g-bank',
        esPostable: true,
      },
    ],
  ]);

  it('walks ancestors in memory', () => {
    expect(ancestorCodesOf(byId, 'g-leaf')).toEqual([
      '61130001',
      '61130000',
      '60000000',
    ]);
  });

  it('matches group by ancestor codigo', () => {
    expect(matchesGroups(byId, 'g-leaf', ['61130000'])).toBe(true);
    expect(matchesGroups(byId, 'g-leaf', ['11120000'])).toBe(false);
  });

  it('resolves globals and user accounts for a line', () => {
    const accounts = resolveLineAccounts(
      {
        id: 1,
        side: 'debit',
        label: 'Tipo',
        strategy: 'from_group',
        groupCode: '61130000',
      },
      byId,
      [
        {
          id: 'u1',
          nombre: 'Mi gasto food',
          codigo: '61131001',
          globalId: 'g-leaf',
        },
      ],
    );

    expect(accounts.some((a) => a.id === 'g-leaf' && a.tipo === 'global')).toBe(
      true,
    );
    expect(accounts.some((a) => a.id === 'u1' && a.tipo === 'usuario')).toBe(
      true,
    );
  });
});
