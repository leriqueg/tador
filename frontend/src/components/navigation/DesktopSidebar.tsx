import Icon from '../ui/Icon.tsx';

export interface SidebarItem {
  icon: string;
  label: string;
  active?: boolean;
}

export interface DesktopSidebarProps {
  items: SidebarItem[];
  brand?: string;
}

export default function DesktopSidebar({ items, brand = 'TADOR' }: DesktopSidebarProps) {
  return (
    <div className="flex h-64 border border-outline-variant rounded-xl overflow-hidden">
      <div className="w-48 bg-surface border-r border-outline-variant p-md flex flex-col gap-sm">
        <div className="font-bold text-primary mb-md">{brand}</div>
        {items.map((item) => (
          <div
            key={item.label}
            className={`p-2 rounded text-xs flex items-center gap-xs ${
              item.active
                ? 'bg-primary text-white'
                : 'text-on-surface-variant'
            } ${item.label === 'Ajustes' ? 'mt-auto' : ''}`}
          >
            <Icon name={item.icon} className="text-sm" />
            {item.label}
          </div>
        ))}
      </div>
      <div className="flex-1 bg-surface-container-low p-md">
        <div className="h-8 bg-white border border-outline-variant rounded-full w-2/3 px-sm flex items-center gap-xs text-[10px] text-outline">
          <Icon name="search" className="text-xs" />
          Buscar movimientos...
        </div>
      </div>
    </div>
  );
}
