import type { Meta, StoryObj } from '@storybook/react-vite';
import RecentEntriesList from '../components/entries/RecentEntriesList.tsx';

const meta = {
  title: 'Shared/Entries',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

const SAMPLE = [
  {
    id: '1',
    concept: 'Supermercado Santa María',
    date: '2026-07-20',
    amount: -48.5,
    templateCode: 'pagar_supermercado',
    createdAt: '2026-07-20T18:00:00Z',
  },
  {
    id: '2',
    concept: 'Sueldo julio',
    date: '2026-07-15',
    amount: 1200,
    templateCode: 'registrar_sueldo',
    createdAt: '2026-07-15T12:00:00Z',
  },
  {
    id: '3',
    concept: 'Transferencia a ahorro',
    date: '2026-07-12',
    amount: -200,
    templateCode: 'transferencia',
    createdAt: '2026-07-12T09:00:00Z',
  },
];

/** Current list — Hogar width. PRO desktop density is still debt. */
export const RecentListHogarWidth: StoryObj = {
  name: 'RecentEntriesList (Hogar / current PRO shared)',
  render: () => (
    <div className="max-w-lg">
      <p className="text-label-sm text-on-surface-variant mb-sm">
        debt:pro-desktop-density — PRO desktop should not stay at max-w-lg.
      </p>
      <RecentEntriesList items={SAMPLE} onEdit={(item) => console.log('edit', item.id)} />
    </div>
  ),
};

export const RecentListEmpty: StoryObj = {
  render: () => (
    <div className="max-w-lg">
      <RecentEntriesList items={[]} />
    </div>
  ),
};

export const RecentListProDesktopPlaceholder: StoryObj = {
  name: 'PRO desktop target (placeholder width)',
  render: () => (
    <div className="max-w-5xl">
      <p className="text-label-sm text-on-surface-variant mb-sm">
        Target canvas for denser PRO historial (filters + more columns). List component still
        Hogar-shaped — implement density in a later polish pass.
      </p>
      <RecentEntriesList items={SAMPLE} onEdit={() => {}} />
    </div>
  ),
  parameters: { layout: 'padded' },
};
