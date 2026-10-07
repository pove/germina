import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const IDIOMAS = [
  { id: 'es', boton: 'Español', lang: 'es', dir: 'ltr', lema: '10 minutos al día para crecer en casa', semana: 'Semana 7' },
  { id: 'va', boton: 'Valencià', lang: 'ca-ES-valencia', dir: 'ltr', lema: '10 minuts al dia per a créixer a casa', semana: 'Setmana 7' },
  { id: 'en', boton: 'English', lang: 'en', dir: 'ltr', lema: '10 minutes a day to grow at home', semana: 'Week 7' },
  { id: 'fr', boton: 'Français', lang: 'fr', dir: 'ltr', lema: '10 minutes par jour pour grandir à la maison', semana: 'Semaine 7' },
  { id: 'ar', boton: 'العربية', lang: 'ar', dir: 'rtl', lema: '10 دقائق يوميًا للنمو في البيت', semana: 'الأسبوع 7' },
] as const;

async function abrirPrueba(page: Page): Promise<void> {
  await page.goto('./#/prueba');
  await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
}

test.describe('idioma de partida', () => {
  test('con el navegador en español, español', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test.describe('navegador en árabe', () => {
    test.use({ locale: 'ar-EG' });
    test('árabe, de derecha a izquierda, con las cifras de clase', async ({ page }) => {
      await page.goto('./');
      await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await expect(page.getByText('10 دقائق يوميًا للنمو في البيت')).toBeVisible();
    });
  });

  test.describe('navegador en catalán', () => {
    test.use({ locale: 'ca-ES' });
    test('valenciano', async ({ page }) => {
      await page.goto('./');
      await expect(page.locator('html')).toHaveAttribute('lang', 'ca-ES-valencia');
    });
  });

  test.describe('navegador en otro idioma', () => {
    test.use({ locale: 'de-DE' });
    test('español', async ({ page }) => {
      await page.goto('./');
      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    });
  });

  test('el idioma elegido se recuerda al volver', async ({ page }) => {
    await abrirPrueba(page);
    await page.getByRole('button', { name: 'العربية' }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('germina') ?? '{}'));
    expect(guardado).toMatchObject({ v: 1, idioma: 'ar' });
  });
});

test.describe('la semilla de ejemplo en los cinco idiomas', () => {
  for (const i of IDIOMAS) {
    test(`${i.id}: lang, dir, textos y operaciones`, async ({ page }) => {
      await abrirPrueba(page);
      await page.getByRole('button', { name: i.boton }).click();
      await expect(page.locator('html')).toHaveAttribute('lang', i.lang);
      await expect(page.locator('html')).toHaveAttribute('dir', i.dir);
      await expect(page.getByRole('heading', { level: 2 })).toContainText(i.semana);
      // Las operaciones van aisladas de izquierda a derecha, con las cifras de clase.
      const operacion = page.locator('bdi[dir="ltr"]', { hasText: '42 − 17 = 25' });
      await expect(operacion).toHaveCount(1);
      await expect(operacion).toHaveCSS('direction', 'ltr');
      await expect(page.locator('bdi[dir="ltr"]', { hasText: '132 − 57' })).toHaveCount(1);
      // Ningún texto sin traducir: no sale el aviso de textos incompletos.
      await expect(page.getByRole('status')).toHaveCount(0);
      // Los pictogramas están, y son solo adorno.
      await expect(page.locator('.pictograma svg')).toHaveCount(4);
      await expect(page.locator('.pictograma').first()).toHaveAttribute('aria-hidden', 'true');
    });
  }

  test('el aviso de traducción automática sale en los idiomas distintos del español', async ({ page }) => {
    await abrirPrueba(page);
    await expect(page.getByText('Traducción automática')).toHaveCount(0);
    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.getByText('Automatic translation')).toBeVisible();
  });

  test('en árabe, la página se maqueta de derecha a izquierda', async ({ page }) => {
    await abrirPrueba(page);
    await page.getByRole('button', { name: 'العربية' }).click();
    const paso = page.locator('.pasos li').first();
    const [picto, texto] = await Promise.all([paso.locator('.pictograma').boundingBox(), paso.locator('span').last().boundingBox()]);
    // El pictograma queda a la derecha del texto.
    expect(picto!.x).toBeGreaterThan(texto!.x);
  });
});

test.describe('nada sale del sitio y la tipografía árabe solo se carga en árabe', () => {
  test('sin peticiones a otros dominios y la fuente árabe solo con árabe', async ({ page, baseURL }) => {
    const origen = new URL(baseURL!).origin;
    const urls: string[] = [];
    page.on('request', (r) => urls.push(r.url()));
    await abrirPrueba(page);
    await page.waitForLoadState('networkidle');
    expect(urls.some((u) => u.includes('atkinson-hyperlegible'))).toBe(true);
    expect(urls.some((u) => u.includes('noto-sans-arabic'))).toBe(false);

    await page.getByRole('button', { name: 'العربية' }).click();
    await expect.poll(() => urls.some((u) => u.includes('noto-sans-arabic'))).toBe(true);
    await page.waitForLoadState('networkidle');

    const externas = urls.filter((u) => !u.startsWith(origen) && !u.startsWith('data:') && !u.startsWith('blob:'));
    expect(externas).toEqual([]);
  });
});

test.describe('accesibilidad (axe)', () => {
  for (const i of [IDIOMAS[0], IDIOMAS[4]]) {
    test(`la página de prueba en ${i.id}: sin infracciones serias ni críticas`, async ({ page }) => {
      await abrirPrueba(page);
      await page.getByRole('button', { name: i.boton }).click();
      await expect(page.getByRole('heading', { level: 2 })).toContainText(i.semana);
      const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const graves = resultado.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(graves, JSON.stringify(graves.map((v) => ({ id: v.id, nodos: v.nodes.map((n) => n.html) })), null, 1)).toEqual([]);
    });
  }
});

test('los botones del selector miden 44 px o más', async ({ page }) => {
  await abrirPrueba(page);
  for (const boton of await page.locator('.selector-idioma button').all()) {
    const caja = await boton.boundingBox();
    expect(caja!.height).toBeGreaterThanOrEqual(44);
    expect(caja!.width).toBeGreaterThanOrEqual(44);
  }
});
