export interface PositionPanelProps {
  disponible: number;
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

/** Hogar position: Disponible + Deudas only (FR-H-004 — no por cobrar). */
export default function PositionPanel({
  disponible,
  deudas,
  currencyFormat = defaultFormat,
}: PositionPanelProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
      <div className="bg-surface-container-lowest rounded-2xl p-lg ambient-shadow border border-outline-variant/20">
        <p className="text-label-sm text-text-muted uppercase tracking-wider mb-xs">Disponible</p>
        <p className="text-headline-lg text-primary font-bold">{currencyFormat(disponible)}</p>
        <p className="text-label-md text-on-surface-variant mt-xs">Efectivo y cuentas líquidas</p>
      </div>
      <div className="bg-surface-container-lowest rounded-2xl p-lg ambient-shadow border border-outline-variant/20">
        <p className="text-label-sm text-text-muted uppercase tracking-wider mb-xs">Deudas</p>
        <p className="text-headline-lg text-expense-rose font-bold">{currencyFormat(deudas)}</p>
        <p className="text-label-md text-on-surface-variant mt-xs">Lo que tenés por pagar</p>
      </div>
    </div>
  );
}
