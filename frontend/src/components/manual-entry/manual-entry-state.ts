/**
 * Manual entry form state — balance checks and API payload (US3, T019–T021).
 * Pure functions only; decimal-safe via cent integers (Constitution IX, 2 dp).
 */

export interface ManualEntryLine {
  id: string;
  cuentaId: string;
  debito: string;
  credito: string;
}

export interface ManualEntryFormState {
  fecha: string;
  concepto: string;
  lineas: ManualEntryLine[];
}

export interface CreateEntryLinePayload {
  cuentaId: string;
  debito: number;
  credito: number;
}

export interface CreateEntryPayload {
  fecha: string;
  concepto: string;
  lineas: CreateEntryLinePayload[];
}

function parseMoneyInput(raw: string): number {
  const trimmed = raw.trim().replace(',', '.');
  if (!trimmed) return 0;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100) / 100;
}

function formatDifference(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  return `${sign}${whole}.${String(frac).padStart(2, '0')}`;
}

function totalDebitsCents(lineas: ManualEntryLine[]): number {
  return lineas.reduce((sum, line) => sum + Math.round(parseMoneyInput(line.debito) * 100), 0);
}

function totalCreditsCents(lineas: ManualEntryLine[]): number {
  return lineas.reduce((sum, line) => sum + Math.round(parseMoneyInput(line.credito) * 100), 0);
}

export function createEmptyManualLine(): ManualEntryLine {
  return {
    id: crypto.randomUUID(),
    cuentaId: '',
    debito: '',
    credito: '',
  };
}

export function computeEntryDifference(form: ManualEntryFormState): string {
  const diffCents = totalDebitsCents(form.lineas) - totalCreditsCents(form.lineas);
  return formatDifference(diffCents);
}

export function isManualEntryBalanced(form: ManualEntryFormState): boolean {
  return totalDebitsCents(form.lineas) === totalCreditsCents(form.lineas) &&
    totalDebitsCents(form.lineas) > 0;
}

function activeLines(lineas: ManualEntryLine[]): ManualEntryLine[] {
  return lineas.filter(
    (line) =>
      line.cuentaId &&
      (parseMoneyInput(line.debito) > 0 || parseMoneyInput(line.credito) > 0),
  );
}

export function manualEntrySubmitBlockReason(form: ManualEntryFormState): string | null {
  if (!form.concepto.trim()) {
    return 'Escribí un concepto para el asiento.';
  }
  const moving = activeLines(form.lineas);
  if (moving.length < 2) {
    return 'Agregá al menos dos líneas con cuenta y monto en débito o crédito.';
  }
  if (!isManualEntryBalanced(form)) {
    return `El asiento está descuadrado por ${computeEntryDifference(form)}. Ajustá débitos y créditos.`;
  }
  return null;
}

export function toCreateEntryPayload(form: ManualEntryFormState): CreateEntryPayload | null {
  if (manualEntrySubmitBlockReason(form)) return null;
  const lineas = activeLines(form.lineas).map((line) => ({
    cuentaId: line.cuentaId,
    debito: parseMoneyInput(line.debito),
    credito: parseMoneyInput(line.credito),
  }));
  return {
    fecha: form.fecha,
    concepto: form.concepto.trim(),
    lineas,
  };
}

/** Maps backend entry errors to everyday Spanish (US3, T021). */
export function friendlyManualEntryError(message: string): string {
  if (message.includes('closed period') || message.includes('is closed')) {
    return 'El periodo contable está cerrado. No podés registrar asientos en esas fechas.';
  }
  if (
    message.includes('not found') ||
    message.includes('not postable') ||
    message.includes('does not belong')
  ) {
    return 'Una de las cuentas no existe, no es postable o no pertenece a tu libro.';
  }
  if (message.includes('balanced')) {
    return 'El asiento no está balanceado. Revisá débitos y créditos.';
  }
  return message;
}
