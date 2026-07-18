/**
 * Port: apunte reads and transactional writes (hides Prisma apunte/asiento joins).
 */

import type { ApunteListFilter } from '../apunte-list-filters.js';

export interface ApunteListItem {
  id: string;
  templateCode: string | null;
  date: Date;
  concept: string;
  amount: string;
  asientoId: string;
  createdAt: Date;
}

export interface ApunteLineSnapshot {
  cuentaId: string | null;
  cuentaGlobalId: string | null;
  debito: { toString(): string };
  credito: { toString(): string };
  createdAt: Date;
}

export interface ApunteRecord {
  id: string;
  templateCode: string | null;
  date: Date;
  concept: string;
  amount: { toString(): string };
  asientoId: string;
  userId: string;
  entityId: string | null;
  createdAt: Date;
}

export interface ApunteDetailRecord extends ApunteRecord {
  asiento: {
    id: string;
    fecha: Date;
    concepto: string;
    lineas: ApunteLineSnapshot[];
  };
}

export interface ApunteAsientoSnapshot {
  id: string;
  fecha: Date;
  concepto: string;
}

export interface IdempotentApunteReplay {
  apunte: ApunteRecord;
  asiento: ApunteAsientoSnapshot;
  lineas: ApunteLineSnapshot[];
}

export interface PersistApunteLineInput {
  cuentaId?: string;
  cuentaGlobalId?: string;
  debito: string;
  credito: string;
}

export interface PersistCreateApunteInput {
  bookId: string;
  userId: string;
  fecha: Date;
  concept: string;
  templateCode: string | null;
  amount: string;
  entityId: string | null;
  idempotencyKey?: string;
  entryLines: PersistApunteLineInput[];
}

export interface PersistCreateApunteResult {
  apunte: ApunteRecord;
  asiento: ApunteAsientoSnapshot;
  lineas: ApunteLineSnapshot[];
  replayed: boolean;
}

export interface UpdateApunteInput {
  templateCode: string | null;
  date: Date;
  concept: string;
  amount: string;
}

export interface EntityCapabilitySnapshot {
  tipo: string;
  capabilities: string[];
}

export interface ApunteRepository {
  list(
    filter: ApunteListFilter,
    pagination: { limit: number; offset: number },
  ): Promise<{ total: number; rows: ApunteListItem[] }>;
  findDetailById(userId: string, id: string): Promise<ApunteDetailRecord | null>;
  findByIdForUser(userId: string, id: string): Promise<ApunteRecord | null>;
  findIdempotentReplay(
    idempotencyKey: string,
  ): Promise<IdempotentApunteReplay | null>;
  persistCreate(input: PersistCreateApunteInput): Promise<PersistCreateApunteResult>;
  updateForUser(
    userId: string,
    id: string,
    data: UpdateApunteInput,
  ): Promise<ApunteRecord | null>;
  findEntityForUser(
    userId: string,
    entityId: string,
  ): Promise<EntityCapabilitySnapshot | null>;
  entityExistsForUser(userId: string, entityId: string): Promise<boolean>;
}
