import {
  CATEGORY_LABELS,
  categoriesForKind,
  type PlantillaCategory,
  type PlantillaKind,
} from '../../lib/plantilla-meta.ts';
import Icon from '../ui/Icon.tsx';

export interface KindCategoryNavProps {
  kind: PlantillaKind;
  category: PlantillaCategory | null;
  /** When set, only these chips render (hide empty categories). */
  availableCategories?: PlantillaCategory[];
  searchOpen?: boolean;
  onKindChange: (kind: PlantillaKind) => void;
  onCategoryChange: (category: PlantillaCategory) => void;
  onSearchToggle?: () => void;
}

const KINDS: { id: PlantillaKind; label: string }[] = [
  { id: 'gasto', label: 'Gasto' },
  { id: 'ingreso', label: 'Ingreso' },
  { id: 'transferencia', label: 'Transferencia' },
];

/** Kind segment + category chips + Buscar toggle. */
export default function KindCategoryNav({
  kind,
  category,
  availableCategories,
  searchOpen = false,
  onKindChange,
  onCategoryChange,
  onSearchToggle,
}: KindCategoryNavProps) {
  const chips = availableCategories ?? categoriesForKind(kind);

  return (
    <div className="space-y-md mb-lg">
      <div className="flex gap-sm p-1 bg-surface-container rounded-xl" role="tablist" aria-label="Tipo de apunte">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            role="tab"
            aria-selected={kind === k.id}
            onClick={() => onKindChange(k.id)}
            className={`flex-1 py-sm rounded-lg text-label-md font-semibold transition-colors cursor-pointer ${
              kind === k.id ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-sm" aria-label="Categorías">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onCategoryChange(c)}
            className={`px-md py-xs rounded-full text-label-md border transition-colors cursor-pointer ${
              category === c
                ? 'border-primary bg-primary/10 text-primary font-semibold'
                : 'border-outline-variant/50 text-on-surface-variant'
            }`}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
        {onSearchToggle && (
          <button
            type="button"
            onClick={onSearchToggle}
            aria-pressed={searchOpen}
            className={`inline-flex items-center gap-xs px-md py-xs rounded-full text-label-md border transition-colors cursor-pointer ${
              searchOpen
                ? 'border-primary bg-primary/10 text-primary font-semibold'
                : 'border-outline-variant/50 text-on-surface-variant'
            }`}
          >
            <Icon name="search" className="text-base" />
            Buscar
          </button>
        )}
      </div>
    </div>
  );
}
