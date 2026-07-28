import { describe, expect, it } from 'vitest';
import { resolveSessionCookieSecure } from '../../src/api/middleware/auth.js';

describe('resolveSessionCookieSecure', () => {
  it('COOKIE_SECURE=true forces Secure even outside production', () => {
    expect(
      resolveSessionCookieSecure({ COOKIE_SECURE: 'true', NODE_ENV: 'development' }),
    ).toBe(true);
  });

  it('COOKIE_SECURE=false allows HTTP demos under NODE_ENV=production', () => {
    expect(
      resolveSessionCookieSecure({ COOKIE_SECURE: 'false', NODE_ENV: 'production' }),
    ).toBe(false);
  });

  it('defaults to Secure when NODE_ENV=production and COOKIE_SECURE is unset', () => {
    expect(resolveSessionCookieSecure({ NODE_ENV: 'production' })).toBe(true);
  });

  it('defaults to non-Secure in development when COOKIE_SECURE is unset', () => {
    expect(resolveSessionCookieSecure({ NODE_ENV: 'development' })).toBe(false);
  });
});
