import type { Page, Locator } from '@playwright/test';

/** Login password field — avoid getByLabel('Contraseña') which also matches the show/hide toggle. */
export function passwordField(page: Page): Locator {
  return page.locator('#password');
}

export function emailField(page: Page): Locator {
  return page.getByLabel('Email');
}
