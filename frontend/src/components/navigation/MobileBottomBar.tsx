import Icon from '../ui/Icon.tsx';
import { Link } from 'react-router-dom';

export interface BottomBarItem {
  icon: string;
  label: string;
  to?: string;
  active?: boolean;
}

export interface MobileBottomBarProps {
  items: BottomBarItem[];
}

export default function MobileBottomBar({ items }: MobileBottomBarProps) {
  return (
    <nav className="max-w-md mx-auto flex justify-around items-center py-sm bg-white shadow-lg rounded-t-xl border border-outline-variant">
      {items.map((item) => {
        const className = `flex flex-col items-center no-underline ${
          item.active
            ? 'bg-secondary-container text-on-secondary-container rounded-full px-4 py-1'
            : 'text-on-surface-variant'
        }`;
        const content = (
          <>
            <Icon name={item.icon} filled={item.active} />
            <span className={`text-[10px] ${item.active ? 'font-bold' : ''}`}>{item.label}</span>
          </>
        );
        if (item.to) {
          return (
            <Link key={item.label} to={item.to} className={className} aria-current={item.active ? 'page' : undefined}>
              {content}
            </Link>
          );
        }
        return (
          <div key={item.label} className={className}>
            {content}
          </div>
        );
      })}
    </nav>
  );
}
