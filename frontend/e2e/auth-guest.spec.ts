import { test, expect } from '@playwright/test';
import { emailField, passwordField } from './helpers/forms';

test.describe('Guest auth', () => {
  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await emailField(page).fill('nobody@tador.test');
    await passwordField(page).fill('wrong-password');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page).toHaveURL(/\/login/);
  });
});
