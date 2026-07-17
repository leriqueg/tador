/**
 * Unit tests: entity capability rule (Sprint 07 — T006).
 *
 * Minimal rule hook: apuntes that require a specific Entidad capability
 * (e.g. salary → is_employment_dependency) must reject a selected entity
 * that lacks it.
 */

import { describe, it, expect } from 'vitest';
import {
  assertEntityCapability,
  EntityCapabilityError,
} from '../../src/domain/entity-capability-rule.js';

describe('assertEntityCapability', () => {
  it('should not throw when no capability is required', () => {
    expect(() =>
      assertEntityCapability(
        { tipo: 'organization', capabilities: [] },
        undefined,
      ),
    ).not.toThrow();
  });

  it('should not throw when the entity has the required capability', () => {
    expect(() =>
      assertEntityCapability(
        { tipo: 'organization', capabilities: ['is_employment_dependency'] },
        'is_employment_dependency',
      ),
    ).not.toThrow();
  });

  it('should throw EntityCapabilityError when the entity lacks the required capability', () => {
    expect(() =>
      assertEntityCapability(
        { tipo: 'organization', capabilities: ['can_be_customer'] },
        'is_employment_dependency',
      ),
    ).toThrow(EntityCapabilityError);
  });

  it('should throw a descriptive message naming the missing capability', () => {
    expect(() =>
      assertEntityCapability(
        { tipo: 'organization', capabilities: [] },
        'is_employment_dependency',
      ),
    ).toThrow(/is_employment_dependency/);
  });

  it('should triangulate with a different required capability (can_be_supplier)', () => {
    expect(() =>
      assertEntityCapability(
        { tipo: 'organization', capabilities: ['is_employment_dependency'] },
        'can_be_supplier',
      ),
    ).toThrow(/can_be_supplier/);
  });
});
