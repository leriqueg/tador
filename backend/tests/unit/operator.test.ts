/**
 * RED: OperatorRole ordering helpers (T009).
 * support < admin < superadmin
 */

import { describe, expect, it } from 'vitest';
import {
  OPERATOR_ROLE_ORDER,
  compareOperatorRoles,
  operatorHasAtLeast,
  type OperatorRole,
} from '../../src/domain/operator.js';

describe('OperatorRole helpers', () => {
  it('orders support < admin < superadmin', () => {
    expect(OPERATOR_ROLE_ORDER.support).toBeLessThan(OPERATOR_ROLE_ORDER.admin);
    expect(OPERATOR_ROLE_ORDER.admin).toBeLessThan(OPERATOR_ROLE_ORDER.superadmin);
  });

  it('compareOperatorRoles returns negative when left is lower', () => {
    expect(compareOperatorRoles('support', 'admin')).toBeLessThan(0);
    expect(compareOperatorRoles('admin', 'superadmin')).toBeLessThan(0);
  });

  it('compareOperatorRoles returns zero for equal roles', () => {
    expect(compareOperatorRoles('admin', 'admin')).toBe(0);
  });

  it('operatorHasAtLeast grants admin when required is support', () => {
    expect(operatorHasAtLeast('admin', 'support')).toBe(true);
  });

  it('operatorHasAtLeast denies support when required is admin', () => {
    expect(operatorHasAtLeast('support', 'admin')).toBe(false);
  });

  it('operatorHasAtLeast grants superadmin for every role', () => {
    const roles: OperatorRole[] = ['support', 'admin', 'superadmin'];
    for (const required of roles) {
      expect(operatorHasAtLeast('superadmin', required)).toBe(true);
    }
  });
});
