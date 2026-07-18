import { describe, expect, it } from 'vitest';
import {
  CURATED_FREQUENT_CODES,
  isWalletChartCodigo,
  plantillaCategory,
  plantillaKind,
  plantillaSupportsMode,
  preferredAccountIdForLine,
} from './plantilla-meta.ts';

describe('plantilla-meta — financial plantillas (T012)', () => {
  it('classifies hogar+pro financial plantillas as gasto', () => {
    expect(plantillaKind('comision_bancaria')).toBe('gasto');
    expect(plantillaKind('interes_tarjeta')).toBe('gasto');
    expect(plantillaKind('multa_financiera')).toBe('gasto');
  });

  it('classifies ganancia_inversion as ingreso', () => {
    expect(plantillaKind('ganancia_inversion')).toBe('ingreso');
    expect(plantillaCategory('ganancia_inversion')).toBe('ingresos');
  });

  it('assigns financial gastos to otros category for Hogar discovery', () => {
    expect(plantillaCategory('comision_bancaria')).toBe('otros');
    expect(plantillaCategory('interes_tarjeta')).toBe('otros');
  });

  it('classifies loan and card-debt plantillas as transferencia / movimientos', () => {
    expect(plantillaKind('prestamo_otorgado')).toBe('transferencia');
    expect(plantillaKind('cobro_prestamo')).toBe('transferencia');
    expect(plantillaKind('pago_tarjeta')).toBe('transferencia');
    expect(plantillaCategory('prestamo_otorgado')).toBe('movimientos');
    expect(plantillaCategory('cobro_prestamo')).toBe('movimientos');
    expect(plantillaCategory('pago_tarjeta')).toBe('movimientos');
  });

  it('prefers wallet chart accounts for Depositar origen and Retirar destino', () => {
    const wallet = { id: 'w1', codigo: '11110001', tipo: 'usuario' };
    const bank = { id: 'b1', codigo: '11120001', tipo: 'usuario' };
    const used = new Set<string>();

    expect(
      preferredAccountIdForLine('deposito_bancario', 2, [bank, wallet], used),
    ).toBe('w1');
    expect(
      preferredAccountIdForLine('retiro_bancario', 1, [wallet, bank], used),
    ).toBe('w1');
    expect(isWalletChartCodigo('11110001')).toBe(true);
    expect(isWalletChartCodigo('11120001')).toBe(false);
  });

  it('includes Depositar and Retirar in curated frequent shortcuts', () => {
    expect(CURATED_FREQUENT_CODES).toContain('deposito_bancario');
    expect(CURATED_FREQUENT_CODES).toContain('retiro_bancario');
    expect(CURATED_FREQUENT_CODES).toContain('transferencia');
  });

  it('respects plantilla modes for Hogar vs PRO (T012)', () => {
    expect(plantillaSupportsMode(['hogar', 'pro'], 'hogar')).toBe(true);
    expect(plantillaSupportsMode(['pro'], 'hogar')).toBe(false);
    expect(plantillaSupportsMode(['pro'], 'pro')).toBe(true);
  });
});
