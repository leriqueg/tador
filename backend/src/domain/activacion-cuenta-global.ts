/**
 * ActivacionCuentaGlobal domain entity.
 * Tracks which global accounts a user has activated (FR-009/010 hybrid model).
 * A user may override the display name of a global account via nombreOverride.
 */

export interface ActivacionCuentaGlobal {
  id: string;
  userId: string;
  globalId: string;
  activa: boolean;
  nombreOverride: string | null;
  createdAt: Date;
}
