import { useEffect, useState } from 'react';
import Button from '../ui/Button.tsx';
import TextInput from '../ui/TextInput.tsx';
import ValidationMessage from '../ui/ValidationMessage.tsx';
import { formatMoney } from '../../lib/finance.ts';
import type {
  AccountSummary,
  ChartActivation,
  ChartGlobalNode,
  CreateAccountInput,
  TipoCuentaManualCreate,
} from '../../lib/api.ts';
import {
  buildAccountsTree,
  friendlyAccountCreateError,
  manualCreateAccountTypes,
  mothersForAccountType,
  preferredMotherCodigo,
  type AccountsTreeGroup,
} from './accounts-tree.ts';

export interface AccountsTreeProProps {
  chart: ChartGlobalNode[];
  accounts: AccountSummary[];
  balances: Record<string, number>;
  onCreateAccount: (input: CreateAccountInput) => Promise<void>;
  activations?: ChartActivation[];
  onToggleAccountBalancePolicy?: (id: string, enforce: boolean) => Promise<void>;
  onToggleGlobalBalancePolicy?: (id: string, enforce: boolean) => Promise<void>;
  currency?: string;
}

const TIPO_LABEL: Record<string, string> = {
  expenseCategory: 'Gasto',
  incomeCategory: 'Ingreso',
  wallet: 'Billetera',
  bridge: 'Puente',
  bank: 'Banco',
  card: 'Tarjeta',
};

function isProtectedCode(code: string | null): boolean {
  return (
    code?.startsWith('1111') === true ||
    code?.startsWith('1112') === true ||
    code?.startsWith('1132') === true ||
    code?.startsWith('2112') === true ||
    code?.startsWith('2120') === true
  );
}

function groupHasVisibleContent(group: AccountsTreeGroup): boolean {
  if (group.esPostable) return true;
  if (group.accounts.length > 0) return true;
  return group.children.some(groupHasVisibleContent);
}

