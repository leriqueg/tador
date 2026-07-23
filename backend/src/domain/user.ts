/**
 * User domain entity.
 * Represents a registered user who owns financial data.
 */

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  /** Null = active; set by admin block (013). */
  blockedAt: Date | null;
  blockedReason: string | null;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
}

export function createUser(input: CreateUserInput): User {
  return {
    id: '',
    email: input.email,
    passwordHash: input.passwordHash,
    fullName: null,
    verifiedAt: null,
    createdAt: new Date(),
    blockedAt: null,
    blockedReason: null,
  };
}

export function isUserVerified(user: User): boolean {
  return user.verifiedAt !== null;
}

export function isUserBlocked(user: Pick<User, 'blockedAt'>): boolean {
  return user.blockedAt !== null;
}
