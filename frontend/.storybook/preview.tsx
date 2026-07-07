import type { Preview } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import '../src/globals.css';

const preview: Preview = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'padded',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      default: 'surface',
      values: [
        { name: 'surface', value: '#fdf8f5' },
        { name: 'white', value: '#ffffff' },
        { name: 'primary', value: '#006565' },
      ],
    },
  },
};

export default preview;
