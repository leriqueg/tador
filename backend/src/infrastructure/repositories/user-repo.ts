/**
 * Prisma-based User repository.
 */

import { prisma } from '../database.js';
import type { User, CreateUserInput } from '../../domain/user.js';
import type { UserRepository } from '../../application/ports/user-repository.js';

export type { UserRepository };

export function createUserRepository(): UserRepository {
  return {
    async findById(id: string): Promise<User | null> {
      const record = await prisma.user.findUnique({ where: { id } });
      if (!record) return null;
      return mapToDomain(record);
    },

    async findByEmail(email: string): Promise<User | null> {
      const record = await prisma.user.findUnique({ where: { email } });
      if (!record) return null;
      return mapToDomain(record);
    },

    async create(input: CreateUserInput): Promise<User> {
      const record = await prisma.user.create({
        data: {
          email: input.email,
          passwordHash: input.passwordHash,
        },
      });
      return mapToDomain(record);
    },

    async update(user: User): Promise<User> {
      const record = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: user.email,
          passwordHash: user.passwordHash,
          fullName: user.fullName,
          verifiedAt: user.verifiedAt,
        },
      });
      return mapToDomain(record);
    },
  };
}

function mapToDomain(record: {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
}): User {
  return {
    id: record.id,
    email: record.email,
    passwordHash: record.passwordHash,
    fullName: record.fullName,
    verifiedAt: record.verifiedAt,
    createdAt: record.createdAt,
  };
}
