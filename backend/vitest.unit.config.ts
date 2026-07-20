import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      // Unit suites target domain + application; routes/repos need integration coverage.
      include: ['src/domain/**/*.ts', 'src/application/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/application/ports/**',
        '**/node_modules/**',
        '**/dist/**',
      ],
      reporter: ['text', 'text-summary'],
      // Unit coverage of domain+application; anti-regression (Vitest 4 ≈19% lines).
      // Functions/branches stay low because large application services are integration-tested.
      thresholds: {
        lines: 15,
        statements: 15,
        functions: 15,
        branches: 12,
      },
    },
  },
});
