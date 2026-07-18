import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import ValidationMessage from '../components/ui/ValidationMessage.tsx';
import AppShell from '../components/layout/AppShell.tsx';
import OnboardingWizard from '../components/onboarding/OnboardingWizard.tsx';
import PygPanelHogar from '../components/dashboard/PygPanelHogar.tsx';
import PositionPanel from '../components/dashboard/PositionPanel.tsx';
import ApunteForm, { ApunteConfirm } from '../components/entries/ApunteForm.tsx';

const meta = {
  title: 'Hogar/P0 Foundations',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

export const ValidationMessages: StoryObj = {
  render: () => (
    <div className="space-y-md max-w-md">
      <ValidationMessage tone="error" title="No se pudo guardar">
        Revisá el monto e intentá de nuevo.
      </ValidationMessage>
      <ValidationMessage tone="success" title="Listo">
        Apunte guardado.
      </ValidationMessage>
      <ValidationMessage tone="info">Elegí una categoría para continuar.</ValidationMessage>
    </div>
  ),
};

export const Shell: StoryObj = {
  render: () => (
    <AppShell activePath="/hogar/dashboard" userLabel="diego@tador.app">
      <p className="text-body-md text-on-surface-variant">Contenido del resumen (placeholder).</p>
    </AppShell>
  ),
  parameters: { layout: 'fullscreen' },
};

export const Onboarding: StoryObj = {
  render: () => (
    <div className="bg-surface min-h-screen">
      <OnboardingWizard onComplete={(r) => console.log(r)} />
    </div>
  ),
  parameters: { layout: 'fullscreen' },
};

const SAMPLE_SERIES = Array.from({ length: 12 }, (_, i) => ({
  month: i + 1,
  income: 800 + i * 40,
  expenses: 500 + (i % 3) * 80,
  balance: 300,
}));

export const DashboardPanels: StoryObj = {
  render: () => (
    <div className="space-y-lg max-w-2xl">
      <PygPanelHogar
        year={2026}
        totalIncome={12450}
        totalExpenses={8320.5}
        netResult={4129.5}
        monthlySeries={SAMPLE_SERIES}
      />
      <PositionPanel disponible={45200} porCobrar={1200} deudas={2150.3} />
    </div>
  ),
};

function ApunteDemo() {
  const [ok, setOk] = useState(false);
  return (
    <div className="max-w-md space-y-md">
      {ok && <ApunteConfirm onDismiss={() => setOk(false)} />}
      <ApunteForm
        plantillas={[
          { code: 'pagar_supermercado', name: 'Supermercado', kind: 'gasto' },
          { code: 'pagar_servicios', name: 'Servicios', kind: 'gasto' },
          { code: 'registrar_sueldo', name: 'Sueldo', kind: 'ingreso' },
          { code: 'deposito_bancario', name: 'Depósito', kind: 'ingreso' },
        ]}
        onSubmit={() => setOk(true)}
      />
    </div>
  );
}

export const ApunteFlow: StoryObj = {
  render: () => <ApunteDemo />,
};
