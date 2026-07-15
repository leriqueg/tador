import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.tsx';
import FrequentTemplatesGrid from '../components/entries/FrequentTemplatesGrid.tsx';
import KindCategoryNav from '../components/entries/KindCategoryNav.tsx';
import TemplateSearch from '../components/entries/TemplateSearch.tsx';
import ApunteMiniForm, {
  type ApunteMiniFormInitialValues,
  type ApunteMiniFormValues,
} from '../components/entries/ApunteMiniForm.tsx';
import ApunteSuccessPanel from '../components/entries/ApunteSuccessPanel.tsx';
import RecentEntriesList from '../components/entries/RecentEntriesList.tsx';
import ValidationMessage from '../components/ui/ValidationMessage.tsx';
import { apuntes, plantillas, type PlantillaView, type PlantillaDetail, type ApunteSummary } from '../lib/api.ts';
import { useAuth } from '../lib/auth.tsx';
import { useBookGate } from '../lib/use-book-gate.ts';
import {
  CATEGORY_LABELS,
  CURATED_FREQUENT_CODES,
  bumpPlantillaUsage,
  categoriesForKind,
  plantillaCategory,
  plantillaKind,
  readPlantillaUsage,
  type PlantillaCategory,
  type PlantillaKind,
} from '../lib/plantilla-meta.ts';

