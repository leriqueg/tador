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
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
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
  activa: boolean;
}

export const accounts = {
  list() {
    return request<{ accounts: AccountSummary[] }>('GET', '/api/accounts');
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
  availableAccounts: PlantillaAccountOption[];
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

export const plantillas = {
  list(mode?: 'hogar' | 'pro') {
    const q = mode ? `?mode=${mode}` : '';
    return request<{ plantillas: PlantillaView[] }>('GET', `/api/plantillas${q}`);
  },

  get(code: string) {
    return request<{ plantilla: PlantillaView }>('GET', `/api/plantillas/${code}`);
  },
};

// ─── Apuntes ───────────────────────────────────────────────────────

export interface ApunteLineInput {
  id: number;
  accountId: string;
}

export interface CreateApunteInput {
  templateCode: string;
  date: string;
  concept: string;
  amount: number;
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

export const apuntes = {
  list(params?: { limit?: number; offset?: number }) {
    const search = new URLSearchParams();
    if (params?.limit != null) search.set('limit', String(params.limit));
    if (params?.offset != null) search.set('offset', String(params.offset));
    const q = search.toString();
    return request<{ apuntes: ApunteSummary[]; total: number }>(
      'GET',
      `/api/apuntes${q ? `?${q}` : ''}`,
    );
  },

  create(input: CreateApunteInput) {
    return request<{ apunte: ApunteSummary }>('POST', '/api/apuntes', input);
  },
};
