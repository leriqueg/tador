/**
 * Application service for book operations.
 */

import type { BookRepository } from '../infrastructure/repositories/book-repo.js';
import type { Book, BookConfig } from '../domain/book.js';
import {
  applyBookConfigUpdate,
} from '../domain/book.js';
import { ensureOwnership } from '../domain/tenant.js';

/** MVP temporary: email verification does not block book access unless enabled. */
function isEmailVerificationRequired(): boolean {
  return process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
}

export interface UpdateBookConfigInput {
  currency?: string;
  locale?: string;
  format?: string;
  mode?: 'hogar' | 'pro';
  timeZone?: string;
  completeOnboarding?: boolean;
}

export interface BookApplicationService {
  getBook(userId: string, authenticatedUserId: string): Promise<Book>;
  getConfig(
    userId: string,
    bookId: string,
    authenticatedUserId: string,
  ): Promise<BookConfig>;
  updateConfig(
    userId: string,
    bookId: string,
    authenticatedUserId: string,
    input: UpdateBookConfigInput,
  ): Promise<BookConfig>;
}

export function createBookApplicationService(
  bookRepo: BookRepository,
  getUserVerifiedStatus: (userId: string) => Promise<boolean>,
): BookApplicationService {
  async function assertEmailVerifiedIfRequired(userId: string): Promise<void> {
    if (!isEmailVerificationRequired()) {
      return;
    }
    const isVerified = await getUserVerifiedStatus(userId);
    if (!isVerified) {
      throw new Error(
        'Email verification required before accessing financial book',
      );
    }
  }

  return {
    async getBook(
      userId: string,
      authenticatedUserId: string,
    ): Promise<Book> {
      ensureOwnership(userId, authenticatedUserId);
      await assertEmailVerifiedIfRequired(userId);

      const book = await bookRepo.findByUserId(userId);
      if (!book) {
        throw new Error('Book not found');
      }
      return book;
    },

    async getConfig(
      userId: string,
      bookId: string,
      authenticatedUserId: string,
    ): Promise<BookConfig> {
      ensureOwnership(userId, authenticatedUserId);

      const config = await bookRepo.getConfig(bookId);
      if (!config) {
        throw new Error('Book config not found');
      }
      return config;
    },

    async updateConfig(
      userId: string,
      bookId: string,
      authenticatedUserId: string,
      input: UpdateBookConfigInput,
    ): Promise<BookConfig> {
      ensureOwnership(userId, authenticatedUserId);
      await assertEmailVerifiedIfRequired(userId);

      const config = await bookRepo.getConfig(bookId);
      if (!config) {
        throw new Error('Book config not found');
      }

      const updated = applyBookConfigUpdate(config, input);
      return bookRepo.upsertConfig(bookId, updated);
    },
  };
}
