import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import OnboardingWizard, {
  type OnboardingResult,
} from '../components/onboarding/OnboardingWizard.tsx';
import { MinimalHeader } from '../components/layout/MarketingHeader.tsx';
import { AuthFooter } from '../components/layout/AppFooter.tsx';
import { book, entities } from '../lib/api';
import { useAuth } from '../lib/auth.tsx';

/** First-run book setup — banks/cards/wallets via entity provision (FR-003a–c, FR-010). */
export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant">
        Cargando…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  async function handleComplete(result: OnboardingResult) {
    setError('');
    setSubmitting(true);
    try {
      await book.updateConfig({
        mode: result.mode,
        currency: result.currency,
        timeZone: result.timeZone,
        completeOnboarding: true,
      });

      for (const bank of result.banks) {
        await entities.create({
          nombre: bank.nombre,
          tipo: 'bank',
        });
      }

      for (const wallet of result.wallets) {
        await entities.create({
          nombre: wallet.nombre,
          tipo: 'wallet_platform',
        });
      }

      for (const card of result.cards) {
        const cutoffDay = Number.parseInt(card.cutoffDay, 10);
        await entities.create({
          nombre: card.lastFour ? `${card.nombre} ····${card.lastFour}` : card.nombre,
          tipo: 'card_issuer',
          notas:
            Number.isInteger(cutoffDay) && cutoffDay >= 1 && cutoffDay <= 31
              ? `Día de corte: ${cutoffDay}`
              : undefined,
          metadata: {
            network: card.network,
            ...(card.lastFour ? { lastFour: card.lastFour } : {}),
            ...(Number.isInteger(cutoffDay) && cutoffDay >= 1 && cutoffDay <= 31
              ? { cutoffDay }
              : {}),
          },
        });
      }

      for (const employer of result.employers) {
        await entities.create({
          nombre: employer.nombre,
          tipo: 'organization',
          capabilities: ['is_employment_dependency'],
        });
      }

      navigate(`/${result.mode}/dashboard`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la configuración');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface font-sans text-on-surface warm-gradient">
      <MinimalHeader />
      <main className="flex-grow">
        {error && (
          <div className="max-w-lg mx-auto px-md pt-md">
            <div className="bg-error-container text-on-error-container p-md rounded-lg text-body-md">
              {error}
            </div>
          </div>
        )}
        <OnboardingWizard submitting={submitting} onComplete={handleComplete} />
      </main>
      <AuthFooter />
    </div>
  );
}
