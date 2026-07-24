/**
 * RED: deployment profile parsing (T019).
 */

import { describe, expect, it } from 'vitest';
import {
  parseDeploymentProfile,
  deploymentAllowsAdmin,
  deploymentAllowsProduct,
} from '../../src/deployment-profile.js';

describe('deployment profile', () => {
  it('defaults to full when unset', () => {
    expect(parseDeploymentProfile({})).toBe('full');
  });

  it('parses product, admin, full (case-insensitive)', () => {
    expect(parseDeploymentProfile({ DEPLOYMENT_PROFILE: 'product' })).toBe('product');
    expect(parseDeploymentProfile({ DEPLOYMENT_PROFILE: 'ADMIN' })).toBe('admin');
    expect(parseDeploymentProfile({ DEPLOYMENT_PROFILE: 'Full' })).toBe('full');
  });

  it('falls back to full on unknown values', () => {
    expect(parseDeploymentProfile({ DEPLOYMENT_PROFILE: 'weird' })).toBe('full');
  });

  it('gates admin routes for full and admin only', () => {
    expect(deploymentAllowsAdmin('full')).toBe(true);
    expect(deploymentAllowsAdmin('admin')).toBe(true);
    expect(deploymentAllowsAdmin('product')).toBe(false);
  });

  it('gates product routes for full and product only', () => {
    expect(deploymentAllowsProduct('full')).toBe(true);
    expect(deploymentAllowsProduct('product')).toBe(true);
    expect(deploymentAllowsProduct('admin')).toBe(false);
  });
});
