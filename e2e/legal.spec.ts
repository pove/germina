import { expect, test } from '@playwright/test';
import { T, objetivosTactiles, preparar, sinProblemasDeAccesibilidad } from './ayudas';

type Idioma = 'es' | 'va' | 'en' | 'fr' | 'ar';
const IDIOMAS: Idioma[] = ['es', 'va', 'en', 'fr', 'ar'];

for (const idioma of ['es', 'ar'] as const) {
  test.describe(`páginas legales en ${idioma}`, () => {
    test('privacidad y accesibilidad: desde ajustes, sin infracciones de axe', async ({ page }) => {
      await preparar(page, { almacen: { idioma } });
      await page.goto('./#/ajustes');

      await page.getByRole('link', { name: T('ajustes.privacidad', idioma), exact: true }).click();
      await expect(page).toHaveURL(/#\/privacidad$/);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('privacidad.titulo', idioma));
      await expect(page.getByText(T('privacidad.resumen', idioma))).toBeVisible();
      await expect(page.getByText(T('privacidad.alojamiento', idioma))).toBeVisible();
      await expect(page.getByRole('heading', { level: 2 })).toHaveCount(4);
      await sinProblemasDeAccesibilidad(page);
      await objetivosTactiles(page);

      await page.goBack();
      await page.getByRole('link', { name: T('ajustes.accesibilidad', idioma), exact: true }).click();
      await expect(page).toHaveURL(/#\/accesibilidad$/);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('accesibilidad.titulo', idioma));
      await expect(page.getByText(T('accesibilidad.objetivo', idioma))).toBeVisible();
      await expect(page.getByRole('heading', { level: 2 })).toHaveCount(3);
      await sinProblemasDeAccesibilidad(page);
      await objetivosTactiles(page);
    });

    test('el menú sigue marcando «Ajustes» en las páginas legales', async ({ page }) => {
      await preparar(page, { almacen: { idioma } });
      await page.goto('./#/privacidad');
      await expect(page.getByRole('navigation').getByRole('link', { name: T('nav.ajustes', idioma) })).toHaveAttribute('aria-current', 'page');
    });
  });
}

const PANTALLAS = [
  './#/bienvenida',
  './#/2/matematicas/3/semana/7',
  './#/2/matematicas/3/semana/7/pregunta/1',
  './#/2/matematicas/3/semana/7/reto',
  './#/2/matematicas/3/jardin',
  './#/2/matematicas/3/aprenden',
  './#/ayuda',
  './#/ajustes',
  './#/ajustes/pasar',
  './#/imprimir/records',
  './#/privacidad',
  './#/accesibilidad',
];

for (const idioma of IDIOMAS) {
  test(`privacidad en ${idioma}: sin cookies, cuentas ni analítica, y con su dirección de escritura`, async ({ page }) => {
    await preparar(page, { almacen: { idioma } });
    await page.goto('./#/privacidad');
    await expect(page.locator('html')).toHaveAttribute('dir', idioma === 'ar' ? 'rtl' : 'ltr');
    for (const clave of ['privacidad.sin_1', 'privacidad.sin_2', 'privacidad.sin_3', 'privacidad.guardado', 'privacidad.borrar'])
      await expect(page.getByText(T(clave, idioma), { exact: true })).toBeVisible();
  });

  test(`ninguna petición sale del sitio recorriendo todas las pantallas en ${idioma}`, async ({ page, baseURL }) => {
    const origen = new URL(baseURL!).origin;
    const urls: string[] = [];
    page.on('request', (r) => urls.push(r.url()));
    await preparar(page, { almacen: { idioma } });
    for (const destino of PANTALLAS) {
      await page.goto(destino);
      await expect(page.locator('main h1')).toBeVisible();
    }
    await page.waitForLoadState('networkidle');
    const fuera = urls.filter((u) => !u.startsWith(origen) && !/^(data|blob|about):/.test(u));
    expect(fuera, 'peticiones a otros dominios').toEqual([]);
    expect(urls.length).toBeGreaterThan(5);
  });
}
