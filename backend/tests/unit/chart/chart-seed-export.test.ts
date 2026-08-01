import { describe, expect, it } from 'vitest';
import type { CuentaGlobal } from '../../../src/domain/cuenta-global.js';
import {
  buildChartSeedExport,
  computeNivel,
} from '../../../src/application/chart/chart-seed-export.js';

function acct(
  overrides: Partial<CuentaGlobal> &
    Pick<CuentaGlobal, 'id' | 'codigo' | 'nombre' | 'esPostable'>,
): CuentaGlobal {
  return {
    parentId: null,
    descripcion: '',
    legacyId: null,
    legacyCode: null,
    deprecatedAt: null,
    reportRole: 'normal',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('chart-seed-export', () => {
  it('computes nivel from parent chain', () => {
    const parents = new Map<string, string | null>([
      ['41000000', null],
      ['41010000', '41000000'],
      ['41010001', '41010000'],
    ]);
    expect(computeNivel('41000000', parents)).toBe(0);
    expect(computeNivel('41010000', parents)).toBe(1);
    expect(computeNivel('41010001', parents)).toBe(2);
  });

  it('builds seed-shaped export with codigoPadre and summary', () => {
    const accounts = [
      acct({
        id: 'a1',
        codigo: '41010001',
        nombre: 'Sueldo',
        esPostable: true,
        parentId: 'g2',
        reportRole: 'normal',
      }),
      acct({
        id: 'g1',
        codigo: '41000000',
        nombre: 'Ingresos',
        esPostable: false,
      }),
      acct({
        id: 'g2',
        codigo: '41010000',
        nombre: 'Nómina',
        esPostable: false,
        parentId: 'g1',
        reportRole: 'contra',
        deprecatedAt: new Date('2026-08-01T12:00:00.000Z'),
      }),
    ];

    const exportPayload = buildChartSeedExport(
      accounts,
      new Date('2026-08-01T15:00:00.000Z'),
    );

    expect(exportPayload.schemaVersion).toBe('0.5.0');
    expect(exportPayload.source).toBe('live-database');
    expect(exportPayload.exportedAt).toBe('2026-08-01T15:00:00.000Z');
    expect(exportPayload.summary).toEqual({
      totalAccounts: 3,
      groups: 2,
      postable: 1,
      roots: 1,
      deprecated: 1,
      contra: 1,
    });

    expect(exportPayload.accounts.map((a) => a.codigo)).toEqual([
      '41000000',
      '41010000',
      '41010001',
    ]);
    expect(exportPayload.accounts[2]).toMatchObject({
      codigo: '41010001',
      codigoPadre: '41010000',
      nivel: 2,
      naturaleza: 'postable',
      clasificacion: 'income',
      esPostable: true,
    });
  });
});
