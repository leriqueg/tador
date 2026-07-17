import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../ui/Icon.tsx';

export interface SearchablePlantilla {
  code: string;
  name: string;
  /** Category label for chip→search matching, e.g. "Compras" */
  categoryLabel?: string;
  kind?: string;
}

export interface TemplateSearchProps {
  plantillas: SearchablePlantilla[];
  onSelect: (code: string) => void;
  /** Controlled visibility of the search field */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Controlled query (e.g. filled from a category chip) */
  query?: string;
  onQueryChange?: (query: string) => void;
  /** Current kind filter when matching category labels */
  kindFilter?: string;
}

/** Collapsible typeahead — open via Buscar chip; category chips can seed the query. */
export default function TemplateSearch({
  plantillas,
  onSelect,
  open: openProp,
  onOpenChange,
  query: queryProp,
  onQueryChange,
  kindFilter,
}: TemplateSearchProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [uncontrolledQuery, setUncontrolledQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const open = openProp ?? uncontrolledOpen;
  const query = queryProp ?? uncontrolledQuery;

  function setOpen(next: boolean) {
    onOpenChange?.(next);
    if (openProp === undefined) setUncontrolledOpen(next);
  }

  function setQuery(next: string) {
    onQueryChange?.(next);
    if (queryProp === undefined) setUncontrolledQuery(next);
  }

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];

    const byCategory = plantillas.filter((p) => {
      if (!p.categoryLabel) return false;
      if (p.categoryLabel.toLowerCase() !== q) return false;
      if (kindFilter && p.kind && p.kind !== kindFilter) return false;
      return true;
    });
    if (byCategory.length > 0) return byCategory.slice(0, 8);

    return plantillas
      .filter((p) => {
        if (kindFilter && p.kind && p.kind !== kindFilter) return false;
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().replaceAll('_', ' ').includes(q) ||
          (p.categoryLabel?.toLowerCase().includes(q) ?? false)
        );
      })
      .slice(0, 8);
  }, [plantillas, query, kindFilter]);

  if (!open) return null;

  return (
    <div className="mb-lg">
      <div className="flex items-center justify-between gap-md mb-xs">
        <label htmlFor="plantilla-search" className="text-label-md text-on-surface-variant">
          Buscar plantilla
        </label>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setQuery('');
          }}
          className="text-label-sm text-secondary cursor-pointer"
        >
          Ocultar
        </button>
      </div>
      <div className="relative">
        <Icon
          name="search"
          className="absolute left-md top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none"
        />
        <input
          ref={inputRef}
          id="plantilla-search"
          type="search"
          name="plantilla-search"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej. supermercado, sueldo, Compras…"
          className="w-full h-12 pl-12 pr-md rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md"
        />
      </div>
      {query.trim().length > 0 && matches.length === 0 && (
        <p className="mt-sm text-label-md text-on-surface-variant">
          No hay coincidencias. Probá otro término.
        </p>
      )}
      {matches.length > 0 && (
        <ul className="mt-sm rounded-lg border border-outline-variant/40 bg-surface-container-lowest overflow-hidden">
          {matches.map((p) => (
            <li key={p.code}>
              <button
                type="button"
                className="w-full text-left px-md py-sm text-label-md hover:bg-primary/5 cursor-pointer"
                onClick={() => {
                  onSelect(p.code);
                  setQuery('');
                  setOpen(false);
                }}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
