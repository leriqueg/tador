/**
 * AsientoVersion domain entity.
 * Captures a point-in-time snapshot of an asiento and its lines before a change.
 * Used for audit trail and version history.
 */

export interface AsientoVersion {
  id: string;
  asientoId: string;
  version: number;
  snapshot: Record<string, unknown>; // JSON: asiento + lines before change
  modifiedBy: string; // userId
  createdAt: Date;
}
