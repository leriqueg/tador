import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.integration.test.tsx'],
    exclude: ['e2e/**', 'node_modules/**'],
    // Integration suites walk multi-step UI; 5s flakes under full-suite load.
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/pages/**', 'src/components/**'],
      exclude: ['**/*.test.ts', '**/*.integration.test.tsx', '**/*.stories.tsx'],
    },
  },
});
