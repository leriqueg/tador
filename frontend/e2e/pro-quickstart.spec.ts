import { test, expect } from '@playwright/test';

/**
 * PRO quickstart smoke (T028) — mirrors integration coverage when stack is up.
 * Requires auth setup project (`npm run test:e2e` with seeded user in PRO mode).
 */
test.describe('PRO quickstart smoke', () => {
  test('PRO book reaches finances panels from dashboard nav', async ({ page }) => {
    await page.goto('/pro/dashboard');
    await expect(page.getByRole('heading', { name: 'Resumen PRO' })).toBeVisible();

    const nav = page.getByRole('complementary');
    await nav.getByRole('link', { name: 'Estado', exact: true }).click();
    await expect(page).toHaveURL(/\/pro\/finances$/);
    await expect(page.getByRole('heading', { name: 'Estado PRO' })).toBeVisible();

    await page.getByRole('link', { name: /Estado financiero \(P&G\)/i }).click();
    await expect(page).toHaveURL(/\/pro\/finances\/pyg/);
    await expect(page.getByRole('heading', { name: 'Estado financiero' })).toBeVisible();
  });

  test('namespace guard sends PRO user away from Hogar entries', async ({ page }) => {
    await page.goto('/hogar/entries');
    await expect(page).toHaveURL(/\/pro\/entries/);
  });
});
