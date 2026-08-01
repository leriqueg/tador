import { describe, expect, it } from 'vitest';
import { buildChartSeedExport } from '../../../src/application/chart/chart-seed-export.js';
import { sortAccountsForSeed } from '../../../src/application/chart/chart-seed-format.js';
import type { CuentaGlobal } from '../../../src/domain/cuenta-global.js';

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

describe('export ↔ seed contract', () => {
  it('export accounts include every field the seed upserts', () => {
    const exportPayload = buildChartSeedExport([
      acct({
        id: 'g1',
        codigo: '41000000',
        nombre: 'Ingresos',
        esPostable: false,
        descripcion: 'Clase 4',
      }),
      acct({
        id: 'p1',
        codigo: '41010001',
        nombre: 'Sueldo',
        esPostable: true,
        parentId: 'g1',
        legacyId: 12,
        legacyCode: '4.1.1',
        reportRole: 'contra',
        deprecatedAt: new Date('2026-08-01T00:00:00.000Z'),
      }),
    ]);

    for (const row of exportPayload.accounts) {
      expect(typeof row.codigo).toBe('string')
      expect(typeof row.nombre).toBe('string')
      expect(typeof row.esPostable).toBe('boolean')
      expect(row.codigoPadre === null || typeof row.codigoPadre === 'string').toBe(
        true,
      )
      expect(row.legacyId === null || typeof row.legacyId === 'number').toBe(true)
      expect(
        row.legacyCodigo === null || typeof row.legacyCodigo === 'string',
      ).toBe(true)
      expect(typeof row.descripcion).toBe('string')
      expect(['normal', 'contra']).toContain(row.reportRole)
      expect(
        row.deprecatedAt === null || typeof row.deprecatedAt === 'string',
      ).toBe(true)
    }

    const ordered = sortAccountsForSeed(exportPayload.accounts);
    expect(ordered.map((a) => a.codigo)).toEqual(['41000000', '41010001']);
    expect(ordered[1]?.codigoPadre).toBe('41000000');
  });

  it('legacy 0.4.0-shaped rows still sort and keep seed-required keys', () => {
    const legacyRows = [
      {
        codigo: '41010001',
        nombre: 'Sueldo',
        esPostable: true,
        codigoPadre: '41000000',
        legacyId: null,
        legacyCodigo: null,
      },
      {
        codigo: '41000000',
        nombre: 'Ingresos',
        esPostable: false,
        codigoPadre: null,
        legacyId: null,
        legacyCodigo: null,
      },
    ];
    expect(sortAccountsForSeed(legacyRows).map((a) => a.codigo)).toEqual([
      '41000000',
      '41010001',
    ]);
  });
});
