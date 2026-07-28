/**
 * Operator domain — internal admin platform identity (013).
 * Distinct from product User.
 */

export type OperatorRole = 'support' | 'admin' | 'superadmin';

export const OPERATOR_ROLE_ORDER: Record<OperatorRole, number> = {
  support: 1,
  admin: 2,
  superadmin: 3,
};

export interface Operator {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  role: OperatorRole;
  mustChangePassword: boolean;
  passwordChangedAt: Date | null;
  blockedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function compareOperatorRoles(a: OperatorRole, b: OperatorRole): number {
  return OPERATOR_ROLE_ORDER[a] - OPERATOR_ROLE_ORDER[b];
}

export function operatorHasAtLeast(
  actual: OperatorRole,
  required: OperatorRole,
): boolean {
  return compareOperatorRoles(actual, required) >= 0;
}

export function isOperatorBlocked(operator: Pick<Operator, 'blockedAt'>): boolean {
  return operator.blockedAt !== null;
}
