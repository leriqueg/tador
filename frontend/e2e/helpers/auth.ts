import type { APIRequestContext } from '@playwright/test';
import { BACKEND_URL } from './env.ts';

const E2E_PASSWORD = 'E2ePassword1!';

export { E2E_PASSWORD };

export async function waitForBackend(request: APIRequestContext): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const res = await request.get(`${BACKEND_URL}/health`);
      if (res.ok()) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(
    `Backend not reachable at ${BACKEND_URL}. Start Postgres + backend before E2E.`,
  );
}

/** Register, verify email, and mark book initialized (API-only setup). */
export async function createInitializedUser(
  request: APIRequestContext,
  email: string,
  password = E2E_PASSWORD,
  mode: 'hogar' | 'pro' = 'hogar',
): Promise<void> {
  const register = await request.post(`${BACKEND_URL}/auth/register`, {
    data: { email, password },
  });
  if (!register.ok()) {
    const body = await register.text();
    throw new Error(`Register failed (${register.status()}): ${body}`);
  }

  const { verificationToken } = (await register.json()) as { verificationToken: string };
  const verify = await request.get(`${BACKEND_URL}/auth/verify/${verificationToken}`);
  if (!verify.ok()) {
    throw new Error(`Verify failed (${verify.status()})`);
  }

  const login = await request.post(`${BACKEND_URL}/auth/login`, {
    data: { email, password },
  });
  if (!login.ok()) {
    throw new Error(`Login failed (${login.status()})`);
  }

  const config = await request.patch(`${BACKEND_URL}/book/config`, {
    data: {
      mode,
      currency: 'USD',
      timeZone: 'America/New_York',
      completeOnboarding: true,
    },
  });
  if (!config.ok()) {
    const body = await config.text();
    throw new Error(`Onboarding patch failed (${config.status()}): ${body}`);
  }
}
