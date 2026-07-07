import { useState } from 'react';
import AppFooter from '../components/layout/AppFooter.tsx';
import { GlassMarketingHeader } from '../components/layout/MarketingHeader.tsx';
import { AccordionItem, FaqCategory, FaqCta } from '../components/faq/FaqComponents.tsx';

interface FAQItem {
  question: string;
  answer: string;
}

const CATEGORIES: Array<{
  icon: string;
  title: string;
  items: FAQItem[];
}> = [
  {
    icon: 'auto_awesome',
    title: 'General',
    items: [
      {
        question: '¿Qué es TADOR?',
        answer:
          'TADOR es una plataforma de gestión financiera diseñada para personas que quieren tener el control total de su economía sin complicaciones. Combinamos la rigurosidad del sistema contable profesional con una interfaz intuitiva y amigable, permitiéndote registrar "apuntes" de tus gastos e ingresos de forma natural.',
      },
      {
        question: '¿Es gratis?',
        answer:
          'Contamos con una versión gratuita que incluye todas las funciones esenciales para organizar tu hogar. Para usuarios con necesidades más complejas o múltiples cuentas, ofrecemos planes premium con herramientas avanzadas de análisis y reportes detallados.',
      },
    ],
  },
  {
    icon: 'security',
    title: 'Técnico',
    items: [
      {
        question: '¿Mis datos están seguros?',
        answer:
          'Tu seguridad es nuestra prioridad. Utilizamos encriptación de grado bancario (AES-256) para proteger toda tu información financiera. Tus datos son privados y solo tú tienes acceso a ellos; nunca compartimos ni vendemos tu información personal a terceros.',
      },
    ],
  },
  {
    icon: 'account_balance_wallet',
    title: 'Contable',
    items: [
      {
        question: '¿Necesito saber contabilidad?',
        answer:
          'Para nada. TADOR está diseñado específicamente para que cualquier persona pueda usarlo. Nosotros nos encargamos de la "magia" contable detrás de escena para que tú solo veas información clara y accionable sobre tu dinero, usando lenguaje cotidiano y visualizaciones simples.',
      },
    ],
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  let globalIndex = 0;

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface">
      <GlassMarketingHeader
        activePath="/faq"
        links={[
          { to: '/', label: 'Inicio' },
          { to: '/faq', label: 'Ayuda' },
        ]}
      />

      <main className="pt-32 pb-xl px-gutter max-w-[840px] mx-auto min-h-screen">
        <section className="mb-xl text-center">
          <h1 className="text-headline-xl text-primary font-extrabold mb-sm">Preguntas frecuentes</h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Resuelve todas tus dudas sobre cómo TADOR puede ayudarte a organizar tu economía personal con la
            precisión de un contador profesional.
          </p>
        </section>

        <div className="flex flex-col gap-xl">
          {CATEGORIES.map((cat) => (
            <FaqCategory key={cat.title} icon={cat.icon} title={cat.title}>
              {cat.items.map((item) => {
                const idx = globalIndex++;
                return (
                  <AccordionItem
                    key={item.question}
                    question={item.question}
                    answer={item.answer}
                    isOpen={openIndex === idx}
                    onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
                  />
                );
              })}
            </FaqCategory>
          ))}
        </div>

        <FaqCta />
      </main>

      <AppFooter brandSuffix="Finanzas" showLogo={false} className="mt-xl border-t border-surface-variant/30" />
    </div>
  );
}
