/**
 * Journal persistence port — unit of work without Prisma types.
 */

export class UniqueConstraintError extends Error {
  readonly code = 'UNIQUE_CONSTRAINT';
  constructor(message = 'Unique constraint violated') {
    super(message);
    this.name = 'UniqueConstraintError';
  }
}

export interface BalancePolicyLine {
  cuentaId?: string | null;
  cuentaGlobalId?: string | null;
  debito: string | number | { toString(): string };
  credito: string | number | { toString(): string };
}

export interface JournalAsientoRecord {
  id: string;
  bookId: string;
  fecha: Date;
  concepto: string;
  tipo: string;
  asientoOriginalId: string | null;
  idempotencyKey: string | null;
  anulado: boolean;
  anuladoAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalLineaRecord {
  id: string;
  asientoId: string;
  cuentaId: string | null;
  cuentaGlobalId: string | null;
  /** Decimal string or Prisma Decimal-compatible */
  debito: { toString(): string } | number | string;
  credito: { toString(): string } | number | string;
  createdAt: Date;
}

export interface JournalVersionRecord {
  id: string;
  asientoId: string;
  version: number;
  snapshot: unknown;
  modifiedBy: string;
  createdAt: Date;
}

export interface JournalPeriodRecord {
  id: string;
  bookId: string;
  año: number;
  abierto: boolean;
  cerradoAt: Date | null;
  reabiertoAt: Date | null;
  createdAt: Date;
}

export interface JournalAsientoWithLines extends JournalAsientoRecord {
  lineas: JournalLineaRecord[];
}

export interface JournalAsientoDetail extends JournalAsientoWithLines {
  versiones: JournalVersionRecord[];
}

export interface ProtectedAccountRecord {
  kind: 'user' | 'global';
  id: string;
  name: string;
  naturalSide: 'debit' | 'credit';
  enforce: boolean;
}

export interface CreateAsientoData {
  bookId: string;
  fecha: Date;
  concepto: string;
  tipo: string;
  idempotencyKey?: string;
  asientoOriginalId?: string;
}

export interface CreateLineaData {
  asientoId: string;
  cuentaId: string | null;
  cuentaGlobalId: string | null;
  debito: string;
  credito: string;
}

export interface JournalTransaction {
  lockKey(key: string): Promise<void>;
  findAsientoByIdempotencyKey(
    key: string,
  ): Promise<JournalAsientoWithLines | null>;
  findBookUserId(bookId: string): Promise<string | null>;
  createAsiento(data: CreateAsientoData): Promise<JournalAsientoRecord>;
  createLinea(data: CreateLineaData): Promise<JournalLineaRecord>;
  loadProtectedAccounts(
    userId: string,
    lines: BalancePolicyLine[],
  ): Promise<ProtectedAccountRecord[]>;
  getAccountDebitMinusCredit(
    bookId: string,
    account: { kind: 'user' | 'global'; id: string },
    replacingAsientoId?: string,
  ): Promise<string>;
  findMaxVersion(asientoId: string): Promise<number>;
  createVersion(data: {
    asientoId: string;
    version: number;
    snapshot: Record<string, unknown>;
    modifiedBy: string;
  }): Promise<void>;
  deleteLineas(asientoId: string): Promise<void>;
  updateAsiento(
    id: string,
    data: { fecha?: Date; concepto?: string; anulado?: boolean; anuladoAt?: Date | null },
  ): Promise<JournalAsientoRecord>;
}

export interface JournalMonthlyBalanceRow {
  mes: number;
  totalDebito: number | string;
  totalCredito: number | string;
}

export interface JournalReportAsiento {
  id: string;
  fecha: Date;
  lineas: Array<{
    cuentaId: string | null;
    cuentaGlobalId: string | null;
    debito: { toString(): string } | number | string;
    credito: { toString(): string } | number | string;
    cuentaUsuario: {
      id: string;
      nombre: string;
      codigo: string | null;
      global: { codigo: string } | null;
    } | null;
    cuentaGlobal: { id: string; nombre: string; codigo: string } | null;
  }>;
}

export interface JournalStore {
  runInTransaction<T>(fn: (tx: JournalTransaction) => Promise<T>): Promise<T>;
  getBookCurrency(bookId: string): Promise<string | null>;
  findPeriod(bookId: string, año: number): Promise<JournalPeriodRecord | null>;
  ensurePeriod(bookId: string, año: number): Promise<JournalPeriodRecord>;
  closePeriod(bookId: string, año: number): Promise<JournalPeriodRecord>;
  reopenPeriod(bookId: string, año: number): Promise<JournalPeriodRecord>;
  findBookUserId(bookId: string): Promise<string | null>;
  findActiveUserAccountIds(
    userId: string,
    ids: string[],
  ): Promise<string[]>;
  findPostableGlobalIds(ids: string[]): Promise<string[]>;
  findAsientoByIdempotencyKey(
    key: string,
  ): Promise<JournalAsientoWithLines | null>;
  findAsientoDetail(
    id: string,
  ): Promise<JournalAsientoDetail | null>;
  findAsientoWithLines(id: string): Promise<JournalAsientoWithLines | null>;
  listAsientos(
    bookId: string,
    fechaGte?: Date,
    fechaLt?: Date,
  ): Promise<JournalAsientoRecord[]>;
  aggregateBalance(
    bookId: string,
    account: { kind: 'user' | 'global'; id: string },
  ): Promise<{ debito: string; credito: string }>;
  listMonthlyBalances(
    bookId: string,
    account: { kind: 'user' | 'global'; id: string },
    año: number,
  ): Promise<JournalMonthlyBalanceRow[]>;
  listReportAsientos(bookId: string, año: number): Promise<JournalReportAsiento[]>;
  isUniqueConstraintError(err: unknown): boolean;
}
