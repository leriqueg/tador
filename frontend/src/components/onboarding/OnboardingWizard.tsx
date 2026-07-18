import { useEffect, useState } from 'react';
import Button from '../ui/Button.tsx';
import Icon from '../ui/Icon.tsx';
import TextInput from '../ui/TextInput.tsx';
import {
  CURATED_TIME_ZONES,
  detectDefaultTimeZone,
  timeZoneLabel,
} from '../../lib/time-zones.ts';

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

export type OnboardingMode = 'hogar' | 'pro';

export type CardNetwork = 'VISA' | 'MASTERCARD' | 'AMEX' | 'OTRO';

export interface OnboardingWalletDraft {
  nombre: string;
}

export interface OnboardingBankDraft {
  nombre: string;
}

export interface OnboardingCardDraft {
  network: CardNetwork;
  nombre: string;
  lastFour: string;
  cutoffDay: string;
}

/** Organization with `is_employment_dependency` capability (PRO onboarding, T010). */
export interface OnboardingEmployerDraft {
  nombre: string;
}

export interface OnboardingResult {
  mode: OnboardingMode;
  currency: string;
  timeZone: string;
  banks: OnboardingBankDraft[];
  wallets: OnboardingWalletDraft[];
  cards: OnboardingCardDraft[];
  /** Only populated for PRO + "sí tengo empleador"; MUST NOT ask for clients/suppliers (T012). */
  employers: OnboardingEmployerDraft[];
}

export interface OnboardingWizardProps {
  initialStep?: OnboardingStep;
  tipMessage?: string;
  submitting?: boolean;
  onComplete: (result: OnboardingResult) => void;
}

const DEFAULT_TIP =
  'Vamos a preparar tu libro juntos. Empezá simple: elegí cómo querés usar TADOR.';

const MAX_EXTRA_WALLETS = 2;
const MAX_EMPLOYERS = 3;

