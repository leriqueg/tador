/**
 * Entidad domain entity.
 * Named counterpart: person, bank, card issuer, wallet platform, or organization (PRO).
 */

export type TipoEntidad =
  | 'person'
  | 'organization'
  | 'bank'
  | 'card_issuer'
  | 'wallet_platform';

/** Allowlisted capability tokens an Entidad (typically organization) can hold. */
export const VALID_CAPABILITIES = [
  'can_be_customer',
  'can_be_supplier',
  'is_employment_dependency',
] as const;

export type Capability = (typeof VALID_CAPABILITIES)[number];

export class InvalidCapabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCapabilityError';
  }
}

export function isValidCapability(value: string): value is Capability {
  return (VALID_CAPABILITIES as readonly string[]).includes(value);
}

/**
 * Validate and normalize a raw capabilities input into a deduplicated
 * array of known Capability tokens. Throws InvalidCapabilityError on any
 * unrecognized token or malformed input.
 */
export function validateCapabilities(input: unknown): Capability[] {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) {
    throw new InvalidCapabilityError('capabilities must be an array of strings');
  }

  const result: Capability[] = [];
  for (const value of input) {
    if (typeof value !== 'string' || !isValidCapability(value)) {
      throw new InvalidCapabilityError(`Invalid capability token '${String(value)}'`);
    }
    if (!result.includes(value)) result.push(value);
  }
  return result;
}

/** Chart group + CuentaUsuario.tipoCuenta when provisioning from an Entidad. */
export const ENTITY_PROVISION_MAP: Record<
  Exclude<TipoEntidad, 'organization'>,
  { parentGroupCodigo: string; tipoCuenta: 'bank' | 'card' | 'wallet' }
> = {
  bank: { parentGroupCodigo: '11120000', tipoCuenta: 'bank' },
  card_issuer: { parentGroupCodigo: '21200000', tipoCuenta: 'card' },
  wallet_platform: { parentGroupCodigo: '11110000', tipoCuenta: 'wallet' },
  person: { parentGroupCodigo: '11320000', tipoCuenta: 'wallet' },
};

export interface Entidad {
  id: string;
  userId: string;
  nombre: string;
  tipo: TipoEntidad;
  notas: string | null;
  capabilities: Capability[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEntidadInput {
  userId: string;
  nombre: string;
  tipo: TipoEntidad;
  notas?: string;
  capabilities?: string[];
}

export function createEntidad(input: CreateEntidadInput): Entidad {
  return {
    id: '',
    userId: input.userId,
    nombre: input.nombre,
    tipo: input.tipo,
    notas: input.notas ?? null,
    capabilities: validateCapabilities(input.capabilities),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function isProvisionableTipo(
  tipo: TipoEntidad,
): tipo is Exclude<TipoEntidad, 'organization'> {
  return tipo !== 'organization';
}
