/**
 * Prisma-based Book and BookConfig repository.
 */

import { prisma } from '../database.js';
import type { Book, BookConfig, BookMode } from '../../domain/book.js';
import { defaultBookConfigCreateInput } from '../../domain/book.js';

export interface BookRepository {
  findById(id: string): Promise<Book | null>;
  findByUserId(userId: string): Promise<Book | null>;
  create(userId: string): Promise<Book>;
  getConfig(bookId: string): Promise<BookConfig | null>;
  upsertConfig(
    bookId: string,
    config: Partial<BookConfig>,
  ): Promise<BookConfig>;
}

export function createBookRepository(): BookRepository {
  return {
    async findById(id: string): Promise<Book | null> {
      const record = await prisma.book.findUnique({ where: { id } });
      if (!record) return null;
      return mapBook(record);
    },

    async findByUserId(userId: string): Promise<Book | null> {
      const record = await prisma.book.findFirst({
        where: { userId },
      });
      if (!record) return null;
      return mapBook(record);
    },

    async create(userId: string): Promise<Book> {
      const record = await prisma.book.create({
        data: {
          userId,
          config: {
            create: defaultBookConfigCreateInput(),
          },
        },
      });
      return mapBook(record);
    },

    async getConfig(bookId: string): Promise<BookConfig | null> {
      const record = await prisma.bookConfig.findUnique({
        where: { bookId },
      });
      if (!record) return null;
      return mapConfig(record);
    },

    async upsertConfig(
      bookId: string,
      config: Partial<BookConfig>,
    ): Promise<BookConfig> {
      const record = await prisma.bookConfig.upsert({
        where: { bookId },
        create: {
          bookId,
          currency: config.currency ?? 'USD',
          locale: config.locale ?? 'en-US',
          format: config.format ?? 'symbol',
          currencyLocked: config.currencyLocked ?? false,
          mode: config.mode ?? 'hogar',
          timeZone: config.timeZone ?? 'UTC',
          onboardingCompletedAt: config.onboardingCompletedAt ?? null,
        },
        update: {
          ...(config.currency !== undefined && { currency: config.currency }),
          ...(config.locale !== undefined && { locale: config.locale }),
          ...(config.format !== undefined && { format: config.format }),
          ...(config.currencyLocked !== undefined && {
            currencyLocked: config.currencyLocked,
          }),
          ...(config.mode !== undefined && { mode: config.mode }),
          ...(config.timeZone !== undefined && { timeZone: config.timeZone }),
          ...(config.onboardingCompletedAt !== undefined && {
            onboardingCompletedAt: config.onboardingCompletedAt,
          }),
        },
      });
      return mapConfig(record);
    },
  };
}

function mapBook(record: {
  id: string;
  userId: string;
  createdAt: Date;
}): Book {
  return {
    id: record.id,
    userId: record.userId,
    createdAt: record.createdAt,
  };
}

function mapConfig(record: {
  id: string;
  bookId: string;
  currency: string;
  locale: string;
  format: string;
  currencyLocked: boolean;
  mode: string;
  timeZone: string;
  onboardingCompletedAt: Date | null;
  createdAt: Date;
}): BookConfig {
  return {
    id: record.id,
    bookId: record.bookId,
    currency: record.currency,
    locale: record.locale,
    format: record.format,
    currencyLocked: record.currencyLocked,
    mode: record.mode as BookMode,
    timeZone: record.timeZone,
    onboardingCompletedAt: record.onboardingCompletedAt,
    createdAt: record.createdAt,
  };
}
