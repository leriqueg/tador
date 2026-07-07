const FOOTER_LINKS = [
  { label: 'Privacidad', href: '#' },
  { label: 'Términos', href: '#' },
  { label: 'Soporte', href: '#' },
];

export interface AppFooterProps {
  brandSuffix?: string;
  showLogo?: boolean;
  className?: string;
}

export default function AppFooter({
  brandSuffix,
  showLogo = true,
  className = '',
}: AppFooterProps) {
  return (
    <footer className={`bg-surface-container-low border-t border-surface-container ${className}`.trim()}>
      <div className="w-full px-md md:px-lg py-xl max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-md">
        <div className="flex flex-col items-center md:items-start gap-xs">
          {showLogo && (
            <div className="flex items-center gap-base">
              <span className="material-symbols-filled text-primary text-2xl">poodle</span>
              <span className="text-headline-md font-extrabold text-primary tracking-tight">TADOR</span>
            </div>
          )}
          <span className="text-label-sm text-on-surface-variant">
            &copy; 2026 TADOR{brandSuffix ? ` ${brandSuffix}` : ''}
          </span>
        </div>
        <nav className="flex gap-lg">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-label-sm text-on-surface-variant hover:text-primary hover:underline underline-offset-4 transition-colors no-underline"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export function AuthFooter() {
  return (
    <footer className="w-full py-lg px-md bg-surface-container-low">
      <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-md border-t border-surface-variant pt-md">
        <span className="text-label-sm text-on-surface-variant">&copy; 2026 TADOR</span>
        <div className="flex gap-lg">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-label-sm text-on-surface-variant hover:text-primary hover:underline underline-offset-4 transition-all no-underline"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export function CompactAuthFooter() {
  return (
    <footer className="w-full mt-auto py-md px-md md:px-lg flex flex-col md:flex-row justify-between items-center gap-md bg-surface-container-low/80 border-t border-outline-variant/10">
      <span className="text-label-sm text-on-surface-variant">&copy; 2026 TADOR</span>
      <div className="flex gap-lg">
        {FOOTER_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-label-sm text-on-surface-variant hover:text-primary hover:underline underline-offset-4 no-underline"
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
