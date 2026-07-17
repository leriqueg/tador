import { describe, expect, it } from 'vitest';
import { plantillaCategory, plantillaKind, plantillaSupportsMode } from './plantilla-meta.ts';

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

  it('respects plantilla modes for Hogar vs PRO (T012)', () => {
    expect(plantillaSupportsMode(['hogar', 'pro'], 'hogar')).toBe(true);
    expect(plantillaSupportsMode(['pro'], 'hogar')).toBe(false);
    expect(plantillaSupportsMode(['pro'], 'pro')).toBe(true);
  });
});
