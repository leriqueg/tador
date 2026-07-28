/**
 * RED: isUserBlocked helper (T010).
 */

import { describe, expect, it } from 'vitest';
import { isUserBlocked, type User } from '../../src/domain/user.js';

function baseUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    email: 'user@test.com',
    passwordHash: 'hash',
    fullName: null,
    verifiedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    blockedAt: null,
    blockedReason: null,
    ...overrides,
  };
}

describe('isUserBlocked', () => {
  it('returns false when blockedAt is null', () => {
    expect(isUserBlocked(baseUser())).toBe(false);
  });

  it('returns true when blockedAt is set', () => {
    expect(
      isUserBlocked(
        baseUser({ blockedAt: new Date('2026-07-01T12:00:00.000Z'), blockedReason: 'abuse' }),
      ),
    ).toBe(true);
  });
});
