import type { Meta, StoryObj } from '@storybook/react-vite';
import CostYieldPanel from '../components/analysis/CostYieldPanel.tsx';
import BankMissingEntityBanner from '../components/analysis/BankMissingEntityBanner.tsx';

const meta = {
  title: 'PRO/Analysis',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

export const CostAndYield: StoryObj = {
  render: () => (
    <div className="max-w-3xl">
      <CostYieldPanel
        currency="USD"
        totals={{
          year: 2026,
          entityId: 'ent-bank-1',
          costs: { comisiones: 42.5, intereses: 18, multas: 0 },
          investmentYield: 12.75,
        }}
      />
    </div>
  ),
};

export const MissingBankEntity: StoryObj = {
  render: () => (
    <div className="max-w-lg">
      <BankMissingEntityBanner bankName="Banco Guayaquil" entitiesPath="/pro/entities" />
    </div>
  ),
};

export const AnalysisDesktopCanvas: StoryObj = {
  name: 'Desktop canvas (reports primary surface)',
  render: () => (
    <div className="max-w-5xl space-y-lg">
      <p className="text-body-md text-on-surface-variant">
        PRO analysis is consumed primarily on desktop; mobile stays usable.
      </p>
      <CostYieldPanel
        currency="USD"
        totals={{
          year: 2026,
          entityId: 'ent-1',
          costs: { comisiones: 120, intereses: 55.2, multas: 15 },
          investmentYield: 40,
        }}
      />
      <BankMissingEntityBanner bankName="Cuenta sin entidad" entitiesPath="/pro/entities" />
    </div>
  ),
};
