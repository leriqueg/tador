/**
 * Credentials fetch wrapper for /api/admin/* (013).
 */

export class AdminApiError extends Error {
  readonly status: number
  readonly body?: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'AdminApiError'
    this.status = status
    this.body = body
  }
}

export interface OperatorDto {
  id: string;
  email: string;
  displayName: string | null;
  role: 'support' | 'admin' | 'superadmin';
  mustChangePassword: boolean;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function adminFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  });
  const body = await parseJson(res);
  if (!res.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new AdminApiError(message, res.status, body);
  }
  return body as T;
}

export const adminApi = {
  login(email: string, password: string) {
    return adminFetch<{ operator: OperatorDto; mustChangePassword: boolean }>(
      '/api/admin/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    );
  },
  logout() {
    return adminFetch<{ message: string }>('/api/admin/auth/logout', {
      method: 'POST',
    });
  },
  me() {
    return adminFetch<{ operator: OperatorDto; mustChangePassword: boolean }>(
      '/api/admin/auth/me',
    );
  },
  changePassword(currentPassword: string, newPassword: string) {
    return adminFetch<{ operator: OperatorDto; mustChangePassword: boolean }>(
      '/api/admin/auth/change-password',
      {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      },
    );
  },
};
