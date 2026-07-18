/**
 * Unit tests: Entidad domain entity.
 */

import { describe, it, expect } from 'vitest';
import type { Entidad, TipoEntidad } from '../../src/domain/entidad.js';
import {
  createEntidad,
  isValidCapability,
  validateCapabilities,
  InvalidCapabilityError,
} from '../../src/domain/entidad.js';

describe('Entidad', () => {
  it('should create an Entidad with tipo=person', () => {
    const entidad = createEntidad({
      userId: 'user-1',
      nombre: 'Mariuxi',
      tipo: 'person',
    });

    expect(entidad.tipo).toBe('person');
    expect(entidad.nombre).toBe('Mariuxi');
    expect(entidad.userId).toBe('user-1');
  });

  it('should create an Entidad with tipo=bank', () => {
    const entidad = createEntidad({
      userId: 'user-1',
      nombre: 'Banco del Pacífico',
      tipo: 'bank',
    });

    expect(entidad.tipo).toBe('bank');
  });

  it('should create an Entidad with tipo=organization', () => {
    const entidad = createEntidad({
      userId: 'user-1',
      nombre: 'ACME Corp',
      tipo: 'organization',
    });

    expect(entidad.tipo).toBe('organization');
  });

  it('should create an Entidad with tipo=card_issuer', () => {
    const entidad = createEntidad({
      userId: 'user-1',
      nombre: 'Visa',
      tipo: 'card_issuer',
    });

    expect(entidad.tipo).toBe('card_issuer');
  });

  it('should create an Entidad with tipo=wallet_platform', () => {
    const entidad = createEntidad({
      userId: 'user-1',
      nombre: 'PayPal',
      tipo: 'wallet_platform',
    });

    expect(entidad.tipo).toBe('wallet_platform');
  });

  it('should have the correct estructura with all fields', () => {
    const entidad = createEntidad({
      userId: 'user-42',
      nombre: 'Test Person',
      tipo: 'person',
      notas: 'Some notes',
    });

    expect(entidad.notas).toBe('Some notes');
    expect(entidad.createdAt).toBeInstanceOf(Date);
  });

  it('should default notas to null when not provided', () => {
    const entidad = createEntidad({
      userId: 'user-1',
      nombre: 'No Notes',
      tipo: 'person',
    });

    expect(entidad.notas).toBeNull();
  });

  it('should accept all TipoEntidad values', () => {
    const tipos: TipoEntidad[] = [
      'person',
      'organization',
      'bank',
      'card_issuer',
      'wallet_platform',
    ];

    for (const tipo of tipos) {
      const entidad: Entidad = {
        id: 'test',
        userId: 'user-1',
        nombre: `Entity ${tipo}`,
        tipo,
        notas: null,
        capabilities: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(entidad.tipo).toBe(tipo);
    }
  });

  it('should default capabilities to an empty array when not provided', () => {
    const entidad = createEntidad({
      userId: 'user-1',
      nombre: 'ACME Corp',
      tipo: 'organization',
    });

    expect(entidad.capabilities).toEqual([]);
  });

  it('should create an organization with capabilities', () => {
    const entidad = createEntidad({
      userId: 'user-1',
      nombre: 'ACME Corp',
      tipo: 'organization',
      capabilities: ['can_be_customer', 'is_employment_dependency'],
    });

    expect(entidad.capabilities).toEqual([
      'can_be_customer',
      'is_employment_dependency',
    ]);
  });
});

describe('isValidCapability', () => {
  it('should accept known capability tokens', () => {
    expect(isValidCapability('can_be_customer')).toBe(true);
    expect(isValidCapability('can_be_supplier')).toBe(true);
    expect(isValidCapability('is_employment_dependency')).toBe(true);
  });

  it('should reject unknown tokens', () => {
    expect(isValidCapability('client')).toBe(false);
    expect(isValidCapability('supplier')).toBe(false);
    expect(isValidCapability('')).toBe(false);
  });
});

describe('validateCapabilities', () => {
  it('should return an empty array when input is undefined', () => {
    expect(validateCapabilities(undefined)).toEqual([]);
  });

  it('should return a deduplicated, validated array for valid tokens', () => {
    const result = validateCapabilities([
      'can_be_customer',
      'can_be_supplier',
      'can_be_customer',
    ]);
    expect(result).toEqual(['can_be_customer', 'can_be_supplier']);
  });

  it('should throw InvalidCapabilityError for an unknown token', () => {
    expect(() => validateCapabilities(['client'])).toThrow(
      InvalidCapabilityError,
    );
  });

  it('should throw InvalidCapabilityError when input is not an array', () => {
    expect(() => validateCapabilities('can_be_customer')).toThrow(
      InvalidCapabilityError,
    );
  });
});
