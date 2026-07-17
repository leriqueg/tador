import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.tsx';

export interface BenefitCardProps {
  icon: string;
  title: string;
  description: string;
  accent?: 'primary' | 'secondary';
}

export function BenefitCard({ icon, title, description, accent = 'primary' }: BenefitCardProps) {
  const borderClass = accent === 'secondary' ? 'border-b-4 border-secondary' : 'border-b-4 border-primary';
  const hoverClass =
    accent === 'secondary'
      ? 'group-hover:bg-secondary group-hover:text-white'
      : 'group-hover:bg-primary group-hover:text-white';
  const iconBg = accent === 'secondary' ? 'bg-secondary/10' : 'bg-primary/10';

  return (
    <div
      className={`bg-surface-container-lowest p-lg rounded-2xl ambient-shadow ${borderClass} group hover:-translate-y-2 transition-all`}
    >
      <div
        className={`w-14 h-14 ${iconBg} rounded-xl flex items-center justify-center mb-md ${hoverClass} transition-colors`}
      >
        <Icon name={icon} size="lg" />
      </div>
      <h3 className="text-headline-md text-primary font-semibold mb-xs">{title}</h3>
      <p className="text-on-surface-variant text-body-md">{description}</p>
    </div>
  );
}

export interface StepItemProps {
  number: string;
  title: string;
  description: string;
  isFirst?: boolean;
  isLast?: boolean;
}

export function StepItem({ number, title, description, isFirst = false, isLast = false }: StepItemProps) {
  return (
    <div className="flex gap-md group">
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold z-10 shadow-lg ${
            isFirst
              ? 'bg-primary text-on-primary'
              : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary transition-all'
          }`}
        >
          {number}
        </div>
        {!isLast && <div className="w-0.5 h-full bg-outline-variant/30" />}
      </div>
      <div className={isLast ? '' : 'pb-lg'}>
        <h4 className="text-headline-md text-primary font-semibold">{title}</h4>
        <p className="text-on-surface-variant text-body-md">{description}</p>
      </div>
    </div>
  );
}

export function HeroEvolutionCard() {
  const bars = [
    { opacity: 'bg-primary/20', height: 'h-24' },
    { opacity: 'bg-primary/40', height: 'h-32' },
    { opacity: 'bg-primary/60', height: 'h-48' },
    { opacity: 'bg-primary', height: 'h-56' },
    { opacity: 'bg-secondary', height: 'h-40' },
  ];

  return (
    <div className="relative">
      <div className="bg-surface-container-lowest ambient-shadow rounded-2xl p-md border border-outline-variant/30 transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
        <div className="flex items-center justify-between mb-md">
          <span className="text-headline-md text-primary font-semibold">Evolución</span>
          <Icon name="trending_up" className="text-success-emerald text-3xl" />
        </div>
        <div className="h-64 w-full bg-surface-container-low rounded-xl overflow-hidden flex items-end gap-base p-xs">
          {bars.map((bar) => (
            <div key={bar.height} className={`w-full ${bar.opacity} ${bar.height} rounded-t-lg`} />
          ))}
        </div>
      </div>
      <div className="absolute -bottom-xs -left-xs bg-white p-sm rounded-2xl ambient-shadow border border-outline-variant/30 flex items-center gap-xs">
        <div className="w-12 h-12 rounded-full bg-expense-rose/10 flex items-center justify-center">
          <Icon name="receipt_long" className="text-expense-rose text-2xl" />
        </div>
        <div>
          <p className="text-label-sm text-on-surface-variant">Último apunte</p>
          <p className="text-headline-md text-primary font-semibold">$1.200 - Supermercado</p>
        </div>
      </div>
    </div>
  );
}

export function CtaBanner({
  title,
  description,
  buttonLabel,
  buttonTo,
  footnote,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  buttonTo: string;
  footnote?: string;
}) {
  return (
    <div className="bg-primary rounded-[2.5rem] p-xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-tertiary/20 rounded-full blur-[100px] -mr-40 -mt-40" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] -ml-40 -mb-40" />
      <div className="relative z-10 max-w-2xl mx-auto space-y-md text-center">
        <h2 className="text-headline-xl text-on-primary font-extrabold tracking-tight">{title}</h2>
        <p className="text-on-primary/90 text-body-lg">{description}</p>
        <Link
          to={buttonTo}
          className="inline-block squishy-btn mt-lg bg-tertiary-container text-on-tertiary px-xl py-md rounded-2xl text-headline-md font-semibold hover:scale-105 transition-all shadow-xl no-underline"
        >
          {buttonLabel}
        </Link>
        {footnote && <p className="text-on-primary/70 text-label-sm">{footnote}</p>}
      </div>
    </div>
  );
}