function GroupSection({
  group,
  depth,
  currency,
  savingPolicyId,
  onToggleAccountBalancePolicy,
}: {
  group: AccountsTreeGroup;
  depth: number;
  currency: string;
  savingPolicyId: string | null;
  onToggleAccountBalancePolicy?: (id: string, enforce: boolean) => Promise<void>;
}) {
  if (!groupHasVisibleContent(group) && group.id !== '__orphan__') return null;

  const catalogLeaves = group.children.filter((c) => c.esPostable);
  const subgroups = group.children.filter((c) => !c.esPostable);

  return (
    <section className="space-y-xs" style={{ marginLeft: depth * 12 }}>
      <header className="flex items-baseline gap-sm py-xs">
        <span className="font-mono text-label-sm text-primary">{group.codigo}</span>
        <h3 className="text-label-md font-semibold text-on-surface">{group.nombre}</h3>
      </header>

      {catalogLeaves.length > 0 && (
        <ul className="space-y-xs mb-sm" aria-label={`Catálogo bajo ${group.codigo}`}>
          {catalogLeaves.map((leaf) => (
            <li
              key={leaf.id}
              className="flex items-center justify-between gap-md p-sm rounded-lg border border-outline-variant/30 bg-surface"
            >
              <div>
                <p className="text-body-md text-on-surface font-medium">
                  <span className="font-mono text-label-sm text-on-surface-variant mr-sm">
                    {leaf.codigo}
                  </span>
                  {leaf.nombre}
                </p>
                <p className="text-label-sm text-on-surface-variant">Catálogo · no editable</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {group.accounts.length > 0 && (
        <ul className="space-y-xs mb-sm" aria-label={`Cuentas del libro bajo ${group.codigo}`}>
          {group.accounts.map((acc) => (
            <li
              key={acc.id}
              className="flex items-center justify-between gap-md p-sm rounded-lg bg-surface-container-low"
            >
              <div>
                <p className="text-body-md text-on-surface font-medium">
                  <span className="font-mono text-label-sm text-on-surface-variant mr-sm">
                    {acc.codigo ?? '—'}
                  </span>
                  {acc.nombre}
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  {TIPO_LABEL[acc.tipoCuenta] ?? acc.tipoCuenta}
                  {acc.isEntityProvisioned ? ' · vía Entidad' : ' · tu libro'}
                </p>
              </div>
              {acc.saldo != null && (
                <span className="text-body-md font-semibold tabular-nums">
                  {formatMoney(acc.saldo, currency)}
                </span>
              )}
              {onToggleAccountBalancePolicy && isProtectedCode(acc.codigo) && (
                <label className="flex items-center gap-xs text-label-sm text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={acc.enforceNonNegativeBalance !== false}
                    disabled={savingPolicyId === acc.id}
                    onChange={(event) =>
                      void onToggleAccountBalancePolicy(
                        acc.id,
                        event.target.checked,
                      )
                    }
                  />
                  Impedir saldo negativo
                </label>
              )}
            </li>
          ))}
        </ul>
      )}

      {subgroups.map((child) => (
        <GroupSection
          key={child.id}
          group={child}
          depth={depth + 1}
          currency={currency}
          savingPolicyId={savingPolicyId}
          onToggleAccountBalancePolicy={onToggleAccountBalancePolicy}
        />
      ))}
    </section>
  );
}

export default function AccountsTreePro({
  chart,
  accounts,
  balances,
  onCreateAccount,
  activations = [],
  onToggleAccountBalancePolicy,
  onToggleGlobalBalancePolicy,
  currency = 'USD',
}: AccountsTreeProProps) {
  const tree = buildAccountsTree(chart, accounts, balances);
  const createTypes = manualCreateAccountTypes();

  const [tipoCuenta, setTipoCuenta] = useState<TipoCuentaManualCreate>(
    createTypes[0] ?? 'incomeCategory',
  );
  const mothers = mothersForAccountType(chart, tipoCuenta);
  const [parentGroupCodigo, setParentGroupCodigo] = useState(() =>
    preferredMotherCodigo(mothers, createTypes[0] ?? 'incomeCategory'),
  );
  const [nombre, setNombre] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savingPolicyId, setSavingPolicyId] = useState<string | null>(null);
  const activationByGlobal = new Map(
    activations.map((activation) => [activation.globalId, activation]),
  );
  const protectedGlobals = chart.filter(
    (node) => node.esPostable && isProtectedCode(node.codigo),
  );

  useEffect(() => {
    const nextMothers = mothersForAccountType(chart, tipoCuenta);
    setParentGroupCodigo((current) =>
      nextMothers.some((m) => m.codigo === current)
        ? current
        : preferredMotherCodigo(nextMothers, tipoCuenta),
    );
  }, [chart, tipoCuenta]);

  async function togglePolicy(
    id: string,
    enforce: boolean,
    handler?: (id: string, enforce: boolean) => Promise<void>,
  ) {
    if (!handler) return;
    setError('');
    setSavingPolicyId(id);
    try {
      await handler(id, enforce);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo actualizar la política de saldo',
      );
    } finally {
      setSavingPolicyId(null);
    }
  }

  async function handleCreate() {
    const name = nombre.trim();
    if (!name || !parentGroupCodigo) return;
    setError('');
    setSaving(true);
    try {
      await onCreateAccount({
        tipoCuenta,
        nombre: name,
        parentGroupCodigo,
      });
      setNombre('');
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'No se pudo crear la cuenta';
      setError(friendlyAccountCreateError(raw));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-lg">
      {error && <ValidationMessage tone="error">{error}</ValidationMessage>}

      <div className="space-y-md">
        {tree.map((group) => (
          <GroupSection
            key={group.id}
            group={group}
            depth={0}
            currency={currency}
            savingPolicyId={savingPolicyId}
            onToggleAccountBalancePolicy={(id, enforce) =>
              togglePolicy(id, enforce, onToggleAccountBalancePolicy)
            }
          />
        ))}
        {tree.every(
          (g) => g.accounts.length === 0 && g.children.every((c) => c.accounts.length === 0),
        ) && (
          <p className="text-body-md text-on-surface-variant">
            Todavía no hay cuentas en el árbol. Creá una bajo una cuenta madre permitida.
          </p>
        )}
      </div>

      {onToggleGlobalBalancePolicy && protectedGlobals.length > 0 && (
        <section className="p-md rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-sm">
          <div>
            <h2 className="text-label-md font-semibold text-on-surface">
              Control de saldo en cuentas globales
            </h2>
            <p className="text-label-sm text-on-surface-variant">
              La protección está activa por defecto. Desactivala solo para corregir
              desfases contables conscientes.
            </p>
          </div>
          <ul className="space-y-xs">
            {protectedGlobals.map((node) => {
              const activation = activationByGlobal.get(node.id);
              const enforce =
                activation?.enforceNonNegativeBalance ?? true;
              return (
                <li
                  key={node.id}
                  className="flex items-center justify-between gap-md py-xs"
                >
                  <span className="text-body-sm">
                    <span className="font-mono text-label-sm mr-xs">{node.codigo}</span>
                    {node.nombre}
                  </span>
                  <label className="flex items-center gap-xs text-label-sm text-on-surface-variant">
                    <input
                      type="checkbox"
                      checked={enforce}
                      disabled={savingPolicyId === node.id}
                      onChange={(event) =>
                        void togglePolicy(
                          node.id,
                          event.target.checked,
                          onToggleGlobalBalancePolicy,
                        )
                      }
                    />
                    Impedir negativo
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="p-md rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-sm">
        <p className="text-label-md font-semibold text-on-surface">Nueva cuenta bajo madre</p>
        <p className="text-label-sm text-on-surface-variant">
          Para apuntes de ingreso o egreso elegí tipo <strong>Ingreso</strong> o{' '}
          <strong>Gasto</strong>. Billetera/Puente son activos. Bancos y tarjetas se crean en
          Entidades.
        </p>

        <label className="text-label-md text-on-surface-variant block" htmlFor="acc-tipo-pro">
          Tipo de cuenta
        </label>
        <select
          id="acc-tipo-pro"
          value={tipoCuenta}
          onChange={(e) => setTipoCuenta(e.target.value as TipoCuentaManualCreate)}
          className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface text-body-md"
        >
          {createTypes.map((tipo) => (
            <option key={tipo} value={tipo}>
              {TIPO_LABEL[tipo] ?? tipo}
            </option>
          ))}
        </select>

        <label className="text-label-md text-on-surface-variant block" htmlFor="acc-mother">
          Cuenta madre
        </label>
        <select
          id="acc-mother"
          value={parentGroupCodigo}
          onChange={(e) => setParentGroupCodigo(e.target.value)}
          className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface text-body-md"
          disabled={mothers.length === 0}
        >
          {mothers.length === 0 ? (
            <option value="">No hay madres para este tipo</option>
          ) : (
            mothers.map((m) => (
              <option key={m.id} value={m.codigo}>
                {m.codigo} · {m.nombre}
              </option>
            ))
          )}
        </select>

        <TextInput
          label="Nombre"
          id="acc-nombre-pro"
          name="acc-nombre-pro"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Papelería · Sueldo · Ventas"
          autoComplete="off"
        />

        <Button
          fullWidth
          className="rounded-xl"
          disabled={saving || !nombre.trim() || !parentGroupCodigo}
          onClick={() => void handleCreate()}
        >
          {saving ? 'Creando…' : 'Crear cuenta'}
        </Button>
      </div>
    </div>
  );
}