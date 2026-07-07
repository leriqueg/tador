import Icon from '../ui/Icon.tsx';

export interface BottomBarItem {
  icon: string;
  label: string;
  active?: boolean;
}

export interface MobileBottomBarProps {
  items: BottomBarItem[];
}

export default function MobileBottomBar({ items }: MobileBottomBarProps) {
  return (
    <nav className="max-w-md mx-auto flex justify-around items-center py-sm bg-white shadow-lg rounded-t-xl border border-outline-variant">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex flex-col items-center ${
            item.active
              ? 'bg-secondary-container text-on-secondary-container rounded-full px-4 py-1'
              : 'text-on-surface-variant'
          }`}
        >
          <Icon name={item.icon} filled={item.active} />
          <span className={`text-[10px] ${item.active ? 'font-bold' : ''}`}>{item.label}</span>
        </div>
      ))}
    </nav>
  );
}
