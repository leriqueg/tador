import Icon from '../ui/Icon.tsx';

export interface FrequentTile {
  code: string;
  name: string;
  icon?: string;
}

export interface FrequentTemplatesGridProps {
  tiles: FrequentTile[];
  onSelect: (code: string) => void;
}

const ICON_BY_CODE: Record<string, string> = {
  pagar_supermercado: 'shopping_cart',
  pagar_servicios: 'home',
  registrar_sueldo: 'payments',
  transferencia: 'swap_horiz',
  deposito_bancario: 'account_balance',
  pagar_taxi: 'directions_car',
  pagar_cita_medica: 'medical_services',
  pagar_cine: 'movie',
  pago_tarjeta: 'credit_card',
  retiro_bancario: 'atm',
};

/** 4–6 frequent plantilla tiles (FR-005a). */
export default function FrequentTemplatesGrid({ tiles, onSelect }: FrequentTemplatesGridProps) {
  if (tiles.length === 0) return null;

  return (
    <section className="mb-lg" aria-label="Plantillas frecuentes">
      <h2 className="text-label-md text-on-surface-variant mb-sm font-semibold">Frecuentes</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm">
        {tiles.slice(0, 6).map((tile) => {
          const icon = tile.icon ?? ICON_BY_CODE[tile.code] ?? 'edit_note';
          return (
            <button
              key={tile.code}
              type="button"
              onClick={() => onSelect(tile.code)}
              className="flex flex-col items-start gap-sm p-md rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-left hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <span className="w-10 h-10 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
                <Icon name={icon} className="text-xl" />
              </span>
              <span className="text-label-md font-semibold text-on-surface">{tile.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
