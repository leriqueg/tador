import { defineConfig, devices } from '@playwright/test';
import { FRONTEND_URL } from './e2e/helpers/env.ts';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      testIgnore: /auth\.setup\.ts/,
    },
    {
      name: 'guest',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /(smoke|auth-guest)\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: FRONTEND_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  globalSetup: './e2e/global-setup.ts',
});
