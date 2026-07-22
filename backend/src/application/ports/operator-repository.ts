/**
 * Port: operator persistence (013).
 */

import type { Operator, OperatorRole } from '../../domain/operator.js';

export interface CreateOperatorInput {
  email: string;
  passwordHash: string;
  displayName?: string | null;
  role: OperatorRole;
  mustChangePassword: boolean;
}

export interface OperatorSessionData {
  id: string;
  operatorId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface OperatorRepository {
  count(): Promise<number>;
  findById(id: string): Promise<Operator | null>;
  findByEmail(email: string): Promise<Operator | null>;
  create(input: CreateOperatorInput): Promise<Operator>;
  update(operator: Operator): Promise<Operator>;
  createSession(input: {
    operatorId: string;
    token: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<OperatorSessionData>;
  findSessionByToken(token: string): Promise<OperatorSessionData | null>;
  deleteSession(token: string): Promise<void>;
  deleteAllSessionsForOperator(operatorId: string): Promise<void>;
}
