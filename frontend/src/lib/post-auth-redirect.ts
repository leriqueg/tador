/**
 * FR-009: after login/register, uninitialized book → /onboarding; else → /dashboard.
 */

import { book } from './api';

export type PostAuthDestination = '/onboarding' | '/dashboard';

export async function resolvePostAuthDestination(): Promise<PostAuthDestination> {
  const { config } = await book.get();
  return config.initialized ? '/dashboard' : '/onboarding';
}
