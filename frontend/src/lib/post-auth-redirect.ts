/**
 * FR-009: after login/register, uninitialized book → /onboarding;
 * else → mode namespace dashboard (/hogar/dashboard or /pro/dashboard).
 */

import { book } from './api';

export type PostAuthDestination = '/onboarding' | '/hogar/dashboard' | '/pro/dashboard';

export async function resolvePostAuthDestination(): Promise<PostAuthDestination> {
  const { config } = await book.get();
  return config.initialized ? `/${config.mode}/dashboard` : '/onboarding';
}
