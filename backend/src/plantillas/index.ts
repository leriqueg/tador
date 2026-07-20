/**
 * Plantilla loader.
 *
 * Loads all JSON template files from this directory, validates them
 * against a minimum schema, and exports lookup functions.
 *
 * Templates are loaded once at startup and are immutable at runtime.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlantillaField {
  type: string;
  required: boolean;
  label: string;
  default?: string;
  /** For type='entity': the Entidad capability the selected entity must hold (Sprint 07 T006). */
  requiresCapability?: string;
}

export interface PlantillaLine {
  id: number;
  side: 'debit' | 'credit';
  label: string;
  strategy: 'from_group' | 'from_groups' | 'fixed' | 'from_entity';
  groupCode?: string;
  groupCodes?: string[];
  suggestedChild?: string | null;
}

export interface Plantilla {
  code: string;
  version: number;
  name: string;
  modes: string[];
  status?: string;
  amount: PlantillaField;
  concept: PlantillaField;
  date: PlantillaField;
  entity: PlantillaField;
  amountMode: 'single' | 'per_line';
  descriptionTemplate: string;
  lines: PlantillaLine[];
  journalExample?: string;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));

let plantillas: Plantilla[] | null = null;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface ValidationError {
  file: string;
  message: string;
}

function validatePlantilla(raw: Record<string, unknown>, _file: string): string | null {
  if (!raw.code || typeof raw.code !== 'string') {
    return `Missing or invalid 'code'`;
  }
  if (typeof raw.version !== 'number') {
    return `Missing or invalid 'version'`;
  }
  if (!raw.name || typeof raw.name !== 'string') {
    return `Missing or invalid 'name'`;
  }
  if (!Array.isArray(raw.modes) || raw.modes.length === 0) {
    return `Missing or empty 'modes'`;
  }
  if (!Array.isArray(raw.lines) || raw.lines.length === 0) {
    return `Missing or empty 'lines'`;
  }

  for (let i = 0; i < raw.lines.length; i++) {
    const line = raw.lines[i] as Record<string, unknown>;

    if (typeof line.id !== 'number') {
      return `lines[${i}]: missing or invalid 'id'`;
    }
    if (line.side !== 'debit' && line.side !== 'credit') {
      return `lines[${i}]: 'side' must be 'debit' or 'credit'`;
    }
    if (typeof line.strategy !== 'string') {
      return `lines[${i}]: missing or invalid 'strategy'`;
    }

    const strategy = line.strategy as string;
    if (strategy === 'from_group' && typeof line.groupCode !== 'string') {
      return `lines[${i}]: strategy 'from_group' requires 'groupCode' string`;
    }
    if (strategy === 'from_groups' && !Array.isArray(line.groupCodes)) {
      return `lines[${i}]: strategy 'from_groups' requires 'groupCodes' array`;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

/**
 * Load all plantilla JSON files from this directory.
 * Returns the array of validated Plantilla objects.
 * Skips invalid files and logs errors.
 */
export function loadPlantillas(): Plantilla[] {
  if (plantillas) return plantillas;

  const errors: ValidationError[] = [];
  const loaded: Plantilla[] = [];

  const files = readdirSync(__dirname).filter(
    (f) => extname(f) === '.json',
  );

  for (const file of files) {
    const fullPath = resolve(__dirname, file);
    try {
      const raw = JSON.parse(readFileSync(fullPath, 'utf-8')) as Record<string, unknown>;
      const validationErr = validatePlantilla(raw, file);
      if (validationErr) {
        errors.push({ file, message: validationErr });
        // eslint-disable-next-line no-console
        console.error(`[plantillas] Invalid template file "${file}": ${validationErr}`);
        continue;
      }

      loaded.push(raw as unknown as Plantilla);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ file, message: msg });
      // eslint-disable-next-line no-console
      console.error(`[plantillas] Failed to load "${file}": ${msg}`);
    }
  }

  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[plantillas] Loaded ${loaded.length} templates, ${errors.length} errors`,
    );
  }

  plantillas = loaded;
  return loaded;
}

/**
 * Get a single plantilla by code.
 */
export function getPlantilla(code: string): Plantilla | undefined {
  const all = loadPlantillas();
  return all.find((p) => p.code === code);
}

/**
 * Get all plantillas, optionally filtered by mode.
 */
export function getAllPlantillas(mode?: string): Plantilla[] {
  const all = loadPlantillas();
  if (!mode) return all;
  const normalized = mode.toLowerCase();
  return all.filter((p) => p.modes.includes(normalized));
}

/**
 * Reset the cache (useful for testing).
 */
export function resetPlantillaCache(): void {
  plantillas = null;
}
