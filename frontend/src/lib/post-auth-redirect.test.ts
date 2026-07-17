import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolvePostAuthDestination } from './post-auth-redirect.ts';
import { book } from './api.ts';

vi.mock('./api.ts', () => ({
  book: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(book.get);

describe('resolvePostAuthDestination', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('sends uninitialized users to onboarding', async () => {
    mockedGet.mockResolvedValue({
      book: { id: 'b1', createdAt: '2026-01-01' },
      config: {
        id: 'c1',
        currency: 'USD',
        locale: 'en-US',
        format: 'symbol',
        currencyLocked: false,
        mode: 'hogar',
        timeZone: 'UTC',
        onboardingCompletedAt: null,
        initialized: false,
      },
    });

    await expect(resolvePostAuthDestination()).resolves.toBe('/onboarding');
  });

  it('sends initialized users to dashboard', async () => {
    mockedGet.mockResolvedValue({
      book: { id: 'b1', createdAt: '2026-01-01' },
      config: {
        id: 'c1',
        currency: 'USD',
        locale: 'en-US',
        format: 'symbol',
        currencyLocked: false,
        mode: 'hogar',
        timeZone: 'UTC',
        onboardingCompletedAt: '2026-01-02T00:00:00.000Z',
        initialized: true,
      },
    });

    await expect(resolvePostAuthDestination()).resolves.toBe('/dashboard');
  });
});
