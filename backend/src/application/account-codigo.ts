/**
 * Auto-assign a codigo for a user account based on its parent CuentaGlobal.
 * Pattern [A][BBB][1][DDD] (8 digits).
 */

import type { AccountRepository } from './ports/account-repository.js';

export async function autoAsignarCodigo(
  accounts: AccountRepository,
  globalId: string | null,
  userId: string,
): Promise<string | null> {
  if (!globalId) return null;

  const parentCodigo = await accounts.findGlobalCodigo(globalId);
  if (!parentCodigo) return null;

  const n1 = parentCodigo[0];
  const n2 = parentCodigo.substring(1, 4);
  const base = `${n1}${n2}1`;

  const existingCodigo = await accounts.findLatestUserCodigoWithPrefix(
    userId,
    base,
  );

  let nextN4 = 1;
  if (existingCodigo) {
    const lastN4 = parseInt(existingCodigo.substring(7), 10);
    nextN4 = lastN4 + 1;
  }

  return `${base}${nextN4.toString().padStart(3, '0')}`;
}
