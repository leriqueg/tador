import { test, expect } from '@playwright/test';

test.describe('Guest auth', () => {
  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('nobody@tador.test');
    await page.getByLabel('Contraseña').fill('wrong-password');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByText(/error|inválid|credencial/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page).toHaveURL(/\/login/);
  });
});
