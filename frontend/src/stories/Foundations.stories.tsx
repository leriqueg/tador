import type { Meta, StoryObj } from '@storybook/react-vite';
import { ColorPalette, DesignPrinciples, TypographyScale } from '../components/foundations/Foundations.tsx';
import { DESIGN_SPEC_PATH } from '../design/tokens.ts';

const meta = {
  title: 'Foundations/Branding',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Canonical design spec: \`${DESIGN_SPEC_PATH}\`. Tokens: \`src/design/tokens.ts\`, CSS: \`src/globals.css\`.`,
      },
    },
  },
} satisfies Meta;

export default meta;

export const Colors: StoryObj = {
  render: () => (
    <div className="component-demo grid grid-cols-1 md:grid-cols-2 gap-lg max-w-4xl">
      <div>
        <h4 className="text-label-md mb-md">Color Palette (DESIGN.md)</h4>
        <ColorPalette />
      </div>
      <div>
        <h4 className="text-label-md mb-md">Typography Scale</h4>
        <TypographyScale />
      </div>
    </div>
  ),
};

export const Guidelines: StoryObj = {
  render: () => (
    <div className="component-demo">
      <DesignPrinciples />
    </div>
  ),
};
