/**
 * TADOR API client.
 *
 * Thin fetch wrapper — all calls go through Vite proxy (/auth → localhost:3000).
 */

const BASE = '';

interface ApiError {
  error: string;
}

export class ApiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  // Fastify rejects Content-Type: application/json with an empty body (400).
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const errBody = (await res.json()) as ApiError;
      if (errBody.error) message = errBody.error;
    } catch {
      // ignore parse errors
    }
    throw new ApiRequestError(message, res.status);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ─── Auth ──────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  verifiedAt: string | null;
}

export interface RegisterResponse {
  user: User;
  verificationToken: string;
}

export interface LoginResponse {
  user: User;
}

export const auth = {
  register(email: string, password: string) {
    return request<RegisterResponse>('POST', '/auth/register', {
      email,
      password,
    });
  },

  login(email: string, password: string) {
    return request<LoginResponse>('POST', '/auth/login', { email, password });
  },

  logout() {
    return request<{ message: string }>('POST', '/auth/logout');
  },

  me() {
    return request<{ user: User }>('GET', '/auth/me');
  },

  updateProfile(input: { fullName?: string | null }) {
    return request<{ user: User }>('PATCH', '/auth/me', input);
  },

  verify(token: string) {
    return request<{ message: string; user: User }>(
      'GET',
      `/auth/verify/${token}`,
    );
  },

  resendVerification(email: string) {
    return request<{ message: string }>('POST', '/auth/resend-verification', {
      email,
    });
  },
};

// ─── Book ──────────────────────────────────────────────────────────

export type BookMode = 'hogar' | 'pro';

export interface BookConfig {
  id: string;
  currency: string;
  locale: string;
  format: string;
  currencyLocked: boolean;
  mode: BookMode;
  timeZone: string;
  onboardingCompletedAt: string | null;
  initialized: boolean;
}

export interface BookResponse {
  book: { id: string; createdAt: string };
  config: BookConfig;
}

export interface UpdateBookConfigInput {
  currency?: string;
  locale?: string;
  format?: string;
  mode?: BookMode;
  timeZone?: string;
  completeOnboarding?: boolean;
}

export const book = {
  get() {
    return request<BookResponse>('GET', '/book');
  },

  updateConfig(input: UpdateBookConfigInput) {
    return request<{ config: BookConfig }>('PATCH', '/book/config', input);
  },
};

// ─── Accounts ──────────────────────────────────────────────────────

export interface AccountSummary {
  id: string;
  codigo: string | null;
  nombre: string;
  tipoCuenta: string;
  entidadId: string | null;
  isEntityProvisioned: boolean;
  metadata?: AccountMetadata | null;
  activa: boolean;
}

export interface AccountMetadata {
  network?: string;
  lastFour?: string;
  cutoffDay?: number;
}

export type TipoCuentaManualCreate =
  | 'wallet'
  | 'bridge'
  | 'incomeCategory'
  | 'expenseCategory';

export interface CreateAccountInput {
  tipoCuenta: TipoCuentaManualCreate | 'bank' | 'card';
  nombre: string;
  globalId?: string;
  parentGroupCodigo?: string;
  entidadId?: string;
  codigoPersonalizado?: string;
  metadata?: AccountMetadata;
}

export const accounts = {
  list() {
    return request<{ accounts: AccountSummary[] }>('GET', '/api/accounts');
  },

  create(input: CreateAccountInput) {
    return request<{ account: AccountSummary & { globalId?: string | null } }>(
      'POST',
      '/api/accounts',
      input,
    );
  },
};

export interface ChartGlobalNode {
  id: string;
  parentId: string | null;
  codigo: string;
  nombre: string;
  esPostable: boolean;
}

export const chart = {
  list() {
    return request<{ chart: ChartGlobalNode[]; activations: unknown[] }>('GET', '/api/chart');
  },
};

export const balances = {
  get(cuentaId: string) {
    return request<{ cuentaId: string; saldo: number }>('GET', `/api/balances/${cuentaId}`);
  },
};

export interface EntitySummary {
  id: string;
  nombre: string;
  tipo: string;
  notas: string | null;
  capabilities?: string[];
  provisionedAccountId?: string | null;
}

export interface EntityCreateResponse {
  entity: EntitySummary;
  provisionedAccount: AccountSummary | null;
}

export type EntityTipo =
  | 'person'
  | 'bank'
  | 'card_issuer'
  | 'wallet_platform'
  | 'organization';

export const entities = {
  list() {
    return request<{ entities: EntitySummary[] }>('GET', '/api/entities');
  },

  create(input: {
    nombre: string;
    tipo: EntityTipo;
    notas?: string;
    capabilities?: string[];
    metadata?: AccountMetadata;
  }) {
    return request<EntityCreateResponse>('POST', '/api/entities', input);
  },

  remove(id: string) {
    return request<void>('DELETE', `/api/entities/${id}`);
  },
};

// ─── Plantillas ────────────────────────────────────────────────────

export interface PlantillaAccountOption {
  id: string;
  nombre: string;
  codigo: string | null;
  tipo: 'global' | 'usuario';
}

