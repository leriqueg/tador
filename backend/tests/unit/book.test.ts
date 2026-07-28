import { describe, it, expect } from 'vitest';
import {
  applyBookConfigUpdate,
  createDefaultBookConfig,
  isBookInitialized,
} from '../../src/domain/book.js';

describe('BookConfig onboarding', () => {
  it('is uninitialized until onboardingCompletedAt is set', () => {
    const config = createDefaultBookConfig();
    expect(isBookInitialized(config)).toBe(false);
    expect(config.mode).toBe('hogar');
    expect(config.timeZone).toBe('UTC');
  });

  it('completes onboarding once and updates mode, currency, timeZone', () => {
    const current = createDefaultBookConfig();
    const updated = applyBookConfigUpdate(current, {
      mode: 'hogar',
      currency: 'EUR',
      timeZone: 'America/Bogota',
      completeOnboarding: true,
    });

    expect(updated.currency).toBe('EUR');
    expect(updated.timeZone).toBe('America/Bogota');
    expect(updated.onboardingCompletedAt).toBeInstanceOf(Date);
    expect(isBookInitialized(updated)).toBe(true);

    const again = applyBookConfigUpdate(updated, { completeOnboarding: true });
    expect(again.onboardingCompletedAt).toEqual(updated.onboardingCompletedAt);
  });

  it('rejects invalid mode, empty timeZone, and unsupported locale', () => {
    const current = createDefaultBookConfig();
    expect(() =>
      applyBookConfigUpdate(current, { mode: 'enterprise' as 'hogar' }),
    ).toThrow('Invalid book mode');
    expect(() => applyBookConfigUpdate(current, { timeZone: '  ' })).toThrow(
      'Invalid time zone',
    );
    expect(() => applyBookConfigUpdate(current, { locale: 'fr-FR' })).toThrow(
      'Invalid locale',
    );
  });

  it('defaults to neutral Spanish locale', () => {
    expect(createDefaultBookConfig().locale).toBe('es');
  });
});
