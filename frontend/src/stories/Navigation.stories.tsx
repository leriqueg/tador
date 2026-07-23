import type { Meta, StoryObj } from '@storybook/react-vite';
import DesktopSidebar from '../components/navigation/DesktopSidebar.tsx';
import MobileBottomBar from '../components/navigation/MobileBottomBar.tsx';
import MarketingHeader from '../components/layout/MarketingHeader.tsx';

const meta = {
  title: 'Patterns/Shells',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

export const DesktopSidebarPro: StoryObj = {
  render: () => (
    <div className="component-demo max-w-3xl">
      <p className="text-label-sm font-bold mb-md">Desktop Sidebar (PRO)</p>
      <DesktopSidebar
        items={[
          { icon: 'home', label: 'Dashboard', active: true },
          { icon: 'bar_chart', label: 'Informes' },
          { icon: 'settings', label: 'Ajustes' },
        ]}
      />
    </div>
  ),
};

export const MobileBottomBarNav: StoryObj = {
  render: () => (
    <div className="component-demo">
      <p className="text-label-sm font-bold mb-md">Mobile Bottom Bar (PRO vs Hogar)</p>
      <MobileBottomBar
        items={[
          { icon: 'dashboard', label: 'Resumen', active: true },
          { icon: 'edit_note', label: 'Apuntes' },
          { icon: 'analytics', label: 'Informes' },
          { icon: 'settings', label: 'Ajustes' },
        ]}
      />
    </div>
  ),
};

export const MarketingHeaderNav: StoryObj = {
  render: () => <MarketingHeader />,
};
