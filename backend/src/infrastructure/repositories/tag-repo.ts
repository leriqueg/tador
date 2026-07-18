/**
 * Prisma adapter for TagRepository.
 */

import { prisma } from '../database.js';
import type {
  TagRecord,
  TagRepository,
} from '../../application/ports/tag-repository.js';
import { TagConflictError } from '../../application/ports/tag-repository.js';

export type { TagRepository };

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Error &&
    'code' in err &&
    (err as { code: string }).code === 'P2002'
  );
}

export function createTagRepository(): TagRepository {
  return {
    async listByUser(userId: string): Promise<TagRecord[]> {
      return prisma.tag.findMany({
        where: { userId },
        orderBy: { nombre: 'asc' },
      });
    },

    async create(userId: string, nombre: string): Promise<TagRecord> {
      try {
        return await prisma.tag.create({
          data: { userId, nombre },
        });
      } catch (err) {
        if (isUniqueViolation(err)) throw new TagConflictError();
        throw err;
      }
    },

    async findByIdForUser(
      id: string,
      userId: string,
    ): Promise<TagRecord | null> {
      return prisma.tag.findFirst({ where: { id, userId } });
    },

    async updateNombre(id: string, nombre: string): Promise<TagRecord> {
      try {
        return await prisma.tag.update({
          where: { id },
          data: { nombre },
        });
      } catch (err) {
        if (isUniqueViolation(err)) throw new TagConflictError();
        throw err;
      }
    },

    async delete(id: string): Promise<void> {
      await prisma.tag.delete({ where: { id } });
    },
  };
}
