/**
 * Operator authentication application service skeleton (013).
 * Full login/logout/me/changePassword completed in US1.
 */

import { generateSessionToken } from '../../domain/auth.js';
import {
  isOperatorBlocked,
  type Operator,
  type OperatorRole,
} from '../../domain/operator.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { OperatorRepository } from '../ports/operator-repository.js';

const OPERATOR_SESSION_HOURS = 8;

export interface OperatorLoginInput {
  email: string;
  password: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface OperatorAuthResult {
  operator: Operator;
  sessionToken: string;
}

export interface OperatorPublicProfile {
  id: string;
  email: string;
  displayName: string | null;
  role: OperatorRole;
  mustChangePassword: boolean;
}

export interface OperatorAuthApplicationService {
  login(input: OperatorLoginInput): Promise<OperatorAuthResult>;
  logout(sessionToken: string): Promise<void>;
  me(sessionToken: string): Promise<Operator | null>;
  changePassword(
    sessionToken: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<OperatorAuthResult>;
}

export function toOperatorPublicProfile(operator: Operator): OperatorPublicProfile {
  return {
    id: operator.id,
    email: operator.email,
    displayName: operator.displayName,
    role: operator.role,
    mustChangePassword: operator.mustChangePassword,
  };
}

function sessionExpiresAt(): Date {
  return new Date(Date.now() + OPERATOR_SESSION_HOURS * 60 * 60 * 1000);
}

export function createOperatorAuthApplicationService(
  operatorRepo: OperatorRepository,
  passwordHasher: PasswordHasher,
): OperatorAuthApplicationService {
  async function me(sessionToken: string): Promise<Operator | null> {
    const session = await operatorRepo.findSessionByToken(sessionToken);
    if (!session) return null;
    const operator = await operatorRepo.findById(session.operatorId);
    if (!operator || isOperatorBlocked(operator)) return null;
    return operator;
  }

  return {
    async login(input: OperatorLoginInput): Promise<OperatorAuthResult> {
      const operator = await operatorRepo.findByEmail(input.email);
      if (!operator) {
        throw new Error('Invalid email or password');
      }
      if (isOperatorBlocked(operator)) {
        throw new Error('Operator blocked');
      }
      const valid = await passwordHasher.verify(operator.passwordHash, input.password);
      if (!valid) {
        throw new Error('Invalid email or password');
      }

      const token = generateSessionToken();
      await operatorRepo.createSession({
        operatorId: operator.id,
        token,
        expiresAt: sessionExpiresAt(),
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });

      operator.lastLoginAt = new Date();
      await operatorRepo.update(operator);

      return { operator, sessionToken: token };
    },

    async logout(sessionToken: string): Promise<void> {
      await operatorRepo.deleteSession(sessionToken);
    },

    me,

    async changePassword(
      sessionToken: string,
      currentPassword: string,
      newPassword: string,
    ): Promise<OperatorAuthResult> {
      const operator = await me(sessionToken);
      if (!operator) {
        throw new Error('Not authenticated');
      }
      const valid = await passwordHasher.verify(operator.passwordHash, currentPassword);
      if (!valid) {
        throw new Error('Invalid current password');
      }
      if (newPassword.length < 12) {
        throw new Error('Password must be at least 12 characters');
      }

      operator.passwordHash = await passwordHasher.hash(newPassword);
      operator.mustChangePassword = false;
      operator.passwordChangedAt = new Date();
      await operatorRepo.update(operator);
      await operatorRepo.deleteAllSessionsForOperator(operator.id);

      const token = generateSessionToken();
      await operatorRepo.createSession({
        operatorId: operator.id,
        token,
        expiresAt: sessionExpiresAt(),
      });

      return { operator, sessionToken: token };
    },
  };
}
