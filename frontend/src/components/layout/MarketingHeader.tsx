import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from '../ui/Button.tsx';
import Icon from '../ui/Icon.tsx';

export interface NavLink {
  to: string;
  label: string;
}

const DEFAULT_LINKS: NavLink[] = [
  { to: '/', label: 'Inicio' },
  { to: '/faq', label: 'Preguntas' },
];

export interface MarketingHeaderProps {
  links?: NavLink[];
  activePath?: string;
  showContact?: boolean;
  loginLabel?: string;
  loginTo?: string;
}

export default function MarketingHeader({
  links = DEFAULT_LINKS,
  activePath,
  showContact = true,
  loginLabel = 'Ingresa',
  loginTo = '/login',
}: MarketingHeaderProps) {
  const location = useLocation();
  const current = activePath ?? location.pathname;

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container">
      <div className="flex justify-between items-center w-full px-md md:px-lg max-w-container-max mx-auto h-16">
        <Link to="/" className="flex items-center gap-base no-underline">
          <Icon name="poodle" filled className="text-primary text-3xl" />
          <span className="text-headline-md font-extrabold text-primary tracking-tight">TADOR</span>
        </Link>

        <nav className="hidden md:flex gap-lg">
          {links.map((link) => {
            const isActive = current === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`text-label-md no-underline transition-colors ${
                  isActive
                    ? 'text-primary border-b-2 border-primary pb-1'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {showContact && (
            <span className="text-on-surface-variant hover:text-primary transition-colors text-label-md cursor-pointer">
              Contacto
            </span>
          )}
        </nav>

        <Button to={loginTo} size="sm" className="rounded-full px-lg py-xs shadow-md hover:shadow-lg">
          {loginLabel}
        </Button>
      </div>
    </header>
  );
}

export function GlassMarketingHeader({
  links = DEFAULT_LINKS,
  activePath,
  showContact = true,
  loginLabel = 'Ingresar',
  loginTo = '/login',
}: MarketingHeaderProps) {
  const location = useLocation();
  const current = activePath ?? location.pathname;

  return (
    <header className="fixed top-0 w-full z-50 glass-header bg-surface/85 shadow-sm border-b border-surface-variant/30">
      <div className="flex justify-between items-center w-full px-md md:px-lg max-w-container-max mx-auto h-20">
        <div className="flex items-center gap-md">
          <button
            type="button"
            className="md:hidden text-primary p-2 rounded-full hover:bg-surface-variant active:scale-95 transition-all"
            aria-label="Menú"
          >
            <Icon name="menu" />
          </button>
          <Link to="/" className="text-headline-md font-extrabold text-primary tracking-tight no-underline">
            TADOR
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-xl">
          {links.map((link) => {
            const isActive = current === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`text-label-md no-underline transition-colors ${
                  isActive
                    ? 'text-primary border-b-2 border-primary pb-1'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {showContact && (
            <span className="text-on-surface-variant hover:text-primary transition-colors text-label-md cursor-pointer">
              Contacto
            </span>
          )}
        </nav>

        <Button to={loginTo} size="sm" className="px-lg py-2.5 rounded-full shadow-md">
          {loginLabel}
        </Button>
      </div>
    </header>
  );
}

export function MinimalHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="fixed top-0 w-full z-50 px-md md:px-lg h-16 flex items-center justify-center">
      <div className="max-w-container-max w-full flex justify-between items-center">
        {children ?? (
          <Link to="/" className="text-headline-md font-extrabold text-primary tracking-tight no-underline">
            TADOR
          </Link>
        )}
      </div>
    </header>
  );
}

export function AuthHeader({ loginTo = '/login', loginLabel = 'Ingresar' }: { loginTo?: string; loginLabel?: string }) {
  return (
    <header className="fixed top-0 w-full flex justify-between items-center px-md md:px-lg h-16 z-50 bg-surface/60 backdrop-blur-md border-b border-outline-variant/10">
      <Link to="/" className="text-headline-md font-extrabold tracking-tight text-primary no-underline">
        TADOR
      </Link>
      <Link to={loginTo} className="text-primary text-label-md hover:opacity-80 transition-opacity no-underline">
        {loginLabel}
      </Link>
    </header>
  );
}
