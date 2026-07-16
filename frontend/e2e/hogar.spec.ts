import { test, expect } from '@playwright/test';

test.describe('Hogar shell navigation', () => {
  test('authenticated user reaches Resumen, Estado and Apuntes', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Resumen' })).toBeVisible();

    const nav = page.getByRole('complementary');
    await nav.getByRole('link', { name: 'Estado', exact: true }).click();
    await expect(page).toHaveURL(/\/finances$/);
    await expect(page.getByRole('heading', { name: 'Estado' })).toBeVisible();

    await nav.getByRole('link', { name: 'Apuntes', exact: true }).click();
    await expect(page).toHaveURL(/\/entries/);
  });

  test('Estado landing links to P&G and Balance', async ({ page }) => {
    await page.goto('/finances');

    await page.getByRole('link', { name: /Estado financiero \(P&G\)/i }).click();
    await expect(page).toHaveURL(/\/finances\/pyg/);
    await expect(page.getByRole('heading', { name: 'Estado financiero' })).toBeVisible();

    await page.goto('/finances');
    await page.getByRole('link', { name: /Estado de Balance/i }).click();
    await expect(page).toHaveURL(/\/finances\/balance/);
    await expect(page.getByRole('heading', { name: 'Estado de Balance' })).toBeVisible();
  });
});
