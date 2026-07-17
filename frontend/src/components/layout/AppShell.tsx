import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import MobileBottomBar, { type BottomBarItem } from '../navigation/MobileBottomBar.tsx';
import Icon from '../ui/Icon.tsx';

export const HOGAR_NAV = [
  { to: '/hogar/dashboard', icon: 'dashboard', label: 'Resumen' },
  { to: '/hogar/entries', icon: 'edit_note', label: 'Apuntes' },
  { to: '/hogar/finances', icon: 'monitoring', label: 'Estado' },
  { to: '/hogar/accounts', icon: 'account_balance_wallet', label: 'Cuentas' },
  { to: '/hogar/entities', icon: 'group', label: 'Entidades' },
  { to: '/hogar/settings', icon: 'settings', label: 'Ajustes' },
] as const;

/** PRO namespace nav — same labels/icons as Hogar, distinct paths (specs/foundation/modos-hogar-pro.md). */
export const PRO_NAV = HOGAR_NAV.map((item) => ({
  ...item,
  to: item.to.replace('/hogar/', '/pro/') as `/pro/${string}`,
}));

export type AppShellMode = 'hogar' | 'pro';

export interface AppShellProps {
  mode?: AppShellMode;
  activePath?: string;
  userLabel?: string;
  onLogout?: () => void;
  children: ReactNode;
}

/** Authenticated shell — no Pacho avatar (post-MVP). Nav namespace follows `mode`. */
export default function AppShell({
  mode = 'hogar',
  activePath = `/${mode}/dashboard`,
  userLabel,
  onLogout,
  children,
}: AppShellProps) {
  const navItems = mode === 'pro' ? PRO_NAV : HOGAR_NAV;
  const brandTo = `/${mode}/dashboard`;
  const bottomItems: BottomBarItem[] = navItems.map((item) => ({
    icon: item.icon,
    label: item.label,
    to: item.to,
    active: activePath === item.to || activePath.startsWith(`${item.to}/`),
  }));

  return (
    <div
      data-mode={mode}
      className="min-h-screen bg-background text-on-surface font-body flex flex-col"
    >
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-surface-container px-md md:px-lg h-14 flex items-center justify-between">
        <Link to={brandTo} className="text-headline-md font-extrabold text-primary tracking-tight no-underline">
          TADOR
        </Link>
        <div className="flex items-center gap-md">
          {userLabel && (
            <span className="text-label-md text-on-surface-variant hidden sm:inline">{userLabel}</span>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="text-label-md text-secondary hover:text-primary cursor-pointer"
            >
              Salir
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex w-full max-w-container-max mx-auto">
        <aside className="hidden md:flex w-52 shrink-0 flex-col gap-xs p-md border-r border-outline-variant/40">
          {navItems.map((item) => {
            const active = activePath === item.to || activePath.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-sm p-sm rounded-lg text-label-md no-underline transition-colors ${
                  active
                    ? 'bg-primary text-on-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-primary/5'
                }`}
              >
                <Icon name={item.icon} filled={active} className="text-xl" />
                {item.label}
              </Link>
            );
          })}
        </aside>
        <main className="flex-1 min-w-0 p-md md:p-lg pb-24 md:pb-lg">{children}</main>
      </div>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-40">
        <MobileBottomBar items={bottomItems} />
      </div>
    </div>
  );
}
