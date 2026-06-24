/**
 * Entidad domain entity.
 * Represents a named entity: person, organization, bank, or issuer.
 * Links to CuentaUsuario to identify the account holder or counterparty.
 */

export type TipoEntidad = 'person' | 'organization' | 'bank' | 'issuer';

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
    id: '', // assigned by repository
    userId: input.userId,
    nombre: input.nombre,
    tipo: input.tipo,
    notas: input.notas ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
