import { test, expect } from '@playwright/test';

/**
 * PRO quickstart smoke (T028 / T039) — mirrors integration coverage when stack is up.
 * Requires auth setup project (`npm run test:e2e` with seeded PRO user).
 * Decision graph (012): Ingreso → Otro ingreso → … → Guardar.
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

  test('EntryBuilder saves an income apunte with starter accounts (T039)', async ({ page }) => {
    await page.goto('/pro/entries');
    await expect(page.getByRole('heading', { name: 'Apuntes PRO' })).toBeVisible();

    await page.getByRole('button', { name: 'Ingreso' }).click();
    await expect(page.getByRole('heading', { name: /de dónde viene el dinero/i })).toBeVisible();
    await page.getByRole('button', { name: 'Otro ingreso' }).click();

    const debit = page.getByLabelText('¿Dónde recibiste el dinero?');
    await expect(debit).toBeVisible();
    await expect(debit.locator('option')).not.toHaveCount(1);

    await debit.selectOption({ label: 'Billetera' });
    await page.getByRole('button', { name: 'Continuar' }).click();

    const credit = page.getByLabelText('Categoría de ingreso');
    await expect(credit.locator('option')).not.toHaveCount(1);
    await credit.selectOption({ label: 'Otros ingresos' });
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.getByLabelText('Concepto').fill('Venta e2e PRO');
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.getByLabelText('Monto').fill('42.50');
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.getByRole('button', { name: 'Guardar' }).click();

    await expect(page.getByText(/apunte guardado/i)).toBeVisible();
  });
});
