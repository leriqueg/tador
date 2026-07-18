/**
 * Plantilla hierarchy validator.
 *
 * Verifies whether a given account (CuentaGlobal or CuentaUsuario) belongs
 * to the hierarchy of a specific group (or groups) in the chart of accounts.
 */

import type { AccountRepository } from './ports/account-repository.js';

const MAX_DEPTH = 10;

async function collectAncestorCodes(
  accounts: AccountRepository,
  cuentaGlobalId: string,
): Promise<string[]> {
  const codes: string[] = [];
  const visited = new Set<string>();
  let currentId: string | null = cuentaGlobalId;
  let depth = 0;

  while (currentId && depth < MAX_DEPTH) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const record = await accounts.findGlobalParentLink(currentId);
    if (!record) break;

    codes.push(record.codigo);
    currentId = record.parentId;
    depth++;
  }

  return codes;
}

export async function isCuentaGlobalUnderGroups(
  accounts: AccountRepository,
  cuentaGlobalId: string,
  groupCodes: string[],
): Promise<boolean> {
  const ancestorCodes = await collectAncestorCodes(accounts, cuentaGlobalId);
  return ancestorCodes.some((c) => groupCodes.includes(c));
}

export async function isCuentaUsuarioUnderGroups(
  accounts: AccountRepository,
  cuentaUsuarioId: string,
  groupCodes: string[],
): Promise<boolean> {
  const globalId = await accounts.findUserAccountGlobalId(cuentaUsuarioId);
  if (!globalId) {
    return false;
  }

  return isCuentaGlobalUnderGroups(accounts, globalId, groupCodes);
}

export async function isAccountUnderGroups(
  accounts: AccountRepository,
  accountId: string,
  groupCodes: string[],
): Promise<boolean> {
  if (await accounts.globalExists(accountId)) {
    return isCuentaGlobalUnderGroups(accounts, accountId, groupCodes);
  }

  return isCuentaUsuarioUnderGroups(accounts, accountId, groupCodes);
}
