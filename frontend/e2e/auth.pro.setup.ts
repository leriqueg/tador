import { test as setup, expect } from '@playwright/test';
import { createInitializedUser, E2E_PASSWORD } from './helpers/auth';
import { emailField, passwordField } from './helpers/forms';

const authFile = 'e2e/.auth/pro-user.json';
const email = process.env.E2E_PRO_USER_EMAIL ?? `e2e-pro-${Date.now()}@tador.test`;

setup('prepare authenticated PRO user', async ({ page, request }) => {
  await createInitializedUser(request, email, E2E_PASSWORD, 'pro');

  await page.goto('/login');
  await emailField(page).fill(email);
  await passwordField(page).fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL(/\/(dashboard|pro\/dashboard)/);
  await page.context().storageState({ path: authFile });
});
