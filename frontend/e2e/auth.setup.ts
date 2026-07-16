import { test as setup, expect } from '@playwright/test';
import { createInitializedUser, E2E_PASSWORD } from './helpers/auth';

const authFile = 'e2e/.auth/user.json';
const email = process.env.E2E_USER_EMAIL ?? `e2e-${Date.now()}@tador.test`;

setup('prepare authenticated Hogar user', async ({ page, request }) => {
  await createInitializedUser(request, email);

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: authFile });
});
