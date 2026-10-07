import { expect, test } from '@playwright/test';
import { T, preparar } from './ayudas';

test('la bienvenida muestra el nombre y el lema en el idioma del navegador', async ({ page }) => {
  await preparar(page);
  await page.goto('./');
  await expect(page.locator('main')).toContainText(T('app.lema', 'es'));
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByText('Germina').first()).toBeVisible();
});

test.describe('navegador en árabe', () => {
  test.use({ locale: 'ar-EG' });
  test('árabe, de derecha a izquierda', async ({ page }) => {
    await preparar(page);
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('main')).toContainText(T('app.lema', 'ar'));
  });
});

test.describe('navegador en catalán', () => {
  test.use({ locale: 'ca-ES' });
  test('valenciano', async ({ page }) => {
    await preparar(page);
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ca-ES-valencia');
  });
});

test.describe('navegador en otro idioma', () => {
  test.use({ locale: 'de-DE' });
  test('español', async ({ page }) => {
    await preparar(page);
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });
});
