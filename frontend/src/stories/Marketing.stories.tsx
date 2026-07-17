import type { Meta, StoryObj } from '@storybook/react-vite';
import { BenefitCard, CtaBanner, HeroEvolutionCard, StepItem } from '../components/marketing/LandingSections.tsx';
import { AccordionItem, FaqCategory, FaqCta } from '../components/faq/FaqComponents.tsx';
import { useState } from 'react';

const meta = {
  title: 'Marketing/Landing',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

export const Benefit: StoryObj = {
  render: () => (
    <div className="component-demo max-w-sm">
      <BenefitCard
        icon="edit_note"
        title="Apuntes cotidianos"
        description="Registra cada gasto al instante con lenguaje natural."
      />
    </div>
  ),
};

export const HeroChart: StoryObj = {
  render: () => (
    <div className="component-demo max-w-lg">
      <HeroEvolutionCard />
    </div>
  ),
};

export const HowItWorksStep: StoryObj = {
  render: () => (
    <div className="component-demo max-w-md">
      <StepItem
        number="1"
        title="Cuenta"
        description="Crea tu perfil en segundos."
        isFirst
      />
    </div>
  ),
};

export const FinalCta: StoryObj = {
  render: () => (
    <div className="max-w-3xl">
      <CtaBanner
        title="¿Listo para ordenar tus números?"
        description="Únete a miles de hogares que ya transformaron su relación con el dinero."
        buttonLabel="Empieza hoy"
        buttonTo="/register"
        footnote="No requiere tarjeta de crédito para comenzar."
      />
    </div>
  ),
};

function FaqAccordionDemo() {
  const [open, setOpen] = useState(true);
  return (
    <FaqCategory icon="auto_awesome" title="General">
      <AccordionItem
        question="¿Qué es TADOR?"
        answer="TADOR es una plataforma de gestión financiera diseñada para personas que quieren tener el control total de su economía sin complicaciones."
        isOpen={open}
        onToggle={() => setOpen(!open)}
      />
    </FaqCategory>
  );
}

export const FaqAccordion: StoryObj = {
  render: () => (
    <div className="component-demo max-w-2xl">
      <FaqAccordionDemo />
      <div className="mt-xl"><FaqCta /></div>
    </div>
  ),
};
