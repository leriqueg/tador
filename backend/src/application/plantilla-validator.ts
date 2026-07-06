/**
 * Plantilla hierarchy validator.
 *
 * Verifies whether a given account (CuentaGlobal or CuentaUsuario) belongs
 * to the hierarchy of a specific group (or groups) in the chart of accounts.
 *
 * The validator walks the parent chain of the account up to 10 levels,
 * checking if any ancestor (or the account itself) has a codigo matching
 * one of the group codes.
 *
 * For CuentaUsuario: follows globalId → CuentaGlobal first, then walks
 * the parent chain.
 */

import { prisma } from '../infrastructure/database.js';

const MAX_DEPTH = 10;

/**
 * Walk up the CuentaGlobal parentId chain and collect all ancestor codigos.
 * Includes the starting account's own codigo.
 * Stops at MAX_DEPTH to prevent infinite loops from circular references.
 */
async function collectAncestorCodes(
  cuentaGlobalId: string,
): Promise<string[]> {
  const codes: string[] = [];
  const visited = new Set<string>();
  let currentId: string | null = cuentaGlobalId;
  let depth = 0;

  while (currentId && depth < MAX_DEPTH) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const record = await prisma.cuentaGlobal.findUnique({
      where: { id: currentId },
      select: { codigo: true, parentId: true },
    });
    if (!record) break;

    codes.push(record.codigo);
    currentId = record.parentId;
    depth++;
  }

  return codes;
}

/**
 * Check if a CuentaGlobal's ancestor chain includes any of the given group codes.
 *
 * The account itself counts as a match (it IS the group). This means a postable
 * account whose codigo directly matches the group code will pass validation.
 *
 * @param cuentaGlobalId — the CuentaGlobal ID to check
 * @param groupCodes — array of group codigos to match against
 * @returns true if the account is under any of the specified groups
 */
export async function isCuentaGlobalUnderGroups(
  cuentaGlobalId: string,
  groupCodes: string[],
): Promise<boolean> {
  const ancestorCodes = await collectAncestorCodes(cuentaGlobalId);
  return ancestorCodes.some((c) => groupCodes.includes(c));
}

/**
 * Check if a CuentaUsuario's linked CuentaGlobal ancestor chain includes
 * any of the given group codes.
 *
 * @param cuentaUsuarioId — the CuentaUsuario ID to check
 * @param groupCodes — array of group codigos to match against
 * @returns true if the user account's linked global is under one of the groups
 */
export async function isCuentaUsuarioUnderGroups(
  cuentaUsuarioId: string,
  groupCodes: string[],
): Promise<boolean> {
  const cuentaUsuario = await prisma.cuentaUsuario.findUnique({
    where: { id: cuentaUsuarioId },
    select: { globalId: true },
  });

  if (!cuentaUsuario || !cuentaUsuario.globalId) {
    return false;
  }

  return isCuentaGlobalUnderGroups(cuentaUsuario.globalId, groupCodes);
}

/**
 * Check if ANY account (by ID, could be CuentaGlobal or CuentaUsuario)
 * is under any of the given group codes.
 *
 * - If the ID starts with 'cm' (typical CuentaGlobal ID prefix in cuid format),
 *   it's treated as a CuentaGlobal.
 * - Otherwise it's treated as a CuentaUsuario.
 *
 * Note: This heuristic works for the test/development CUID format.
 * For production, consider a more robust detection method.
 */
export async function isAccountUnderGroups(
  accountId: string,
  groupCodes: string[],
): Promise<boolean> {
  // Try as CuentaGlobal first
  const global = await prisma.cuentaGlobal.findUnique({
    where: { id: accountId },
    select: { id: true },
  });

  if (global) {
    return isCuentaGlobalUnderGroups(accountId, groupCodes);
  }

  // Try as CuentaUsuario
  return isCuentaUsuarioUnderGroups(accountId, groupCodes);
}
