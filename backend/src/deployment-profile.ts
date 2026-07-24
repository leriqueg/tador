/**
 * Deployment profile — which HTTP surfaces register at startup (013 / ADR 0006).
 */

export type DeploymentProfile = 'full' | 'product' | 'admin';

export function parseDeploymentProfile(
  env: NodeJS.ProcessEnv = process.env,
): DeploymentProfile {
  const raw = (env.DEPLOYMENT_PROFILE ?? 'full').trim().toLowerCase();
  if (raw === 'product' || raw === 'admin' || raw === 'full') {
    return raw;
  }
  return 'full';
}

export function deploymentAllowsAdmin(profile: DeploymentProfile): boolean {
  return profile === 'full' || profile === 'admin';
}

export function deploymentAllowsProduct(profile: DeploymentProfile): boolean {
  return profile === 'full' || profile === 'product';
}
