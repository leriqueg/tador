/**
 * Port: user persistence.
 */

import type { User, CreateUserInput } from '../../domain/user.js';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  update(user: User): Promise<User>;
}
