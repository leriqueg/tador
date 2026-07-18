/**
 * Argon2 password hasher adapter.
 */

import * as argon2 from 'argon2';
import type { PasswordHasher } from '../../application/ports/password-hasher.js';

export function createArgon2PasswordHasher(): PasswordHasher {
  return {
    hash(password: string): Promise<string> {
      return argon2.hash(password);
    },
    verify(hash: string, password: string): Promise<boolean> {
      return argon2.verify(hash, password);
    },
  };
}
