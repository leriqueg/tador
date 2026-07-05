/**
 * Unit tests: CuentaUsuario domain entity.
 *
 * CuentaUsuario represents a user-created account: bank accounts, credit/debit
 * cards, digital wallets, or bridge/transfer accounts.
 *
 * Since CuentaUsuario is an interface, tests create inline objects matching it.
 */

import { describe, it, expect } from 'vitest';
import type { CuentaUsuario, TipoCuenta } from '../../src/domain/cuenta-usuario.js';

function makeCuenta(overrides: Partial<CuentaUsuario> = {}): CuentaUsuario {
  return {
    id: 'test-id',
    userId: 'user-1',
    globalId: null,
    entidadId: null,
    tipoCuenta: 'bank',
    nombre: 'Test Account',
    codigoPersonalizado: null,
    activa: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('CuentaUsuario', () => {
  it('should create a bank account with tipoCuenta=bank', () => {
    const cuenta = makeCuenta({ tipoCuenta: 'bank' });

    expect(cuenta.tipoCuenta).toBe('bank');
  });

  it('should create a card account with tipoCuenta=card', () => {
    const cuenta = makeCuenta({ tipoCuenta: 'card' });

    expect(cuenta.tipoCuenta).toBe('card');
  });

  it('should create a wallet account with tipoCuenta=wallet', () => {
    const cuenta = makeCuenta({ tipoCuenta: 'wallet' });

    expect(cuenta.tipoCuenta).toBe('wallet');
  });

  it('should create a bridge account with tipoCuenta=bridge', () => {
    const cuenta = makeCuenta({ tipoCuenta: 'bridge' });

    expect(cuenta.tipoCuenta).toBe('bridge');
  });

  it('should have activa=true by convention', () => {
    const cuenta = makeCuenta({ activa: true });

    expect(cuenta.activa).toBe(true);
  });

  it('should allow activa=false when deactivated', () => {
    const cuenta = makeCuenta({ activa: false });

    expect(cuenta.activa).toBe(false);
  });

  it('should require userId (non-empty string)', () => {
    const cuenta = makeCuenta({ userId: 'user-42' });

    expect(cuenta.userId).toBe('user-42');
    expect(cuenta.userId.length).toBeGreaterThan(0);
  });

  it('should accept all TipoCuenta values', () => {
    const tipos: TipoCuenta[] = ['bank', 'card', 'wallet', 'bridge'];

    for (const tipo of tipos) {
      const cuenta = makeCuenta({ tipoCuenta: tipo });
      expect(cuenta.tipoCuenta).toBe(tipo);
    }
  });
});
