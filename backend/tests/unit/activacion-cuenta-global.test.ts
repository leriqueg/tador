/**
 * Unit tests: ActivacionCuentaGlobal domain entity.
 *
 * ActivacionCuentaGlobal tracks which global accounts a user has activated
 * (FR-009/010 hybrid model). A user may override the display name via
 * nombreOverride.
 *
 * Since ActivacionCuentaGlobal is an interface, tests create inline objects.
 */

import { describe, it, expect } from 'vitest';
import type { ActivacionCuentaGlobal } from '../../src/domain/activacion-cuenta-global.js';

function makeActivacion(
  overrides: Partial<ActivacionCuentaGlobal> = {},
): ActivacionCuentaGlobal {
  return {
    id: 'test-id',
    userId: 'user-1',
    globalId: 'global-1',
    activa: true,
    nombreOverride: null,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('ActivacionCuentaGlobal', () => {
  it('should create an activation with userId and globalId', () => {
    const activation = makeActivacion({
      userId: 'user-42',
      globalId: 'global-abc',
    });

    expect(activation.userId).toBe('user-42');
    expect(activation.globalId).toBe('global-abc');
  });

  it('should have activa=true by default', () => {
    const activation = makeActivacion({ activa: true });

    expect(activation.activa).toBe(true);
  });

  it('should allow activa=false when deactivated', () => {
    const activation = makeActivacion({ activa: false });

    expect(activation.activa).toBe(false);
  });

  it('should allow nombreOverride to be null (not set)', () => {
    const activation = makeActivacion({ nombreOverride: null });

    expect(activation.nombreOverride).toBeNull();
  });

  it('should allow nombreOverride to be a custom name', () => {
    const activation = makeActivacion({
      nombreOverride: 'My Custom Name',
    });

    expect(activation.nombreOverride).toBe('My Custom Name');
  });

  it('should set createdAt on creation', () => {
    const activation = makeActivacion({
      createdAt: new Date('2026-06-01'),
    });

    expect(activation.createdAt).toBeInstanceOf(Date);
    expect(activation.createdAt.toISOString()).toContain('2026');
  });

  it('should not have updatedAt field (inmutable after creation)', () => {
    const activation = makeActivacion();

    expect('updatedAt' in activation).toBe(false);
    expect((activation as Record<string, unknown>).updatedAt).toBeUndefined();
  });
});
