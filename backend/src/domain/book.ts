/**
 * Book domain entity and BookConfig.
 * Represents a user's financial book with configurable settings.
 */

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
  createdAt: Date;
}

export interface CreateBookInput {
  userId: string;
}

export interface UpdateBookConfigInput {
  currency?: string;
  locale?: string;
  format?: string;
}

export function createBook(input: CreateBookInput): Book {
  return {
    id: '', // assigned by repository
    userId: input.userId,
    createdAt: new Date(),
  };
}

export function createDefaultBookConfig(): BookConfig {
  return {
    id: '', // assigned by repository
    bookId: '', // assigned by repository
    currency: 'USD',
    locale: 'en-US',
    format: 'symbol',
    currencyLocked: false,
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
  };
}

/**
 * Apply configuration updates with FR-006 rule:
 * currency cannot be changed if currencyLocked is true.
 *
 * @throws Error if attempting to change a locked currency.
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

  return { ...current };
}

/**
 * Lock the currency after first financial entry.
 */
export function lockCurrency(config: BookConfig): BookConfig {
  return { ...config, currencyLocked: true };
}
