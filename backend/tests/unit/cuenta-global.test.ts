/**
 * Unit tests: CuentaGlobal domain entity.
 *
 * CuentaGlobal represents a global chart-of-accounts entry with hierarchical
 * structure. Leaf accounts (esPostable = true) can be posted to; groups cannot.
 *
 * Since CuentaGlobal is an interface, tests create inline objects matching it.
 */

import { describe, it, expect } from 'vitest';
import type { CuentaGlobal } from '../../src/domain/cuenta-global.js';

function makeCuenta(overrides: Partial<CuentaGlobal> = {}): CuentaGlobal {
  return {
    id: 'test-id',
    parentId: null,
    codigo: '1',
    nombre: 'Test Account',
    descripcion: 'A test account',
    esPostable: true,
    legacyId: null,
    legacyCode: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('CuentaGlobal', () => {
  it('should create a postable leaf account with esPostable=true', () => {
    const cuenta = makeCuenta({ esPostable: true });

    expect(cuenta.esPostable).toBe(true);
    expect(cuenta.codigo).toBe('1');
    expect(cuenta.nombre).toBe('Test Account');
  });

  it('should create a non-postable group account with esPostable=false', () => {
    const cuenta = makeCuenta({ esPostable: false });

    expect(cuenta.esPostable).toBe(false);
  });

  it('should support parent-child hierarchy via parentId', () => {
    const parent = makeCuenta({
      id: 'parent-1',
      parentId: null,
      codigo: '1',
      nombre: 'Assets',
      esPostable: false,
    });

    const child = makeCuenta({
      id: 'child-1',
      parentId: 'parent-1',
      codigo: '1.1',
      nombre: 'Cash',
      esPostable: true,
    });

    expect(child.parentId).toBe(parent.id);
  });

  it('should preserve legacy references when provided', () => {
    const cuenta = makeCuenta({
      legacyId: 42,
      legacyCode: 'LEGACY-001',
    });

    expect(cuenta.legacyId).toBe(42);
    expect(cuenta.legacyCode).toBe('LEGACY-001');
  });

  it('should have null legacy fields when not migrated', () => {
    const cuenta = makeCuenta();

    expect(cuenta.legacyId).toBeNull();
    expect(cuenta.legacyCode).toBeNull();
  });
});
