import { test, expect } from '@playwright/test';
import { emailField, passwordField } from './helpers/forms';

test.describe('Marketing smoke', () => {
  test('landing shows hero and signup CTA', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', {
        name: /TADOR — Tu economía del hogar/i,
      }),
    ).toBeVisible();

    await expect(page.getByRole('link', { name: 'Empieza gratis' })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  test('login page is reachable from landing header', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /Hola de nuevo/i })).toBeVisible();
    await expect(emailField(page)).toBeVisible();
    await expect(passwordField(page)).toBeVisible();
  });
});
