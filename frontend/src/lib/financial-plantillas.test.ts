import { describe, expect, it } from 'vitest';
import {
  EGRESO_FINANCIAL_SUBTYPES,
  FINANCIAL_PLANTILLA_LABELS,
  INGRESO_FINANCIAL_SUBTYPES,
  isFinancialPlantillaSubtype,
  subtypeUsesTemplate,
  templateCodeForSubtype,
} from './financial-plantillas.ts';

describe('financial-plantillas', () => {
  it('maps financial subtypes to template codes', () => {
    expect(templateCodeForSubtype('comision_bancaria')).toBe('comision_bancaria');
    expect(templateCodeForSubtype('interes_tarjeta')).toBe('interes_tarjeta');
    expect(templateCodeForSubtype('multa_financiera')).toBe('multa_financiera');
    expect(templateCodeForSubtype('ganancia_inversion')).toBe('ganancia_inversion');
  });

  it('maps salary and general subtypes correctly', () => {
    expect(templateCodeForSubtype('salario')).toBe('registrar_sueldo');
    expect(templateCodeForSubtype('general')).toBeNull();
    expect(subtypeUsesTemplate('general')).toBe(false);
    expect(subtypeUsesTemplate('comision_bancaria')).toBe(true);
  });

  it('exposes human labels for PRO financial branches', () => {
    expect(FINANCIAL_PLANTILLA_LABELS.comision_bancaria).toBe('Comisión bancaria');
    expect(EGRESO_FINANCIAL_SUBTYPES).toEqual([
      'comision_bancaria',
      'interes_tarjeta',
      'multa_financiera',
    ]);
    expect(INGRESO_FINANCIAL_SUBTYPES).toEqual(['ganancia_inversion']);
  });

  it('detects financial plantilla subtypes', () => {
    expect(isFinancialPlantillaSubtype('multa_financiera')).toBe(true);
    expect(isFinancialPlantillaSubtype('general')).toBe(false);
  });
});
