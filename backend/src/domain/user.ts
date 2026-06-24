/**
 * User domain entity.
 * Represents a registered user who owns financial data.
 */

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  verifiedAt: Date | null;
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
}

export function createUser(input: CreateUserInput): User {
  return {
    id: '', // assigned by repository
    email: input.email,
    passwordHash: input.passwordHash,
    verifiedAt: null,
    createdAt: new Date(),
  };
}

export function isUserVerified(user: User): boolean {
  return user.verifiedAt !== null;
}
