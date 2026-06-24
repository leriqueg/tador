/**
 * Tenant isolation domain guard.
 * Ensures every data access is scoped to the authenticated user.
 */

/**
 * Result of a tenant ownership check.
 */
export interface OwnershipCheck {
  isOwner: boolean;
}

/**
 * Verify that a resource belongs to the authenticated user.
 * This is the domain-level guard — must be called before any data access.
 *
 * @throws Error if the user does not own the resource.
 */
export function ensureOwnership(
  resourceUserId: string,
  authenticatedUserId: string,
): void {
  if (resourceUserId !== authenticatedUserId) {
    throw new Error('Access denied: resource does not belong to this user');
  }
}

/**
 * Safe ownership check that returns a boolean instead of throwing.
 */
export function checkOwnership(
  resourceUserId: string,
  authenticatedUserId: string,
): OwnershipCheck {
  return {
    isOwner: resourceUserId === authenticatedUserId,
  };
}
