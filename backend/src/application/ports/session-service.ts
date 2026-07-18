/**
 * Port: session lifecycle.
 */

export interface SessionData {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface SessionService {
  create(userId: string): Promise<SessionData>;
  findByToken(token: string): Promise<SessionData | null>;
  delete(token: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}
