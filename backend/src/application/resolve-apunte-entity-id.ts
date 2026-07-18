/**
 * Pure helper: resolve apunte.entityId from explicit client value or bank/card accounts.
 *
 * FR-009 / FR-010: income/expense apuntes auto-fill from CuentaUsuario.entidadId;
 * transferencias and other balance-only plantillas are excluded from auto-assignment.
 *
 * When the plantilla reserves entityId for a related-party capability
 * (e.g. sueldo → is_employment_dependency), skip bank/card auto-fill so the
 * bank is not mistaken for the employer and V11 does not reject the apunte.
 */

import type { AccountRepository } from './ports/account-repository.js';

export interface ApunteLineAccountMeta {
  accountId: string;
  tipoCuenta: string | null;
  entidadId: string | null;
}

export interface ResolveApunteEntityIdInput {
  templateCode?: string | null;
  explicitEntityId?: string | null;
  lineAccounts: ApunteLineAccountMeta[];
  /** Plantilla entity slot requires a capability — do not auto-fill from bank/card. */
  skipBankAutoFill?: boolean;
}

export type ResolveApunteEntityIdResult =
  | { ok: true; entityId: string | null }
  | { ok: false; statusCode: 400; error: string };

const BANK_CARD_TYPES = new Set(['bank', 'card']);

/** Balance movements: no FR-009 bank auto-entityId (person/card debt is on the line account). */
const TRANSFER_LIKE_TEMPLATE_CODES = new Set([
  'transferencia',
  'deposito_bancario',
  'retiro_bancario',
  'pago_tarjeta',
  'prestamo_otorgado',
  'cobro_prestamo',
]);

function isBankOrCard(tipoCuenta: string | null): boolean {
  return tipoCuenta != null && BANK_CARD_TYPES.has(tipoCuenta);
}

export function resolveApunteEntityId(
  input: ResolveApunteEntityIdInput,
): ResolveApunteEntityIdResult {
  if (input.explicitEntityId) {
    return { ok: true, entityId: input.explicitEntityId };
  }

  if (
    input.skipBankAutoFill ||
    (input.templateCode != null &&
      TRANSFER_LIKE_TEMPLATE_CODES.has(input.templateCode))
  ) {
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
 * Load bank/card metadata for apunte line account ids via AccountRepository.
 */
export async function loadLineAccountMetaForEntityResolution(
  accounts: AccountRepository,
  accountIds: string[],
  userId: string,
): Promise<ApunteLineAccountMeta[]> {
  if (accountIds.length === 0) return [];

  const rows = await accounts.findUserAccountLineMeta(userId, accountIds);
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
