import { test, expect } from '@playwright/test';

test('la página de inicio muestra el nombre y el lema', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1, name: 'Germina' })).toBeVisible();
  await expect(page.getByText('10 minutos al día para crecer en casa')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});
