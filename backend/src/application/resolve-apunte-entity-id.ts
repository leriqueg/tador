/**
 * Pure helper: resolve apunte.entityId from explicit client value or bank/card accounts.
 *
 * FR-009 / FR-010: income/expense apuntes auto-fill from CuentaUsuario.entidadId;
 * transferencias are excluded from auto-assignment.
 */

export interface ApunteLineAccountMeta {
  accountId: string;
  tipoCuenta: string | null;
  entidadId: string | null;
}

export interface ResolveApunteEntityIdInput {
  templateCode?: string | null;
  explicitEntityId?: string | null;
  lineAccounts: ApunteLineAccountMeta[];
}

export type ResolveApunteEntityIdResult =
  | { ok: true; entityId: string | null }
  | { ok: false; statusCode: 400; error: string };

const BANK_CARD_TYPES = new Set(['bank', 'card']);

function isBankOrCard(tipoCuenta: string | null): boolean {
  return tipoCuenta != null && BANK_CARD_TYPES.has(tipoCuenta);
}

export function resolveApunteEntityId(
  input: ResolveApunteEntityIdInput,
): ResolveApunteEntityIdResult {
  if (input.explicitEntityId) {
    return { ok: true, entityId: input.explicitEntityId };
  }

  if (input.templateCode === 'transferencia') {
    return { ok: true, entityId: null };
  }

  const distinctEntidadIds = [
    ...new Set(
      input.lineAccounts
        .filter((a) => isBankOrCard(a.tipoCuenta) && a.entidadId)
        .map((a) => a.entidadId as string),
    ),
  ];

  if (distinctEntidadIds.length === 0) {
    return { ok: true, entityId: null };
  }

  if (distinctEntidadIds.length === 1) {
    return { ok: true, entityId: distinctEntidadIds[0] };
  }

  return {
    ok: false,
    statusCode: 400,
    error: 'Ambiguous entityId: multiple bank/card entities on lines',
  };
}

/**
 * Load bank/card metadata for apunte line account ids (route adapter).
 */
export async function loadLineAccountMetaForEntityResolution(
  accountIds: string[],
  userId: string,
  prisma: {
    cuentaUsuario: {
      findMany: (args: {
        where: { id: { in: string[] }; userId: string };
        select: { id: true; tipoCuenta: true; entidadId: true };
      }) => Promise<
        Array<{ id: string; tipoCuenta: string; entidadId: string | null }>
      >;
    };
  },
): Promise<ApunteLineAccountMeta[]> {
  if (accountIds.length === 0) return [];

  const rows = await prisma.cuentaUsuario.findMany({
    where: { id: { in: accountIds }, userId },
    select: { id: true, tipoCuenta: true, entidadId: true },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));

  return accountIds.map((accountId) => {
    const row = byId.get(accountId);
    if (!row) {
      return { accountId, tipoCuenta: null, entidadId: null };
    }
    return {
      accountId,
      tipoCuenta: row.tipoCuenta,
      entidadId: row.entidadId,
    };
  });
}
