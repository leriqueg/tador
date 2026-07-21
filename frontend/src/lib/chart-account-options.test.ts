import { describe, expect, it } from 'vitest';
import {
  inferTipoCuentaFromCodigo,
  mergePostableGlobalsIntoAccounts,
} from './chart-account-options.ts';
import type { AccountSummary, ChartGlobalNode } from './api.ts';

describe('chart-account-options', () => {
  it('maps income and expense prefixes', () => {
    expect(inferTipoCuentaFromCodigo('41010001')).toBe('incomeCategory');
    expect(inferTipoCuentaFromCodigo('61010001')).toBe('expenseCategory');
    expect(inferTipoCuentaFromCodigo('11110001')).toBe('wallet');
  });

  it('merges user accounts before globals and skips same-name catalog duplicates', () => {
    const chart: ChartGlobalNode[] = [
      {
        id: 'g-group',
        parentId: null,
        codigo: '41010000',
        nombre: 'Trabajo dependiente',
        esPostable: false,
      },
      {
        id: 'g-sueldo',
        parentId: 'g-group',
        codigo: '41010001',
        nombre: 'Sueldo / Salario',
        esPostable: true,
      },
      {
        id: 'g-billetera',
        parentId: null,
        codigo: '11110001',
        nombre: 'Billetera',
        esPostable: true,
      },
    ];
    const user: AccountSummary[] = [
      {
        id: 'u-wallet',
        codigo: null,
        nombre: 'Billetera',
        tipoCuenta: 'wallet',
        entidadId: null,
        isEntityProvisioned: false,
        activa: true,
      },
      {
        id: 'u1',
        codigo: '41011001',
        nombre: 'Mi ingreso custom',
        tipoCuenta: 'incomeCategory',
        entidadId: null,
        isEntityProvisioned: false,
        activa: true,
      },
    ];

    const merged = mergePostableGlobalsIntoAccounts(chart, user);
    expect(merged.map((a) => a.id)).toEqual(['u-wallet', 'u1', 'g-sueldo']);
    expect(merged.find((a) => a.id === 'g-billetera')).toBeUndefined();
  });
});
