/**
 * Unit tests: Entidad domain entity.
 */

import { describe, it, expect } from 'vitest';
import type { Entidad, TipoEntidad } from '../../src/domain/entidad.js';
import { createEntidad } from '../../src/domain/entidad.js';

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
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(entidad.tipo).toBe(tipo);
    }
  });
});
