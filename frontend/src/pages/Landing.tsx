import Button from '../components/ui/Button.tsx';
import AppFooter from '../components/layout/AppFooter.tsx';
import MarketingHeader from '../components/layout/MarketingHeader.tsx';
import {
  BenefitCard,
  CtaBanner,
  HeroEvolutionCard,
  StepItem,
} from '../components/marketing/LandingSections.tsx';

const BENEFITS = [
  {
    icon: 'edit_note',
    title: 'Apuntes cotidianos',
    desc: 'Registra cada gasto al instante con lenguaje natural. Tan fácil como enviar un mensaje.',
    accent: 'primary' as const,
  },
  {
    icon: 'dashboard',
    title: 'Panel claro',
    desc: 'Visualiza hacia dónde va tu dinero con gráficos limpios y reportes fáciles de entender.',
    accent: 'secondary' as const,
  },
  {
    icon: 'query_stats',
    title: 'De Hogar a PRO',
    desc: 'Escala de simples gastos a un balance patrimonial completo cuando estés listo.',
    accent: 'primary' as const,
  },
  {
    icon: 'shield',
    title: 'Datos seguros',
    desc: 'Tu información está encriptada y resguardada con estándares de seguridad internacional.',
    accent: 'secondary' as const,
  },
];

const STEPS = [
  { num: '1', title: 'Cuenta', desc: 'Crea tu perfil en segundos. Sin burocracia, solo tú y tus metas.', first: true },
  { num: '2', title: 'Moneda', desc: 'Configura tu moneda local y tus cuentas (efectivo, banco, billeteras).' },
  { num: '3', title: 'Registra tus gastos', desc: 'Cada vez que compras algo, lo anotas. La contabilidad sucede por detrás.' },
  { num: '4', title: 'Panel', desc: 'Disfruta de la claridad total sobre tu patrimonio neto y flujos de caja.', last: true },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background font-sans text-on-surface">
      <MarketingHeader />

      <main className="pt-16">
        <section className="relative min-h-[751px] flex items-center overflow-hidden hero-mesh">
          <div className="max-w-container-max mx-auto px-md md:px-lg grid md:grid-cols-2 gap-xl items-center py-xl w-full">
            <div className="space-y-lg z-10 min-w-0 w-full">
              <div className="inline-flex items-center bg-tertiary-container/40 px-sm py-xs rounded-full border border-tertiary">
                <span className="text-label-sm text-on-tertiary-fixed-variant font-semibold">
                  Divertido pero profesional.
                </span>
              </div>

              <h1 className="text-headline-xl md:text-[56px] md:leading-[64px] text-primary tracking-tight">
                TADOR — Tu economía del hogar, con base contable
              </h1>

              <p className="font-body text-on-surface-variant text-body-lg max-w-lg leading-relaxed">
                Domina tus finanzas personales con la precisión de un contador y la facilidad de una app
                amigable. Organiza tus apuntes y crece financieramente.
              </p>

              <div className="flex flex-col sm:flex-row gap-md">
                <Button to="/register" size="lg" className="rounded-xl shadow-xl hover:scale-105 text-center">
                  Empieza gratis
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                  onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Ver Demo
                </Button>
              </div>
            </div>

            <HeroEvolutionCard />
          </div>
        </section>

        <section id="benefits" className="py-xl bg-surface-container-low">
          <div className="max-w-container-max mx-auto px-md md:px-lg">
            <div className="text-center mb-xl">
              <h2 className="text-headline-lg text-primary font-bold mb-md">Beneficios diseñados para ti</h2>
              <p className="text-on-surface-variant text-body-md max-w-2xl mx-auto">
                La robustez técnica de un sistema corporativo simplificada para tu día a día. Toma el control
                sin complicaciones.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
              {BENEFITS.map((ben) => (
                <BenefitCard
                  key={ben.title}
                  icon={ben.icon}
                  title={ben.title}
                  description={ben.desc}
                  accent={ben.accent}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-xl overflow-hidden bg-surface">
          <div className="max-w-container-max mx-auto px-md md:px-lg">
            <div className="flex flex-col md:flex-row gap-xl items-center">
              <div className="flex-1 w-full">
                <h2 className="text-headline-lg text-primary font-bold mb-xl">Cómo funciona TADOR</h2>
                <div className="space-y-lg relative">
                  {STEPS.map((step) => (
                    <StepItem
                      key={step.num}
                      number={step.num}
                      title={step.title}
                      description={step.desc}
                      isFirst={step.first}
                      isLast={step.last}
                    />
                  ))}
                </div>
              </div>
              <div className="flex-1 w-full bg-primary-container rounded-[2rem] p-lg min-h-[400px] flex items-center justify-center shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-xl rounded-3xl w-full text-white text-center">
                  <span className="material-symbols-filled text-7xl mb-md block">insights</span>
                  <p className="text-headline-md mb-xs font-semibold">Claridad Contable</p>
                  <p className="opacity-90 text-body-md">Deja de adivinar y empieza a saber.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-xl">
          <div className="max-w-container-max mx-auto px-md md:px-lg text-center">
            <CtaBanner
              title="¿Listo para ordenar tus números?"
              description="Únete a miles de hogares que ya transformaron su relación con el dinero a través de la contabilidad simplificada."
              buttonLabel="Empieza hoy"
              buttonTo="/register"
              footnote="No requiere tarjeta de crédito para comenzar."
            />
          </div>
        </section>
      </main>

      <AppFooter className="mt-xl" />
    </div>
  );
}
