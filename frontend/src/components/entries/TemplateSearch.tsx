import { useMemo, useState } from 'react';

export interface SearchablePlantilla {
  code: string;
  name: string;
}

export interface TemplateSearchProps {
  plantillas: SearchablePlantilla[];
  onSelect: (code: string) => void;
}

/** Typeahead escape hatch for long-tail plantillas. */
export default function TemplateSearch({ plantillas, onSelect }: TemplateSearchProps) {
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return plantillas
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().replaceAll('_', ' ').includes(q),
      )
      .slice(0, 6);
  }, [plantillas, query]);

  return (
    <div className="mb-lg">
      <label htmlFor="plantilla-search" className="text-label-md text-on-surface-variant mb-xs block">
        Buscar plantilla
      </label>
      <input
        id="plantilla-search"
        type="search"
        name="plantilla-search"
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ej. supermercado, sueldo, taxi…"
        className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md"
      />
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
