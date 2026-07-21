import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingWizard, { type OnboardingResult } from './OnboardingWizard.tsx';
import { TestI18nProvider } from '../../i18n/I18nProvider.tsx';
import type { ReactElement } from 'react';

function renderWizard(ui: ReactElement) {
  return render(<TestI18nProvider>{ui}</TestI18nProvider>);
}

/** Walks steps 1-4 (mode, currency/tz, bank/wallet, cards) and lands on step 5. */
async function advanceToStep5(user: ReturnType<typeof userEvent.setup>, modeLabel: 'Modo Hogar' | 'Modo PRO') {
  await user.click(screen.getByRole('button', { name: new RegExp(modeLabel, 'i') }));
  await user.click(screen.getByRole('button', { name: /Continuar/i }));
  await user.click(screen.getByRole('button', { name: /Continuar/i }));
  await user.click(screen.getByRole('button', { name: /Continuar/i }));
  await user.click(screen.getByRole('button', { name: /Continuar/i }));
}

describe('OnboardingWizard — PRO branch (T010-T012)', () => {
  afterEach(() => {
    cleanup();
  });

  it('never shows client/supplier steps while walking the PRO flow (T012)', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    renderWizard(<OnboardingWizard onComplete={onComplete} />);

    await advanceToStep5(user, 'Modo PRO');
    await user.click(screen.getByRole('button', { name: /No, soy freelance/i }));
    await user.click(screen.getByRole('button', { name: /Continuar/i }));

    expect(screen.queryByText(/cliente/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/proveedor/i)).not.toBeInTheDocument();
  });

  it('lets a freelancer finish onboarding without an employer org (T011)', async () => {
    const user = userEvent.setup();
    let result: OnboardingResult | null = null;
    renderWizard(<OnboardingWizard onComplete={(r) => (result = r)} />);

    await advanceToStep5(user, 'Modo PRO');
    await user.click(screen.getByRole('button', { name: /No, soy freelance/i }));
    await user.click(screen.getByRole('button', { name: /Continuar/i }));

    expect(await screen.findByText('Paso 6 de 6')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Empezar/i }));

    expect(result).not.toBeNull();
    expect(result!.mode).toBe('pro');
    expect(result!.employers).toEqual([]);
  });

  it('collects the employer org when the user has an employment dependency (T010)', async () => {
    const user = userEvent.setup();
    let result: OnboardingResult | null = null;
    renderWizard(<OnboardingWizard onComplete={(r) => (result = r)} />);

    await advanceToStep5(user, 'Modo PRO');
    await user.click(screen.getByRole('button', { name: /Sí, tengo empleador/i }));
    await user.type(screen.getByLabelText(/Nombre del empleador/i), 'Acme Corp');
    await user.click(screen.getByRole('button', { name: /Agregar empleador/i }));
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Continuar/i }));
    await user.click(screen.getByRole('button', { name: /Empezar/i }));

    expect(result).not.toBeNull();
    expect(result!.mode).toBe('pro');
    expect(result!.employers).toEqual([{ nombre: 'Acme Corp' }]);
  });

  it('still completes the Hogar flow unaffected by the PRO branch (regression)', async () => {
    const user = userEvent.setup();
    let result: OnboardingResult | null = null;
    renderWizard(<OnboardingWizard onComplete={(r) => (result = r)} />);

    await advanceToStep5(user, 'Modo Hogar');
    expect(await screen.findByText('Paso 5 de 5')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Empezar/i }));

    expect(result).not.toBeNull();
    expect(result!.mode).toBe('hogar');
    expect(result!.employers).toEqual([]);
  });
});
