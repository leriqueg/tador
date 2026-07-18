/**
 * Entity capability rule (Sprint 07 — PRO ligero).
 *
 * Minimal rule hook: some apunte templates require the selected Entidad to
 * hold a specific capability (e.g. salary → is_employment_dependency).
 * Validation happens only at write time for the current apunte, never
 * retroactively (specs/foundation/reglas-entidades.md).
 */

export interface EntityCapabilitySubject {
  tipo: string;
  capabilities: string[];
}

export class EntityCapabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EntityCapabilityError';
  }
}

/**
 * Assert that a selected Entidad satisfies a template-declared capability
 * requirement. No-op when the template declares no requirement.
 */
export function assertEntityCapability(
  entity: EntityCapabilitySubject,
  requiredCapability: string | undefined,
): void {
  if (!requiredCapability) return;
  if (!entity.capabilities.includes(requiredCapability)) {
    throw new EntityCapabilityError(
      `Selected entity lacks required capability '${requiredCapability}'`,
    );
  }
}
