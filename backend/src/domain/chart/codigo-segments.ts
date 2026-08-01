/**
 * Chart codigo segment helpers — [A][BBB][C][DDD].
 */

import { isValidGlobalAccountCodigo } from '../cuenta-global.js';

export interface CodigoSegments {
  classDigit: string;
  bbb: string;
  scope: string;
  ddd: string;
}

export function parseCodigo(codigo: string): CodigoSegments | null {
  if (!isValidGlobalAccountCodigo(codigo)) return null;
  return {
    classDigit: codigo[0]!,
    bbb: codigo.slice(1, 4),
    scope: codigo[4]!,
    ddd: codigo.slice(5, 8),
  };
}

export function buildCodigo(parts: CodigoSegments): string {
  return `${parts.classDigit}${parts.bbb}${parts.scope}${parts.ddd}`;
}

export function classDigit(codigo: string): string | null {
  return parseCodigo(codigo)?.classDigit ?? null;
}

export function isSameClass(a: string, b: string): boolean {
  const ca = classDigit(a);
  const cb = classDigit(b);
  return ca !== null && ca === cb;
}

export function nextFreeDdd(
  occupied: ReadonlySet<string>,
  classDigitValue: string,
  bbb: string,
  scope: string,
): string | null {
  for (let i = 1; i <= 999; i += 1) {
    const ddd = String(i).padStart(3, '0');
    const code = `${classDigitValue}${bbb}${scope}${ddd}`;
    if (!occupied.has(code)) return ddd;
  }
  return null;
}

/** Next free group code BBB for class digit (`A BBB 0 000`). */
export function nextFreeGroupBbb(
  occupiedGroupCodes: ReadonlySet<string>,
  classDigitValue: string,
): string | null {
  for (let i = 0; i <= 999; i += 1) {
    const bbb = String(i).padStart(3, '0');
    const groupCode = `${classDigitValue}${bbb}0` + '000';
    if (!occupiedGroupCodes.has(groupCode)) return bbb;
  }
  return null;
}
