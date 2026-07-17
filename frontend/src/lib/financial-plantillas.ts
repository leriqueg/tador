/**
 * PRO financial plantilla codes (Sprint 009 T011).
 */

import type { EntrySubtype } from '../components/entry-builder/entry-builder-state.ts';

export const FINANCIAL_PLANTILLA_CODES = [
  'comision_bancaria',
  'interes_tarjeta',
  'multa_financiera',
  'ganancia_inversion',
] as const;

export type FinancialPlantillaCode = (typeof FINANCIAL_PLANTILLA_CODES)[number];

export const FINANCIAL_PLANTILLA_LABELS: Record<FinancialPlantillaCode, string> = {
  comision_bancaria: 'Comisión bancaria',
  interes_tarjeta: 'Interés de tarjeta',
  multa_financiera: 'Multa financiera',
  ganancia_inversion: 'Ganancias por invertir',
};

export const EGRESO_FINANCIAL_SUBTYPES: FinancialPlantillaCode[] = [
  'comision_bancaria',
  'interes_tarjeta',
  'multa_financiera',
];

export const INGRESO_FINANCIAL_SUBTYPES: FinancialPlantillaCode[] = ['ganancia_inversion'];

export function isFinancialPlantillaSubtype(subtype: EntrySubtype): subtype is FinancialPlantillaCode {
  return (FINANCIAL_PLANTILLA_CODES as readonly string[]).includes(subtype);
}

/** Maps EntryBuilder subtype to backend templateCode (salary handled separately). */
export function templateCodeForSubtype(subtype: EntrySubtype): string | null {
  if (subtype === 'salario') return 'registrar_sueldo';
  if (isFinancialPlantillaSubtype(subtype)) return subtype;
  return null;
}

export function subtypeUsesTemplate(subtype: EntrySubtype): boolean {
  return templateCodeForSubtype(subtype) !== null;
}
