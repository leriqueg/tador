/**
 * Book domain entity and BookConfig.
 * Represents a user's financial book with configurable settings.
 */

export type BookMode = 'hogar' | 'pro';

export interface Book {
  id: string;
  userId: string;
  createdAt: Date;
}

export interface BookConfig {
  id: string;
  bookId: string;
  currency: string;
  locale: string;
  format: string;
  currencyLocked: boolean;
  mode: BookMode;
  timeZone: string;
  onboardingCompletedAt: Date | null;
  createdAt: Date;
}

export interface CreateBookInput {
  userId: string;
}

export interface UpdateBookConfigInput {
  currency?: string;
  locale?: string;
  format?: string;
  mode?: BookMode;
  timeZone?: string;
  /** When true, stamps onboardingCompletedAt if not already set */
  completeOnboarding?: boolean;
}

export function createBook(input: CreateBookInput): Book {
  return {
    id: '',
    userId: input.userId,
    createdAt: new Date(),
  };
}

export function createDefaultBookConfig(): BookConfig {
  return {
    id: '',
    bookId: '',
    currency: 'USD',
    locale: 'en-US',
    format: 'symbol',
    currencyLocked: false,
    mode: 'hogar',
    timeZone: 'UTC',
    onboardingCompletedAt: null,
    createdAt: new Date(),
  };
}

/**
 * Returns only the config fields suitable for Prisma create (no id/createdAt).
 */
export function defaultBookConfigCreateInput() {
  return {
    currency: 'USD',
    locale: 'en-US',
    format: 'symbol',
    currencyLocked: false,
    mode: 'hogar',
    timeZone: 'UTC',
    onboardingCompletedAt: null as Date | null,
  };
}

export function isBookInitialized(config: BookConfig): boolean {
  return config.onboardingCompletedAt !== null;
}

/**
 * Apply configuration updates with FR-006 rule:
 * currency cannot be changed if currencyLocked is true.
 *
 * @throws Error if attempting to change a locked currency or invalid mode.
 */
export function applyBookConfigUpdate(
  current: BookConfig,
  input: UpdateBookConfigInput,
): BookConfig {
  if (input.currency !== undefined && input.currency !== current.currency) {
    if (current.currencyLocked) {
      throw new Error(
        'Cannot change currency after financial activity has been recorded',
      );
    }
    current.currency = input.currency;
  }

  if (input.locale !== undefined) {
    current.locale = input.locale;
  }

  if (input.format !== undefined) {
    current.format = input.format;
  }

  if (input.mode !== undefined) {
    if (input.mode !== 'hogar' && input.mode !== 'pro') {
      throw new Error('Invalid book mode');
    }
    current.mode = input.mode;
  }

  if (input.timeZone !== undefined) {
    if (input.timeZone.trim() === '') {
      throw new Error('Invalid time zone');
    }
    current.timeZone = input.timeZone;
  }

  if (input.completeOnboarding === true && current.onboardingCompletedAt === null) {
    current.onboardingCompletedAt = new Date();
  }

  return { ...current };
}

/**
 * Lock the currency after first financial entry.
 */
export function lockCurrency(config: BookConfig): BookConfig {
  return { ...config, currencyLocked: true };
}
