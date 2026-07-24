import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import FrequentTemplatesGrid from '../components/entries/FrequentTemplatesGrid.tsx';
import KindCategoryNav from '../components/entries/KindCategoryNav.tsx';
import TemplateSearch from '../components/entries/TemplateSearch.tsx';
import ApunteMiniForm from '../components/entries/ApunteMiniForm.tsx';
import ApunteSuccessPanel from '../components/entries/ApunteSuccessPanel.tsx';
import type { PlantillaDetail } from '../lib/api.ts';
import type { PlantillaCategory, PlantillaKind } from '../lib/plantilla-meta.ts';

const meta = {
  title: 'Hogar/QuickAdd',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

const SAMPLE_DETAIL: PlantillaDetail = {
  code: 'pagar_supermercado',
  version: 1,
  name: 'Supermercado',
  modes: ['hogar'],
  amountMode: 'single',
  descriptionTemplate: 'Supermercado',
  lines: [
    {
      id: 1,
      side: 'debit',
      label: 'Categoría de gasto',
      strategy: 'pick_from_group',
      availableAccounts: [
        { id: 'acc-exp', codigo: '6101', nombre: 'Compras', tipo: 'usuario' },
        { id: 'acc-exp-2', codigo: '6102', nombre: 'Comida', tipo: 'usuario' },
      ],
    },
    {
      id: 2,
      side: 'credit',
      label: 'Desde',
      strategy: 'pick_from_group',
      availableAccounts: [
        { id: 'acc-wallet', codigo: '1111', nombre: 'Efectivo', tipo: 'usuario' },
        { id: 'acc-bank', codigo: '1112', nombre: 'Banco', tipo: 'usuario' },
      ],
    },
  ],
};

export const FrequentTiles: StoryObj = {
  render: () => (
    <div className="max-w-lg">
      <FrequentTemplatesGrid
        tiles={[
          { code: 'pagar_supermercado', name: 'Supermercado' },
          { code: 'pagar_servicios', name: 'Servicios' },
          { code: 'registrar_sueldo', name: 'Sueldo' },
          { code: 'transferencia', name: 'Transferencia' },
        ]}
        onSelect={(code) => console.log('select', code)}
      />
    </div>
  ),
};

function KindNavDemo() {
  const [kind, setKind] = useState<PlantillaKind>('gasto');
  const [category, setCategory] = useState<PlantillaCategory | null>('compras');
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <div className="max-w-lg">
      <KindCategoryNav
        kind={kind}
        category={category}
        searchOpen={searchOpen}
        onKindChange={setKind}
        onCategoryChange={setCategory}
        onSearchToggle={() => setSearchOpen((o) => !o)}
      />
      <TemplateSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        plantillas={[
          { code: 'pagar_supermercado', name: 'Supermercado', categoryLabel: 'Compras', kind: 'gasto' },
          { code: 'pagar_servicios', name: 'Servicios', categoryLabel: 'Hogar', kind: 'gasto' },
          { code: 'registrar_sueldo', name: 'Sueldo', categoryLabel: 'Trabajo', kind: 'ingreso' },
        ]}
        onSelect={(code) => console.log('search', code)}
        kindFilter={kind}
      />
    </div>
  );
}

export const KindAndSearch: StoryObj = {
  name: 'Kind chips + TemplateSearch',
  render: () => <KindNavDemo />,
};

export const MiniForm: StoryObj = {
  render: () => (
    <div className="max-w-lg">
      <ApunteMiniForm
        plantilla={SAMPLE_DETAIL}
        onSubmit={(v) => console.log('submit', v)}
        onCancel={() => console.log('cancel')}
      />
    </div>
  ),
};

export const SuccessPanel: StoryObj = {
  render: () => (
    <div className="max-w-lg">
      <ApunteSuccessPanel
        plantillaName="Supermercado"
        onContinueSame={() => console.log('same')}
        onChooseOther={() => console.log('other')}
      />
    </div>
  ),
};

export const CaptureStack: StoryObj = {
  name: 'Full QuickAdd stack (mobile width)',
  render: () => (
    <div className="max-w-lg space-y-md">
      <FrequentTemplatesGrid
        tiles={[
          { code: 'pagar_supermercado', name: 'Supermercado' },
          { code: 'registrar_sueldo', name: 'Sueldo' },
        ]}
        onSelect={() => {}}
      />
      <KindNavDemo />
      <ApunteMiniForm plantilla={SAMPLE_DETAIL} onSubmit={() => {}} />
    </div>
  ),
};
