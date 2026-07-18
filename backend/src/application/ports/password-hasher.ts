/**
 * Port: password hashing (Argon2 adapter lives in infrastructure).
 */

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
}
