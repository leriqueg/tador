import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.tsx';
import FrequentTemplatesGrid from '../components/entries/FrequentTemplatesGrid.tsx';
import KindCategoryNav from '../components/entries/KindCategoryNav.tsx';
import TemplateSearch from '../components/entries/TemplateSearch.tsx';
import ApunteMiniForm, {
  type ApunteMiniFormValues,
} from '../components/entries/ApunteMiniForm.tsx';
import { ApunteConfirm } from '../components/entries/ApunteForm.tsx';
import RecentEntriesList from '../components/entries/RecentEntriesList.tsx';
import ValidationMessage from '../components/ui/ValidationMessage.tsx';
import { apuntes, plantillas, type PlantillaView, type PlantillaDetail, type ApunteSummary } from '../lib/api.ts';
import { useAuth } from '../lib/auth.tsx';
import { useBookGate } from '../lib/use-book-gate.ts';
import {
  CURATED_FREQUENT_CODES,
  bumpPlantillaUsage,
  categoriesForKind,
  plantillaCategory,
  plantillaKind,
  readPlantillaUsage,
  type PlantillaCategory,
  type PlantillaKind,
} from '../lib/plantilla-meta.ts';

/** Hogar QuickAdd — template-driven capture (US2). */
export default function Entries() {
  const { user, loading: authLoading, logout } = useAuth();
  const gate = useBookGate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [catalog, setCatalog] = useState<PlantillaView[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<PlantillaDetail | null>(null);
  const [recent, setRecent] = useState<ApunteSummary[]>([]);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [kind, setKind] = useState<PlantillaKind>('gasto');
  const [category, setCategory] = useState<PlantillaCategory | null>('compras');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const refreshRecent = useCallback(async () => {
    const res = await apuntes.list({ limit: 10 });
    setRecent(res.apuntes);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingCatalog(true);
      setLoadError('');
      try {
        const [plist] = await Promise.all([plantillas.list('hogar'), refreshRecent()]);
        if (cancelled) return;
        setCatalog(plist.plantillas);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar las plantillas');
        }
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshRecent]);

  // Deep link ?plantilla=
  useEffect(() => {
    const code = searchParams.get('plantilla');
    if (code && catalog.some((p) => p.code === code)) {
      setSelectedCode(code);
      setKind(plantillaKind(code));
      setCategory(plantillaCategory(code));
    }
  }, [searchParams, catalog]);

  const frequentTiles = useMemo(() => {
    const usage = readPlantillaUsage();
    const byCode = new Map(catalog.map((p) => [p.code, p]));
    const ranked = [...catalog]
      .sort((a, b) => (usage[b.code] ?? 0) - (usage[a.code] ?? 0))
      .filter((p) => (usage[p.code] ?? 0) > 0)
      .slice(0, 6);
    if (ranked.length >= 4) {
      return ranked.map((p) => ({ code: p.code, name: p.name }));
    }
    return CURATED_FREQUENT_CODES.map((code) => byCode.get(code))
      .filter((p): p is PlantillaView => Boolean(p))
      .slice(0, 6)
      .map((p) => ({ code: p.code, name: p.name }));
  }, [catalog]);

  const filteredByCategory = useMemo(() => {
    if (!category) return [];
    return catalog
      .filter((p) => plantillaKind(p.code) === kind && plantillaCategory(p.code) === category)
      .slice(0, 3);
  }, [catalog, kind, category]);

  // Enrich only when a plantilla is selected (fast list → detail)
  useEffect(() => {
    if (!selectedCode) {
      setSelectedDetail(null);
      return;
    }
    let cancelled = false;
    async function loadDetail() {
      setLoadingDetail(true);
      setSubmitError('');
      try {
        const res = await plantillas.get(selectedCode!);
        if (!cancelled) setSelectedDetail(res.plantilla);
      } catch (err) {
        if (!cancelled) {
          setSelectedDetail(null);
          setSubmitError(
            err instanceof Error ? err.message : 'No se pudo cargar la plantilla',
          );
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    }
    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedCode]);

  function selectPlantilla(code: string) {
    setSelectedCode(code);
    setSubmitError('');
    setConfirmOpen(false);
    setSearchParams({ plantilla: code }, { replace: true });
  }

  function clearPlantilla() {
    setSelectedCode(null);
    setSelectedDetail(null);
    setSearchParams({}, { replace: true });
  }

  async function handleSubmit(values: ApunteMiniFormValues, opts: { burst: boolean }) {
    setSubmitting(true);
    setSubmitError('');
    try {
      await apuntes.create({
        templateCode: values.templateCode,
        date: values.date,
        concept: values.concept,
        amount: values.amount,
        lines: values.lines,
      });
      bumpPlantillaUsage(values.templateCode);
      await refreshRecent();
      setConfirmOpen(true);
      if (!opts.burst) {
        // stay on form; user can change plantilla
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo guardar el apunte');
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || gate.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant">
        Cargando…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (gate.redirectTo) return <Navigate to={gate.redirectTo} replace />;

  return (
    <AppShell activePath="/entries" userLabel={user.email} onLogout={() => void logout()}>
      <div className="max-w-lg mx-auto">
        <header className="mb-lg">
          <h1 className="text-headline-lg text-on-surface font-bold mb-xs">Nuevo apunte</h1>
          <p className="text-body-md text-on-surface-variant">
            Elegí una plantilla y confirmá cuenta, monto y descripción.
          </p>
        </header>

        {confirmOpen && (
          <div className="mb-md" aria-live="polite">
            <ApunteConfirm onDismiss={() => setConfirmOpen(false)} />
          </div>
        )}

        {loadError && (
          <div className="mb-md">
            <ValidationMessage tone="error">{loadError}</ValidationMessage>
          </div>
        )}

        {loadingCatalog ? (
          <p className="text-on-surface-variant">Cargando plantillas…</p>
        ) : selectedCode ? (
          loadingDetail || !selectedDetail ? (
            <p className="text-on-surface-variant">Cargando cuentas de la plantilla…</p>
          ) : (
            <ApunteMiniForm
              plantilla={selectedDetail}
              error={submitError}
              submitting={submitting}
              onSubmit={handleSubmit}
              onCancel={clearPlantilla}
            />
          )
        ) : (
          <>
            <FrequentTemplatesGrid tiles={frequentTiles} onSelect={selectPlantilla} />

            <KindCategoryNav
              kind={kind}
              category={category}
              availableCategories={categoriesForKind(kind).filter((c) =>
                catalog.some(
                  (p) => plantillaKind(p.code) === kind && plantillaCategory(p.code) === c,
                ),
              )}
              onKindChange={(k) => {
                setKind(k);
                const next = categoriesForKind(k).filter((c) =>
                  catalog.some(
                    (p) => plantillaKind(p.code) === k && plantillaCategory(p.code) === c,
                  ),
                );
                setCategory(next[0] ?? null);
              }}
              onCategoryChange={setCategory}
            />

            {filteredByCategory.length > 0 ? (
              <ul className="mb-lg space-y-sm">
                {filteredByCategory.map((p) => (
                  <li key={p.code}>
                    <button
                      type="button"
                      onClick={() => selectPlantilla(p.code)}
                      className="w-full text-left p-md rounded-xl border border-outline-variant/40 bg-surface-container-lowest hover:border-primary/40 cursor-pointer"
                    >
                      <span className="text-label-md font-semibold text-on-surface">{p.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-label-md text-on-surface-variant mb-lg">
                No hay plantillas en esta categoría. Probá buscar.
              </p>
            )}

            <TemplateSearch
              plantillas={catalog.map((p) => ({ code: p.code, name: p.name }))}
              onSelect={selectPlantilla}
            />
          </>
        )}

        <section className="mt-xl">
          <div className="flex items-center justify-between mb-sm">
            <h2 className="text-headline-md font-semibold text-on-surface">Recientes</h2>
            <Link to="/entries" className="text-label-sm text-secondary no-underline">
              Actualizar
            </Link>
          </div>
          <RecentEntriesList items={recent} />
        </section>
      </div>
    </AppShell>
  );
}
