/**
 * Curated IANA time zones for Hogar onboarding (NA + SA + Europe).
 * Labels are user-facing (Spanish).
 */

export interface TimeZoneOption {
  value: string;
  label: string;
}

export const CURATED_TIME_ZONES: readonly TimeZoneOption[] = [
  { value: 'America/Guayaquil', label: 'Guayaquil (Ecuador)' },
  { value: 'America/Bogota', label: 'Bogotá (Colombia)' },
  { value: 'America/Lima', label: 'Lima (Perú)' },
  { value: 'America/Caracas', label: 'Caracas (Venezuela)' },
  { value: 'America/La_Paz', label: 'La Paz (Bolivia)' },
  { value: 'America/Asuncion', label: 'Asunción (Paraguay)' },
  { value: 'America/Santiago', label: 'Santiago (Chile)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (Argentina)' },
  { value: 'America/Montevideo', label: 'Montevideo (Uruguay)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (Brasil)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México' },
  { value: 'America/Monterrey', label: 'Monterrey (México)' },
  { value: 'America/Panama', label: 'Panamá' },
  { value: 'America/Costa_Rica', label: 'Costa Rica' },
  { value: 'America/New_York', label: 'Nueva York (EE. UU.)' },
  { value: 'America/Chicago', label: 'Chicago (EE. UU.)' },
  { value: 'America/Denver', label: 'Denver (EE. UU.)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (EE. UU.)' },
  { value: 'America/Toronto', label: 'Toronto (Canadá)' },
  { value: 'America/Vancouver', label: 'Vancouver (Canadá)' },
  { value: 'Europe/Madrid', label: 'Madrid (España)' },
  { value: 'Europe/Lisbon', label: 'Lisboa (Portugal)' },
  { value: 'Europe/London', label: 'Londres (Reino Unido)' },
  { value: 'Europe/Paris', label: 'París (Francia)' },
  { value: 'Europe/Berlin', label: 'Berlín (Alemania)' },
  { value: 'Europe/Rome', label: 'Roma (Italia)' },
  { value: 'Europe/Amsterdam', label: 'Ámsterdam (Países Bajos)' },
  { value: 'UTC', label: 'UTC' },
] as const;

const CURATED_VALUES = new Set(CURATED_TIME_ZONES.map((z) => z.value));

/** Browser IANA zone when curated; otherwise UTC (FR-010a). */
export function detectDefaultTimeZone(): string {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected && CURATED_VALUES.has(detected)) return detected;
  } catch {
    // ignore
  }
  return 'UTC';
}

export function timeZoneLabel(value: string): string {
  return CURATED_TIME_ZONES.find((z) => z.value === value)?.label ?? value;
}
