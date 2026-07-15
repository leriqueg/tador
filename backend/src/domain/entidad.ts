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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEntidadInput {
  userId: string;
  nombre: string;
  tipo: TipoEntidad;
  notas?: string;
}

export function createEntidad(input: CreateEntidadInput): Entidad {
  return {
    id: '',
    userId: input.userId,
    nombre: input.nombre,
    tipo: input.tipo,
    notas: input.notas ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function isProvisionableTipo(
  tipo: TipoEntidad,
): tipo is Exclude<TipoEntidad, 'organization'> {
  return tipo !== 'organization';
}
