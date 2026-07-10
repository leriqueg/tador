import { useState } from 'react';
import Button from '../ui/Button.tsx';
import Icon from '../ui/Icon.tsx';

export type OnboardingStep = 1 | 2 | 3;

export interface OnboardingWizardProps {
  initialStep?: OnboardingStep;
  /** MVP: only hogar is selectable; pro shown as coming soon when true */
  showProComingSoon?: boolean;
  tipMessage?: string;
  onComplete: (result: { mode: 'hogar'; currency?: string }) => void;
}

const DEFAULT_TIP =
  'Vamos a preparar tu libro juntos. Empezá simple: elegí cómo querés usar TADOR.';

/** Multi-step first-run wizard. No Pacho — tip callout only. */
export default function OnboardingWizard({
  initialStep = 1,
  showProComingSoon = true,
  tipMessage = DEFAULT_TIP,
  onComplete,
}: OnboardingWizardProps) {
  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [mode, setMode] = useState<'hogar' | null>(null);
  const [currency, setCurrency] = useState('USD');

  function continueFromStep1() {
    if (!mode) return;
    setStep(2);
  }

  function continueFromStep2() {
    setStep(3);
  }

  function finish() {
    if (!mode) return;
    onComplete({ mode, currency });
  }

  return (
    <div className="flex flex-col max-w-lg mx-auto w-full px-md pb-xl pt-lg min-h-[70vh]">
      <div className="w-full flex gap-xs mb-xl justify-center items-center">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-primary' : 'bg-surface-container-highest'}`}
          />
        ))}
      </div>

      <section className="mb-xl rounded-xl p-md border border-primary/10 bg-primary/5">
        <p className="text-label-sm text-primary font-semibold mb-xs">Consejo</p>
        <p className="text-body-md text-on-surface-variant">{tipMessage}</p>
      </section>

      {step === 1 && (
        <>
          <section className="mb-lg">
            <h1 className="text-headline-lg-mobile text-on-surface mb-xs font-bold">Elige tu estilo</h1>
            <p className="text-body-md text-on-surface-variant">
              ¿Cómo planeas usar TADOR? Puedes cambiar esto más tarde.
            </p>
          </section>
          <section className="grid grid-cols-1 gap-md mb-xl">
            <button
              type="button"
              onClick={() => setMode('hogar')}
              className={`text-left p-md bg-surface-container-lowest rounded-xl border-2 transition-all shadow-sm ${
                mode === 'hogar' ? 'border-primary shadow-md' : 'border-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-sm">
                <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-lg flex items-center justify-center">
                  <Icon name="home" className="text-2xl" />
                </div>
              </div>
              <h3 className="text-headline-md text-on-surface mb-base font-semibold">Modo Hogar</h3>
              <p className="text-label-md text-on-surface-variant">
                Simple, limpio y diseñado para el uso diario. Ideal para gestionar gastos familiares sin
                complicaciones.
              </p>
            </button>
            {showProComingSoon && (
              <div className="text-left p-md bg-surface-container-low rounded-xl border border-outline-variant/40 opacity-70">
                <h3 className="text-headline-md text-on-surface mb-base font-semibold">Modo PRO</h3>
                <p className="text-label-md text-on-surface-variant">
                  Reportes avanzados y control técnico. Próximamente.
                </p>
              </div>
            )}
          </section>
          <Button fullWidth size="lg" className="rounded-xl" disabled={!mode} onClick={continueFromStep1} iconRight="arrow_forward">
            Continuar
          </Button>
          <p className="text-center mt-sm text-label-sm text-outline">Paso 1 de 3</p>
        </>
      )}

      {step === 2 && (
        <>
          <section className="mb-lg">
            <h1 className="text-headline-lg-mobile text-on-surface mb-xs font-bold">Moneda del libro</h1>
            <p className="text-body-md text-on-surface-variant">
              Elegí la moneda principal. Después de registrar movimientos, no se podrá cambiar.
            </p>
          </section>
          <label className="text-label-md text-on-surface-variant mb-xs block" htmlFor="currency">
            Moneda
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full h-12 px-md mb-xl rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md"
          >
            <option value="USD">USD — Dólar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="ARS">ARS — Peso argentino</option>
            <option value="MXN">MXN — Peso mexicano</option>
            <option value="COP">COP — Peso colombiano</option>
            <option value="CLP">CLP — Peso chileno</option>
          </select>
          <div className="flex gap-md">
            <Button variant="outline" fullWidth size="lg" className="rounded-xl" onClick={() => setStep(1)}>
              Atrás
            </Button>
            <Button fullWidth size="lg" className="rounded-xl" onClick={continueFromStep2} iconRight="arrow_forward">
              Continuar
            </Button>
          </div>
          <p className="text-center mt-sm text-label-sm text-outline">Paso 2 de 3</p>
        </>
      )}

      {step === 3 && (
        <>
          <section className="mb-lg">
            <h1 className="text-headline-lg-mobile text-on-surface mb-xs font-bold">Listo para empezar</h1>
            <p className="text-body-md text-on-surface-variant">
              Después vas a poder crear cuentas (efectivo, banco, billetera) sin ver códigos contables.
            </p>
          </section>
          <div className="mb-xl p-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-xs">
            <p className="text-label-md text-on-surface-variant">
              Modo: <span className="font-semibold text-primary">Hogar</span>
            </p>
            <p className="text-label-md text-on-surface-variant">
              Moneda: <span className="font-semibold text-primary">{currency}</span>
            </p>
          </div>
          <div className="flex gap-md">
            <Button variant="outline" fullWidth size="lg" className="rounded-xl" onClick={() => setStep(2)}>
              Atrás
            </Button>
            <Button fullWidth size="lg" className="rounded-xl" onClick={finish}>
              Empezar
            </Button>
          </div>
          <p className="text-center mt-sm text-label-sm text-outline">Paso 3 de 3</p>
        </>
      )}
    </div>
  );
}
