export interface PositionPanelProps {
  disponible: number;
  /** Informal receivables (me deben) — Hogar CxC via Entidad */
  porCobrar: number;
  deudas: number;
  currencyFormat?: (n: number) => string;
}

function defaultFormat(n: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

/** Hogar position: Disponible + Por cobrar + Deudas (FR-H-004 / FR-007). */
export default function PositionPanel({
  disponible,
  porCobrar,
  deudas,
  currencyFormat = defaultFormat,
}: PositionPanelProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
      <div className="bg-surface-container-lowest rounded-2xl p-lg ambient-shadow border border-outline-variant/20">
        <p className="text-label-sm text-text-muted uppercase tracking-wider mb-xs">Disponible</p>
        <p className="text-headline-lg text-primary font-bold">{currencyFormat(disponible)}</p>
        <p className="text-label-md text-on-surface-variant mt-xs">Efectivo y cuentas líquidas</p>
      </div>
      <div className="bg-surface-container-lowest rounded-2xl p-lg ambient-shadow border border-outline-variant/20">
        <p className="text-label-sm text-text-muted uppercase tracking-wider mb-xs">Me deben</p>
        <p className="text-headline-lg text-secondary font-bold">{currencyFormat(porCobrar)}</p>
        <p className="text-label-md text-on-surface-variant mt-xs">Préstamos y saldos por cobrar</p>
      </div>
      <div className="bg-surface-container-lowest rounded-2xl p-lg ambient-shadow border border-outline-variant/20">
        <p className="text-label-sm text-text-muted uppercase tracking-wider mb-xs">Deudas</p>
        <p className="text-headline-lg text-expense-rose font-bold">{currencyFormat(deudas)}</p>
        <p className="text-label-md text-on-surface-variant mt-xs">Lo que tenés por pagar</p>
      </div>
    </div>
  );
}
