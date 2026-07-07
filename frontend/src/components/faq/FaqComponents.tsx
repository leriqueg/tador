import type { ReactNode } from 'react';
import Icon from '../ui/Icon.tsx';

export interface AccordionItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function AccordionItem({ question, answer, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div
      className={`bg-surface-container-low rounded-xl shadow-sm border transition-all cursor-pointer group ${
        isOpen ? 'border-primary/20' : 'border-transparent hover:border-primary/20'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-lg flex justify-between items-center text-left cursor-pointer"
      >
        <span className="text-label-md font-bold text-on-surface">{question}</span>
        <div className="bg-surface-container-high p-1 rounded-full shrink-0 group-hover:bg-primary/10 transition-colors">
          <Icon
            name="expand_more"
            className={`text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[500px] pb-lg' : 'max-h-0'
        }`}
      >
        <p className="px-lg text-body-md text-on-surface-variant leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export interface FaqCategoryProps {
  icon: string;
  title: string;
  children: ReactNode;
}

export function FaqCategory({ icon, title, children }: FaqCategoryProps) {
  return (
    <div>
      <h2 className="text-headline-md text-secondary font-bold mb-md flex items-center gap-xs">
        <Icon name={icon} className="text-primary" />
        {title}
      </h2>
      <div className="space-y-md">{children}</div>
    </div>
  );
}

export function FaqCta() {
  return (
    <section className="mt-xl p-xl bg-primary rounded-2xl text-center shadow-xl shadow-primary/10">
      <h3 className="text-headline-md text-on-primary font-semibold mb-xs">¿Todavía tienes dudas?</h3>
      <p className="text-body-md text-on-primary/90 mb-md">
        Escríbenos y te ayudamos a configurar tu cuenta en minutos.
      </p>
      <button
        type="button"
        className="bg-surface text-primary px-xl py-4 rounded-full text-label-md squishy-btn hover:bg-surface-bright transition-all shadow-lg font-bold"
      >
        Contactar Soporte
      </button>
    </section>
  );
}