/** Multi-step first-run wizard. No Pacho — tip callout only. */
export default function OnboardingWizard({
  initialStep = 1,
  tipMessage = DEFAULT_TIP,
  submitting = false,
  onComplete,
}: OnboardingWizardProps) {
  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [mode, setMode] = useState<OnboardingMode | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [timeZone, setTimeZone] = useState('UTC');
  const [extraWallets, setExtraWallets] = useState<OnboardingWalletDraft[]>([]);
  const [walletName, setWalletName] = useState('');
  const [banks, setBanks] = useState<OnboardingBankDraft[]>([]);
  const [bankName, setBankName] = useState('');
  const [cards, setCards] = useState<OnboardingCardDraft[]>([]);
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>('VISA');
  const [cardNombre, setCardNombre] = useState('');
  const [cardLastFour, setCardLastFour] = useState('');
  const [cardCutoff, setCardCutoff] = useState('');
  const [dependenciaLaboral, setDependenciaLaboral] = useState<boolean | null>(null);
  const [employers, setEmployers] = useState<OnboardingEmployerDraft[]>([]);
  const [employerName, setEmployerName] = useState('');

  useEffect(() => {
    setTimeZone(detectDefaultTimeZone());
  }, []);

  function continueFromStep1() {
    if (!mode) return;
    setStep(2);
  }

  function continueFromStep2() {
    setStep(3);
  }

  function addWallet() {
    const nombre = walletName.trim();
    if (!nombre || extraWallets.length >= MAX_EXTRA_WALLETS) return;
    setExtraWallets((prev) => [...prev, { nombre }]);
    setWalletName('');
  }

  function removeWallet(index: number) {
    setExtraWallets((prev) => prev.filter((_, i) => i !== index));
  }

  function addBank() {
    const nombre = bankName.trim();
    if (!nombre || banks.length >= 2) return;
    setBanks((prev) => [...prev, { nombre }]);
    setBankName('');
  }

  function removeBank(index: number) {
    setBanks((prev) => prev.filter((_, i) => i !== index));
  }

  function addCard() {
    const nombre = cardNombre.trim();
    if (!nombre) return;
    const lastFour = cardLastFour.replace(/\D/g, '').slice(-4);
    setCards((prev) => [
      ...prev,
      {
        network: cardNetwork,
        nombre,
        lastFour,
        cutoffDay: cardCutoff.trim(),
      },
    ]);
    setCardNombre('');
    setCardLastFour('');
    setCardCutoff('');
  }

  function removeCard(index: number) {
    setCards((prev) => prev.filter((_, i) => i !== index));
  }

  function addEmployer() {
    const nombre = employerName.trim();
    if (!nombre || employers.length >= MAX_EMPLOYERS) return;
    setEmployers((prev) => [...prev, { nombre }]);
    setEmployerName('');
  }

  function removeEmployer(index: number) {
    setEmployers((prev) => prev.filter((_, i) => i !== index));
  }

  function finish() {
    if (!mode || submitting) return;
    onComplete({
      mode,
      currency,
      timeZone,
      banks,
      wallets: extraWallets,
      cards,
      employers: mode === 'pro' ? employers : [],
    });
  }

  const totalSteps = mode === 'pro' ? 6 : 5;

  const stepTip =
    step === 3
      ? 'Podés declarar tu banco y billeteras virtuales ahora, o más tarde en Entidades. La billetera del plan ya está lista sin entidad.'
      : step === 4
        ? 'Una tarjeta de crédito es una deuda. No necesitás tener cuenta en ese banco; puede ser del exterior.'
        : step === 5 && mode === 'pro'
          ? 'Solo preguntamos por tu empleador si trabajás en relación de dependencia. No pedimos clientes ni proveedores acá — eso se crea al vuelo cuando registrás un apunte.'
          : tipMessage;

  return (
    <div className="flex flex-col max-w-lg mx-auto w-full px-md pb-xl pt-lg min-h-[70vh]">
      <div className="w-full flex gap-xs mb-xl justify-center items-center">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-primary' : 'bg-surface-container-highest'}`}
          />
        ))}
      </div>

      <section className="mb-xl rounded-xl p-md border border-primary/10 bg-primary/5">
        <p className="text-label-sm text-primary font-semibold mb-xs">Consejo</p>
        <p className="text-body-md text-on-surface-variant">{stepTip}</p>
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
            <button
              type="button"
              onClick={() => setMode('pro')}
              className={`text-left p-md bg-surface-container-lowest rounded-xl border-2 transition-all shadow-sm ${
                mode === 'pro' ? 'border-primary shadow-md' : 'border-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-sm">
                <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-lg flex items-center justify-center">
                  <Icon name="business_center" className="text-2xl" />
                </div>
              </div>
              <h3 className="text-headline-md text-on-surface mb-base font-semibold">Modo PRO</h3>
              <p className="text-label-md text-on-surface-variant">
                Más control técnico: árbol de cuentas, captura guiada y asiento manual para tu
                actividad económica.
              </p>
            </button>
          </section>
          <Button fullWidth size="lg" className="rounded-xl" disabled={!mode} onClick={continueFromStep1} iconRight="arrow_forward">
            Continuar
          </Button>
          <p className="text-center mt-sm text-label-sm text-outline">
            Paso 1 de {mode === 'pro' ? 6 : 5}
          </p>
        </>
      )}

      {step === 2 && (
        <>
          <section className="mb-lg">
            <h1 className="text-headline-lg-mobile text-on-surface mb-xs font-bold">Moneda y zona horaria</h1>
            <p className="text-body-md text-on-surface-variant">
              Elegí la moneda principal y la zona horaria del libro. La zona se detecta desde tu
              navegador cuando podemos. Después de registrar movimientos, la moneda no se podrá
              cambiar.
            </p>
          </section>
          <label className="text-label-md text-on-surface-variant mb-xs block" htmlFor="currency">
            Moneda
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full h-12 px-md mb-md rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md"
          >
            <option value="USD">USD — Dólar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="ARS">ARS — Peso argentino</option>
            <option value="MXN">MXN — Peso mexicano</option>
            <option value="COP">COP — Peso colombiano</option>
            <option value="CLP">CLP — Peso chileno</option>
            <option value="PEN">PEN — Sol peruano</option>
            <option value="BRL">BRL — Real brasileño</option>
          </select>
          <label className="text-label-md text-on-surface-variant mb-xs block" htmlFor="timezone">
            Zona horaria
          </label>
          <select
            id="timezone"
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className="w-full h-12 px-md mb-xl rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md"
          >
            {CURATED_TIME_ZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <div className="flex gap-md">
            <Button variant="outline" fullWidth size="lg" className="rounded-xl" onClick={() => setStep(1)}>
              Atrás
            </Button>
            <Button fullWidth size="lg" className="rounded-xl" onClick={continueFromStep2} iconRight="arrow_forward">
              Continuar
            </Button>
          </div>
          <p className="text-center mt-sm text-label-sm text-outline">Paso 2 de {totalSteps}</p>
        </>
      )}

      {step === 3 && (
        <>
          <section className="mb-lg">
            <h1 className="text-headline-lg-mobile text-on-surface mb-xs font-bold">
              Banco y billeteras
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Todo opcional. Ya tenés una <span className="font-semibold text-on-surface">Billetera</span>{' '}
              del plan. Declará banco o apps de pago si las usás; también podés hacerlo después en
              Entidades.
            </p>
          </section>

          <div className="mb-md p-md rounded-xl bg-surface-container-lowest border border-outline-variant/30">
            <p className="text-label-md font-semibold text-on-surface">Billetera (default)</p>
            <p className="text-body-sm text-on-surface-variant mt-xs">
              Incluida en tu plan. Alcanza si no usás PayPal, DeUna, Binance u otras.
            </p>
          </div>

          {banks.length > 0 && (
            <ul className="mb-md space-y-xs">
              {banks.map((b, i) => (
                <li
                  key={`${b.nombre}-${i}`}
                  className="flex items-center justify-between gap-md p-md rounded-lg bg-surface-container-low"
                >
                  <span className="text-body-md text-on-surface">Banco · {b.nombre}</span>
                  <button
                    type="button"
                    className="text-label-sm text-error cursor-pointer"
                    onClick={() => removeBank(i)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          {banks.length < 2 && (
            <div className="mb-md space-y-sm">
              <TextInput
                label="Banco (opcional)"
                id="bank-name"
                name="bank-name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Ej. Banco Pichincha"
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                fullWidth
                className="rounded-xl"
                disabled={!bankName.trim()}
                onClick={addBank}
              >
                Agregar banco
              </Button>
            </div>
          )}

          {extraWallets.length > 0 && (
            <ul className="mb-md space-y-xs">
              {extraWallets.map((w, i) => (
                <li
                  key={`${w.nombre}-${i}`}
                  className="flex items-center justify-between gap-md p-md rounded-lg bg-surface-container-low"
                >
                  <span className="text-body-md text-on-surface">Billetera · {w.nombre}</span>
                  <button
                    type="button"
                    className="text-label-sm text-error cursor-pointer"
                    onClick={() => removeWallet(i)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          {extraWallets.length < MAX_EXTRA_WALLETS && (
            <div className="mb-xl space-y-sm">
              <TextInput
                label="Billetera virtual (opcional)"
                id="wallet-name"
                name="wallet-name"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="Ej. PayPal, DeUna, Binance…"
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                fullWidth
                className="rounded-xl"
                disabled={!walletName.trim()}
                onClick={addWallet}
              >
                Agregar billetera virtual
              </Button>
            </div>
          )}

          <div className="flex gap-md">
            <Button variant="outline" fullWidth size="lg" className="rounded-xl" onClick={() => setStep(2)}>
              Atrás
            </Button>
            <Button fullWidth size="lg" className="rounded-xl" onClick={() => setStep(4)} iconRight="arrow_forward">
              Continuar
            </Button>
          </div>
          <p className="text-center mt-sm text-label-sm text-outline">Paso 3 de {totalSteps} · opcional</p>
        </>
      )}

      {step === 4 && (
        <>
          <section className="mb-lg">
            <h1 className="text-headline-lg-mobile text-on-surface mb-xs font-bold">Tarjetas de crédito</h1>
            <p className="text-body-md text-on-surface-variant">
              Si tenés tarjeta, registrala acá. No hace falta crear el banco emisor. Podés saltar
              este paso.
            </p>
          </section>

          {cards.length > 0 && (
            <ul className="mb-md space-y-xs">
              {cards.map((c, i) => (
                <li
                  key={`${c.nombre}-${i}`}
                  className="flex items-center justify-between gap-md p-md rounded-lg bg-surface-container-low"
                >
                  <span className="text-body-md text-on-surface">
                    {c.network} · {c.nombre}
                    {c.lastFour ? ` ····${c.lastFour}` : ''}
                  </span>
                  <button
                    type="button"
                    className="text-label-sm text-error cursor-pointer"
                    onClick={() => removeCard(i)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mb-xl space-y-sm">
            <label className="text-label-md text-on-surface-variant mb-xs block" htmlFor="card-network">
              Red
            </label>
            <select
              id="card-network"
              value={cardNetwork}
              onChange={(e) => setCardNetwork(e.target.value as CardNetwork)}
              className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md"
            >
              <option value="VISA">VISA</option>
              <option value="MASTERCARD">Mastercard</option>
              <option value="AMEX">AMEX</option>
              <option value="OTRO">Otro</option>
            </select>
            <TextInput
              label="Nombre característico"
              id="card-nombre"
              name="card-nombre"
              value={cardNombre}
              onChange={(e) => setCardNombre(e.target.value)}
              placeholder='Ej. "VISA Bankard"'
              autoComplete="off"
            />
            <TextInput
              label="Últimos 4 dígitos (opcional)"
              id="card-last4"
              name="card-last4"
              value={cardLastFour}
              onChange={(e) => setCardLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
              inputMode="numeric"
              autoComplete="off"
            />
            <TextInput
              label="Día de corte (opcional)"
              id="card-cutoff"
              name="card-cutoff"
              value={cardCutoff}
              onChange={(e) => setCardCutoff(e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="1–31"
              inputMode="numeric"
              autoComplete="off"
            />
            <Button
              type="button"
              variant="outline"
              fullWidth
              className="rounded-xl"
              disabled={!cardNombre.trim()}
              onClick={addCard}
            >
              Agregar tarjeta
            </Button>
          </div>

          <div className="flex gap-md">
            <Button variant="outline" fullWidth size="lg" className="rounded-xl" onClick={() => setStep(3)}>
              Atrás
            </Button>
            <Button fullWidth size="lg" className="rounded-xl" onClick={() => setStep(5)} iconRight="arrow_forward">
              Continuar
            </Button>
          </div>
          <p className="text-center mt-sm text-label-sm text-outline">Paso 4 de {totalSteps} · opcional</p>
        </>
      )}

      {step === 5 && mode === 'pro' && (
        <>
          <section className="mb-lg">
            <h1 className="text-headline-lg-mobile text-on-surface mb-xs font-bold">
              ¿Relación de dependencia?
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Si trabajás para un empleador, creamos la organización para tus apuntes de sueldo. Si
              sos freelance, podés omitir este paso — no vas a tener que declarar clientes ni
              proveedores acá.
            </p>
          </section>

          <div className="grid grid-cols-2 gap-md mb-lg">
            <button
              type="button"
              onClick={() => setDependenciaLaboral(true)}
              className={`text-center p-md rounded-xl border-2 transition-all text-label-md font-semibold ${
                dependenciaLaboral === true
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-outline-variant/40 text-on-surface-variant'
              }`}
            >
              Sí, tengo empleador
            </button>
            <button
              type="button"
              onClick={() => {
                setDependenciaLaboral(false);
                setEmployers([]);
              }}
              className={`text-center p-md rounded-xl border-2 transition-all text-label-md font-semibold ${
                dependenciaLaboral === false
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-outline-variant/40 text-on-surface-variant'
              }`}
            >
              No, soy freelance
            </button>
          </div>

          {dependenciaLaboral && (
            <>
              {employers.length > 0 && (
                <ul className="mb-md space-y-xs">
                  {employers.map((e, i) => (
                    <li
                      key={`${e.nombre}-${i}`}
                      className="flex items-center justify-between gap-md p-md rounded-lg bg-surface-container-low"
                    >
                      <span className="text-body-md text-on-surface">Empleador · {e.nombre}</span>
                      <button
                        type="button"
                        className="text-label-sm text-error cursor-pointer"
                        onClick={() => removeEmployer(i)}
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {employers.length < MAX_EMPLOYERS && (
                <div className="mb-lg space-y-sm">
                  <TextInput
                    label="Nombre del empleador"
                    id="employer-name"
                    name="employer-name"
                    value={employerName}
                    onChange={(e) => setEmployerName(e.target.value)}
                    placeholder="Ej. Acme Corp"
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    className="rounded-xl"
                    disabled={!employerName.trim()}
                    onClick={addEmployer}
                  >
                    Agregar empleador
                  </Button>
                </div>
              )}
            </>
          )}

          <div className="flex gap-md">
            <Button variant="outline" fullWidth size="lg" className="rounded-xl" onClick={() => setStep(4)}>
              Atrás
            </Button>
            <Button
              fullWidth
              size="lg"
              className="rounded-xl"
              disabled={dependenciaLaboral === true && employers.length === 0}
              onClick={() => setStep(6)}
              iconRight="arrow_forward"
            >
              Continuar
            </Button>
          </div>
          <p className="text-center mt-sm text-label-sm text-outline">Paso 5 de 6 · opcional</p>
        </>
      )}

      {((step === 5 && mode === 'hogar') || (step === 6 && mode === 'pro')) && (
        <>
          <section className="mb-lg">
            <h1 className="text-headline-lg-mobile text-on-surface mb-xs font-bold">Listo para empezar</h1>
            <p className="text-body-md text-on-surface-variant">
              Vas a poder registrar {mode === 'pro' ? 'apuntes' : 'gastos'} y, cuando haga falta, crear
              bancos u otras cuentas sin ver códigos contables.
            </p>
          </section>
          <div className="mb-xl p-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-xs">
            <p className="text-label-md text-on-surface-variant">
              Modo: <span className="font-semibold text-primary">{mode === 'pro' ? 'PRO' : 'Hogar'}</span>
            </p>
            <p className="text-label-md text-on-surface-variant">
              Moneda: <span className="font-semibold text-primary">{currency}</span>
            </p>
            <p className="text-label-md text-on-surface-variant">
              Zona:{' '}
              <span className="font-semibold text-primary">{timeZoneLabel(timeZone)}</span>
            </p>
            <p className="text-label-md text-on-surface-variant">
              Bancos:{' '}
              <span className="font-semibold text-primary">
                {banks.length === 0 ? 'ninguno' : banks.map((b) => b.nombre).join(', ')}
              </span>
            </p>
            <p className="text-label-md text-on-surface-variant">
              Billeteras virtuales:{' '}
              <span className="font-semibold text-primary">
                {extraWallets.length === 0 ? 'ninguna' : extraWallets.map((w) => w.nombre).join(', ')}
              </span>
            </p>
            <p className="text-label-md text-on-surface-variant">
              Tarjetas:{' '}
              <span className="font-semibold text-primary">
                {cards.length === 0 ? 'ninguna' : cards.map((c) => c.nombre).join(', ')}
              </span>
            </p>
            {mode === 'pro' && (
              <p className="text-label-md text-on-surface-variant">
                Empleador:{' '}
                <span className="font-semibold text-primary">
                  {employers.length === 0 ? 'ninguno (freelance)' : employers.map((e) => e.nombre).join(', ')}
                </span>
              </p>
            )}
          </div>
          <div className="flex gap-md">
            <Button
              variant="outline"
              fullWidth
              size="lg"
              className="rounded-xl"
              disabled={submitting}
              onClick={() => setStep(mode === 'pro' ? 5 : 4)}
            >
              Atrás
            </Button>
            <Button fullWidth size="lg" className="rounded-xl" disabled={submitting} onClick={finish}>
              {submitting ? 'Guardando…' : 'Empezar'}
            </Button>
          </div>
          <p className="text-center mt-sm text-label-sm text-outline">
            Paso {totalSteps} de {totalSteps}
          </p>
        </>
      )}
    </div>
  );
}
