import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';
import { FRONTEND_URL } from './e2e/helpers/env.ts';

const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1';

const config: PlaywrightTestConfig = {
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
    { name: 'setup-pro', testMatch: /auth\.pro\.setup\.ts/ },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      testIgnore: [
        /auth\.setup\.ts/,
        /auth\.pro\.setup\.ts/,
        /(smoke|auth-guest|pro-quickstart)\.spec\.ts/,
      ],
    },
    {
      name: 'chromium-pro',
      dependencies: ['setup-pro'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/pro-user.json',
      },
      testMatch: /pro-quickstart\.spec\.ts/,
    },
    {
      name: 'guest',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /(smoke|auth-guest)\.spec\.ts/,
    },
  ],
  globalSetup: './e2e/global-setup.ts',
};

// Host mode starts Vite; Docker E2E reuses the frontend service on the compose network.
if (!skipWebServer) {
  config.webServer = {
    command: 'npm run dev -- --host 0.0.0.0 --port 5173',
    url: FRONTEND_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  };
}

export default defineConfig(config);
