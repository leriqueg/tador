import { request } from '@playwright/test';
import { waitForBackend } from './helpers/auth';

export default async function globalSetup(): Promise<void> {
  if (process.env.PLAYWRIGHT_SKIP_BACKEND_CHECK === '1') return;

  const ctx = await request.newContext();
  try {
    await waitForBackend(ctx);
  } finally {
    await ctx.dispose();
  }
}
