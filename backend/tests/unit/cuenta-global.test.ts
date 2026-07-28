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
import {
  isValidGlobalAccountCodigo,
  isGroupCodigo,
  validateGlobalAccountCreate,
} from '../../src/domain/cuenta-global.js';

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

describe('CuentaGlobal codigo validation (013)', () => {
  it('accepts 8-digit codes and rejects shorter/longer', () => {
    expect(isValidGlobalAccountCodigo('61120001')).toBe(true);
    expect(isValidGlobalAccountCodigo('6112')).toBe(false);
    expect(isValidGlobalAccountCodigo('611200011')).toBe(false);
    expect(isValidGlobalAccountCodigo('6112000a')).toBe(false);
  });

  it('detects group codes ending in 000', () => {
    expect(isGroupCodigo('61120000')).toBe(true);
    expect(isGroupCodigo('61120001')).toBe(false);
  });

  it('rejects postable under postable parent', () => {
    const err = validateGlobalAccountCreate({
      codigo: '61120099',
      nombre: 'Child',
      esPostable: true,
      parentId: 'p1',
      parentEsPostable: true,
    });
    expect(err).toMatch(/non-postable group/i);
  });

  it('accepts postable under group parent', () => {
    expect(
      validateGlobalAccountCreate({
        codigo: '61120099',
        nombre: 'Child',
        esPostable: true,
        parentId: 'p1',
        parentEsPostable: false,
      }),
    ).toBeNull();
  });
});
