import { describe, expect, it } from 'vitest';
import { resolveNamespaceRedirect } from './namespace-guard.ts';

describe('resolveNamespaceRedirect', () => {
  it('redirects /hogar/* to /pro/* when mode is pro (US0.1)', () => {
    expect(resolveNamespaceRedirect('/hogar/entries', 'pro')).toBe('/pro/entries');
  });

  it('redirects /pro/* to /hogar/* when mode is hogar (US0.2)', () => {
    expect(resolveNamespaceRedirect('/pro/dashboard', 'hogar')).toBe('/hogar/dashboard');
  });

  it('preserves nested sub-paths when redirecting across namespaces', () => {
    expect(resolveNamespaceRedirect('/pro/finances/pyg', 'hogar')).toBe('/hogar/finances/pyg');
  });

  it('redirects legacy unprefixed routes to the mode namespace (hogar)', () => {
    expect(resolveNamespaceRedirect('/dashboard', 'hogar')).toBe('/hogar/dashboard');
  });

  it('redirects legacy unprefixed routes to the mode namespace (pro)', () => {
    expect(resolveNamespaceRedirect('/dashboard', 'pro')).toBe('/pro/dashboard');
  });

  it('redirects legacy nested routes preserving the remaining path', () => {
    expect(resolveNamespaceRedirect('/finances/balance', 'pro')).toBe('/pro/finances/balance');
  });

  it('returns null when already in the correct namespace', () => {
    expect(resolveNamespaceRedirect('/hogar/dashboard', 'hogar')).toBeNull();
  });

  it('returns null for routes outside any known namespace or legacy segment', () => {
    expect(resolveNamespaceRedirect('/login', 'hogar')).toBeNull();
    expect(resolveNamespaceRedirect('/onboarding', 'pro')).toBeNull();
  });
});