export interface PlantillaLineView {
  id: number;
  side: 'debit' | 'credit';
  label: string;
  strategy: string;
  groupCode?: string;
  groupCodes?: string[];
  suggestedChild?: string | null;
  /** Present only on GET /api/plantillas/:code */
  availableAccounts?: PlantillaAccountOption[];
}

export interface PlantillaView {
  code: string;
  version: number;
  name: string;
  modes: string[];
  amountMode: 'single' | 'per_line';
  descriptionTemplate: string;
  lines: PlantillaLineView[];
}

export type PlantillaDetail = PlantillaView & {
  lines: Array<PlantillaLineView & { availableAccounts: PlantillaAccountOption[] }>;
};

export const plantillas = {
  list(mode?: 'hogar' | 'pro') {
    const q = mode ? `?mode=${mode}` : '';
    return request<{ plantillas: PlantillaView[] }>('GET', `/api/plantillas${q}`);
  },

  get(code: string) {
    return request<{ plantilla: PlantillaDetail }>('GET', `/api/plantillas/${code}`);
  },
};

// ─── Apuntes ───────────────────────────────────────────────────────

export interface ApunteLineInput {
  id: number;
  accountId: string;
  /** Only required when no templateCode (PRO EntryBuilder free-form entries) */
  side?: 'debit' | 'credit';
  /** Only required when no templateCode (PRO EntryBuilder free-form entries) */
  amount?: number;
}

export interface CreateApunteInput {
  /** Omit for PRO EntryBuilder free-form entries (FR-007: apunte con o sin templateCode) */
  templateCode?: string;
  date: string;
  concept: string;
  amount?: number;
  lines: ApunteLineInput[];
  entityId?: string | null;
}

export interface ApunteSummary {
  id: string;
  templateCode: string | null;
  date: string;
  concept: string;
  amount: number;
  asientoId: string;
  createdAt: string;
}

export interface ApunteListParams {
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  q?: string;
  accountId?: string;
}

export interface ApunteDetail extends ApunteSummary {
  lines: ApunteLineInput[];
}

export const apuntes = {
  list(params?: ApunteListParams) {
    const search = new URLSearchParams();
    if (params?.limit != null) search.set('limit', String(params.limit));
    if (params?.offset != null) search.set('offset', String(params.offset));
    if (params?.dateFrom) search.set('dateFrom', params.dateFrom);
    if (params?.dateTo) search.set('dateTo', params.dateTo);
    if (params?.amountMin != null) search.set('amountMin', String(params.amountMin));
    if (params?.amountMax != null) search.set('amountMax', String(params.amountMax));
    if (params?.q) search.set('q', params.q);
    if (params?.accountId) search.set('accountId', params.accountId);
    const q = search.toString();
    return request<{ apuntes: ApunteSummary[]; total: number }>(
      'GET',
      `/api/apuntes${q ? `?${q}` : ''}`,
    );
  },

  get(id: string) {
    return request<{ apunte: ApunteDetail }>('GET', `/api/apuntes/${id}`);
  },

  create(input: CreateApunteInput) {
    return request<{ apunte: ApunteSummary }>('POST', '/api/apuntes', input);
  },

  update(id: string, input: CreateApunteInput) {
    return request<{ apunte: ApunteSummary }>('PATCH', `/api/apuntes/${id}`, input);
  },
};

// ─── Manual entries (asientos) ─────────────────────────────────────

export interface CreateEntryLineInput {
  cuentaId?: string;
  cuentaGlobalId?: string;
  debito?: number;
  credito?: number;
}

export interface CreateEntryInput {
  fecha: string;
  concepto: string;
  lineas: CreateEntryLineInput[];
}

export interface EntrySummary {
  id: string;
  concepto: string;
  fecha: string;
  tipo: string;
  anulado: boolean;
}

export const entries = {
  create(input: CreateEntryInput) {
    return request<{ entry: EntrySummary; lineas: CreateEntryLineInput[] }>(
      'POST',
      '/api/entries',
      input,
    );
  },
};

// ─── Reports ───────────────────────────────────────────────────────

export interface PyGMonthlyPoint {
  month: number;
  income: number;
  expenses: number;
  balance: number;
}

export interface PyGTopAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  accumulated: number;
}

export interface PyGReport {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netResult: number;
  monthlySeries: PyGMonthlyPoint[];
  topIncome: PyGTopAccount[];
  topExpenses: PyGTopAccount[];
}

export interface PositionBreakdownEntry {
  accountId: string;
  accountCode: string;
  accountName: string;
  balance: number;
}

export interface PositionReport {
  totalAvailable: number;
  totalReceivables: number;
  totalPayables: number;
  netPosition: number;
  breakdown: {
    available: PositionBreakdownEntry[];
    receivables: PositionBreakdownEntry[];
    payables: PositionBreakdownEntry[];
  };
}

export const reports = {
  pyg(year: number) {
    return request<PyGReport>('GET', `/api/reports/pyg?year=${year}`);
  },

  position() {
    return request<PositionReport>('GET', '/api/reports/position');
  },
};
