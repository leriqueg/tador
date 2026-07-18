/**
 * Port: book and book config persistence.
 */

import type { Book, BookConfig } from '../../domain/book.js';

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