type CapturePhase = 'form' | 'success';

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
  const [capturePhase, setCapturePhase] = useState<CapturePhase>('form');
  const [formSession, setFormSession] = useState(0);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [kind, setKind] = useState<PlantillaKind>('gasto');
  const [category, setCategory] = useState<PlantillaCategory | null>('compras');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [editingApunteId, setEditingApunteId] = useState<string | null>(null);
  const [editInitial, setEditInitial] = useState<ApunteMiniFormInitialValues | null>(null);
  const [successMode, setSuccessMode] = useState<'create' | 'edit'>('create');
  const [loadingEdit, setLoadingEdit] = useState(false);

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
      setCapturePhase('form');
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

  const searchable = useMemo(
    () =>
      catalog.map((p) => ({
        code: p.code,
        name: p.name,
        kind: plantillaKind(p.code),
        categoryLabel: CATEGORY_LABELS[plantillaCategory(p.code)],
      })),
    [catalog],
  );

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
    setCapturePhase('form');
    setSubmitError('');
    setEditingApunteId(null);
    setEditInitial(null);
    setSuccessMode('create');
    setSearchOpen(false);
    setSearchQuery('');
    setSearchParams({ plantilla: code }, { replace: true });
  }

  function clearPlantilla() {
    setSelectedCode(null);
    setSelectedDetail(null);
    setCapturePhase('form');
    setEditingApunteId(null);
    setEditInitial(null);
    setSuccessMode('create');
    setSearchParams({}, { replace: true });
  }

  function continueSamePlantilla() {
    setCapturePhase('form');
    setSubmitError('');
    setEditingApunteId(null);
    setEditInitial(null);
    setSuccessMode('create');
    setFormSession((n) => n + 1);
  }

  async function beginEdit(item: ApunteSummary) {
    if (!item.templateCode) return;
    setLoadingEdit(true);
    setSubmitError('');
    try {
      const { apunte } = await apuntes.get(item.id);
      const accountByLine = Object.fromEntries(
        apunte.lines.map((line) => [line.id, line.accountId]),
      ) as Record<number, string>;
      setEditingApunteId(apunte.id);
      setEditInitial({
        amount: String(apunte.amount),
        date: apunte.date,
        concept: apunte.concept,
        accountByLine,
      });
      setSuccessMode('create');
      setSelectedCode(apunte.templateCode);
      setCapturePhase('form');
      setSearchParams({ plantilla: apunte.templateCode! }, { replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo cargar el apunte');
    } finally {
      setLoadingEdit(false);
    }
  }

  async function handleSubmit(values: ApunteMiniFormValues) {
    setSubmitting(true);
    setSubmitError('');
    try {
      if (editingApunteId) {
        await apuntes.update(editingApunteId, {
          templateCode: values.templateCode,
          date: values.date,
          concept: values.concept,
          amount: values.amount,
          lines: values.lines,
        });
        setSuccessMode('edit');
        setEditingApunteId(null);
        setEditInitial(null);
      } else {
        await apuntes.create({
          templateCode: values.templateCode,
          date: values.date,
          concept: values.concept,
          amount: values.amount,
          lines: values.lines,
        });
        bumpPlantillaUsage(values.templateCode);
        setSuccessMode('create');
      }
      await refreshRecent();
      setCapturePhase('success');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'No se pudo guardar el apunte',
      );
      setCapturePhase('form');
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
          <h1 className="text-headline-lg text-on-surface font-bold mb-xs">
            {editingApunteId ? 'Editar apunte' : 'Nuevo apunte'}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {editingApunteId
              ? 'Corregí cuenta, monto, fecha o descripción.'
              : 'Elegí una plantilla y confirmá cuenta, monto y descripción.'}
          </p>
        </header>

        {submitError && !selectedCode && (
          <div className="mb-md">
            <ValidationMessage tone="error">{submitError}</ValidationMessage>
          </div>
        )}

        {loadingEdit && (
          <p className="text-on-surface-variant mb-md">Cargando apunte…</p>
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
          ) : capturePhase === 'success' ? (
            <ApunteSuccessPanel
              plantillaName={selectedDetail.name}
              title={successMode === 'edit' ? 'Apunte actualizado' : 'Apunte guardado'}
              message={
                successMode === 'edit'
                  ? `Los cambios quedaron guardados en ${selectedDetail.name}.`
                  : undefined
              }
              continueLabel={
                successMode === 'edit' ? 'Listo' : 'Otro con esta plantilla'
              }
              chooseOtherLabel="Elegir otra plantilla"
              onContinueSame={
                successMode === 'edit' ? clearPlantilla : continueSamePlantilla
              }
              onChooseOther={clearPlantilla}
            />
          ) : (
            <ApunteMiniForm
              key={`${selectedDetail.code}-${formSession}-${editingApunteId ?? 'new'}`}
              plantilla={selectedDetail}
              mode={editingApunteId ? 'edit' : 'create'}
              error={submitError}
              submitting={submitting}
              initialValues={editInitial ?? undefined}
              submitLabel={editingApunteId ? 'Guardar cambios' : 'Guardar'}
              cancelLabel={editingApunteId ? 'Cancelar edición' : 'Cambiar plantilla'}
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
              searchOpen={searchOpen}
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
                const nextCat = next[0] ?? null;
                setCategory(nextCat);
                if (nextCat) {
                  setSearchQuery(CATEGORY_LABELS[nextCat]);
                  setSearchOpen(true);
                } else {
                  setSearchQuery('');
                  setSearchOpen(false);
                }
              }}
              onCategoryChange={(c) => {
                setCategory(c);
                setSearchQuery(CATEGORY_LABELS[c]);
                setSearchOpen(true);
              }}
              onSearchToggle={() => {
                setSearchOpen((prev) => {
                  const next = !prev;
                  if (!next) setSearchQuery('');
                  return next;
                });
              }}
            />

            <TemplateSearch
              plantillas={searchable}
              onSelect={selectPlantilla}
              open={searchOpen}
              onOpenChange={setSearchOpen}
              query={searchQuery}
              onQueryChange={setSearchQuery}
              kindFilter={kind}
            />

            {!searchOpen && (
              <p className="text-label-md text-on-surface-variant mb-lg">
                Tocá un chip de categoría o Buscar para ver plantillas.
              </p>
            )}
          </>
        )}

        <section className="mt-xl">
          <div className="flex items-center justify-between mb-sm">
            <h2 className="text-headline-md font-semibold text-on-surface">Recientes</h2>
            <Link to="/entries" className="text-label-sm text-secondary no-underline">
              Actualizar
            </Link>
          </div>
          <RecentEntriesList items={recent} onEdit={(item) => void beginEdit(item)} />
        </section>
      </div>
    </AppShell>
  );
}
