import { describe, it, expect } from 'vitest';
import {
  resolveApunteEntityId,
  type ResolveApunteEntityIdInput,
} from '../../src/application/resolve-apunte-entity-id.js';

function input(
  overrides: Partial<ResolveApunteEntityIdInput> = {},
): ResolveApunteEntityIdInput {
  return {
    templateCode: 'comision_bancaria',
    explicitEntityId: null,
    lineAccounts: [],
    ...overrides,
  };
}

describe('resolveApunteEntityId', () => {
  it('returns explicit entityId when provided', () => {
    const result = resolveApunteEntityId(
      input({
        explicitEntityId: 'ent-explicit',
        lineAccounts: [
          { accountId: 'a1', tipoCuenta: 'bank', entidadId: 'ent-bank' },
        ],
      }),
    );
    expect(result).toEqual({ ok: true, entityId: 'ent-explicit' });
  });

  it('auto-resolves from a single bank account entidadId on income/expense', () => {
    const result = resolveApunteEntityId(
      input({
        lineAccounts: [
          { accountId: 'exp', tipoCuenta: 'expenseCategory', entidadId: null },
          { accountId: 'bank', tipoCuenta: 'bank', entidadId: 'ent-banco' },
        ],
      }),
    );
    expect(result).toEqual({ ok: true, entityId: 'ent-banco' });
  });

  it('auto-resolves from card account entidadId', () => {
    const result = resolveApunteEntityId(
      input({
        templateCode: 'interes_tarjeta',
        lineAccounts: [
          { accountId: 'exp', tipoCuenta: 'expenseCategory', entidadId: null },
          { accountId: 'card', tipoCuenta: 'card', entidadId: 'ent-issuer' },
        ],
      }),
    );
    expect(result).toEqual({ ok: true, entityId: 'ent-issuer' });
  });

  it('returns null when no bank/card entidadId and no explicit entityId', () => {
    const result = resolveApunteEntityId(
      input({
        lineAccounts: [
          { accountId: 'cash', tipoCuenta: 'wallet', entidadId: null },
          { accountId: 'exp', tipoCuenta: 'expenseCategory', entidadId: null },
        ],
      }),
    );
    expect(result).toEqual({ ok: true, entityId: null });
  });

  it('does not auto-assign for transferencia template', () => {
    const result = resolveApunteEntityId(
      input({
        templateCode: 'transferencia',
        lineAccounts: [
          { accountId: 'bank-a', tipoCuenta: 'bank', entidadId: 'ent-a' },
          { accountId: 'bank-b', tipoCuenta: 'bank', entidadId: 'ent-b' },
        ],
      }),
    );
    expect(result).toEqual({ ok: true, entityId: null });
  });

  it('returns 400 when two distinct bank/card entidadIds without explicit entityId', () => {
    const result = resolveApunteEntityId(
      input({
        lineAccounts: [
          { accountId: 'bank-a', tipoCuenta: 'bank', entidadId: 'ent-a' },
          { accountId: 'card-b', tipoCuenta: 'card', entidadId: 'ent-b' },
        ],
      }),
    );
    expect(result).toEqual({
      ok: false,
      statusCode: 400,
      error: 'Ambiguous entityId: multiple bank/card entities on lines',
    });
  });
});
