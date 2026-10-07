import { expect, test, type Browser, type Page } from '@playwright/test';
import { qrSvg } from '../src/nucleo/qr';
import { CURSO_3, CURSO_4, T, guardado, objetivosTactiles, preparar, sinProblemasDeAccesibilidad, type Almacen } from './ayudas';

/** Otro móvil: un contexto del navegador distinto, sin nada guardado. */
async function otroMovil(browser: Browser, baseURL: string, almacen?: Almacen): Promise<Page> {
  const contexto = await browser.newContext({ baseURL, viewport: { width: 375, height: 812 }, locale: 'es-ES' });
  const pagina = await contexto.newPage();
  await preparar(pagina, { almacen });
  return pagina;
}

const PROGRESO_A = {
  [`2026/${CURSO_3}`]: { s07: { hecho: ['reto', 'p1'], record: 14 }, s08: { hecho: ['p2'] } },
  [`2025/${CURSO_3}`]: { s02: { hecho: ['p3'] } },
};

/** Abre «Llevar el jardín» en el móvil de partida y devuelve el enlace y el código en texto. */
async function enlaceDe(page: Page): Promise<{ enlace: string; texto: string }> {
  await page.goto('./#/ajustes/pasar');
  const enlace = await page.locator('input[readonly]').inputValue();
  const texto = (await page.locator('.codigo code').textContent()) ?? '';
  return { enlace, texto };
}

test.describe('llevar el jardín a otro móvil', () => {
  test('el enlace lleva lo marcado a otro móvil, que pregunta y lo añade', async ({ page, browser, baseURL }) => {
    await preparar(page, { almacen: { idioma: 'es', cursos: [CURSO_3, CURSO_4], progreso: PROGRESO_A } });
    const { enlace } = await enlaceDe(page);
    expect(enlace.startsWith(`${baseURL}#/recibir/`)).toBe(true);
    expect(enlace).not.toContain('%'); // nada que escapar

    const otro = await otroMovil(browser, baseURL!);
    await otro.goto(enlace);
    await expect(otro.getByRole('heading', { level: 1 })).toHaveText(T('recibir.titulo', 'es'));
    await expect(otro.getByText('3.º', { exact: true })).toBeVisible();
    await expect(otro.getByText('4.º', { exact: true })).toBeVisible();
    // Todavía no se ha añadido nada.
    expect(await guardado(otro)).toEqual({});

    await otro.getByRole('button', { name: T('recibir.anadir', 'es') }).click();
    await expect(otro.getByText(T('recibir.hecho', 'es'))).toBeVisible();
    await otro.getByRole('link', { name: T('recibir.ver_jardin', 'es') }).click();

    await expect(otro).toHaveURL(/\/2\/matematicas\/3\/jardin$/);
    await expect(otro.getByRole('link', { name: `${T('semana.titulo', 'es', { n: 7 })}: ${T('jardin.estado.flor', 'es')}` })).toBeVisible();
    await expect(otro.getByRole('img', { name: new RegExp(`${T('semana.titulo', 'es', { n: 8 })}: `) })).toBeVisible(); // s08 no existe aún
    const datos = await guardado(otro);
    expect(datos).toMatchObject({ cursos: [CURSO_3, CURSO_4], cursoActivo: CURSO_3, ultimoAnoCurso: 2026, progreso: PROGRESO_A });
    await otro.context().close();
  });

  test('si el otro móvil ya tenía cosas, se suman y se queda el mejor récord', async ({ page, browser, baseURL }) => {
    await preparar(page, { almacen: { idioma: 'es', progreso: PROGRESO_A } });
    const { enlace } = await enlaceDe(page);

    const otro = await otroMovil(browser, baseURL!, {
      idioma: 'va',
      cursos: [CURSO_4],
      cursoActivo: CURSO_4,
      progreso: { [`2026/${CURSO_3}`]: { s07: { hecho: ['p2', 'p5'], record: 20 } }, [`2026/${CURSO_4}`]: { s01: { hecho: ['reto'] } } },
    });
    await otro.goto(enlace);
    await otro.getByRole('button', { name: T('recibir.anadir', 'va') }).click();
    const datos = await guardado(otro);
    expect(datos).toMatchObject({
      idioma: 'va', // el idioma y el curso activo de quien recibe no cambian
      cursoActivo: CURSO_4,
      cursos: [CURSO_4, CURSO_3],
      progreso: {
        [`2026/${CURSO_3}`]: { s07: { hecho: ['reto', 'p1', 'p2', 'p5'], record: 20 }, s08: { hecho: ['p2'] } },
        [`2026/${CURSO_4}`]: { s01: { hecho: ['reto'] } },
        [`2025/${CURSO_3}`]: { s02: { hecho: ['p3'] } },
      },
    });
    await otro.context().close();
  });

  test('«No, gracias» no cambia nada', async ({ page, browser, baseURL }) => {
    await preparar(page, { almacen: { idioma: 'es', progreso: PROGRESO_A } });
    const { enlace } = await enlaceDe(page);
    const otro = await otroMovil(browser, baseURL!, { idioma: 'es' });
    await otro.goto('./#/ajustes');
    const antes = await guardado(otro);
    await otro.goto(enlace);
    await otro.getByRole('button', { name: T('recibir.no', 'es') }).click();
    await expect(otro).toHaveURL(/\/semana\/7$/);
    expect(await guardado(otro)).toEqual(antes);
    await otro.context().close();
  });

  test('el código escrito a mano (en grupos de 4, en minúsculas) también vale', async ({ page, browser, baseURL }) => {
    await preparar(page, { almacen: { idioma: 'es', progreso: PROGRESO_A } });
    const { texto } = await enlaceDe(page);
    expect(texto).toMatch(/^([0-9A-Z]{4}-)+[0-9A-Z]{1,4}$/);

    const otro = await otroMovil(browser, baseURL!, { idioma: 'es' });
    await otro.goto('./#/ajustes/pasar');
    await otro.getByLabel(T('pasar.pegar', 'es')).fill(texto.toLowerCase().replace(/-/g, ' '));
    await otro.getByRole('button', { name: T('pasar.continuar', 'es') }).click();
    await expect(otro.getByRole('heading', { level: 1 })).toHaveText(T('recibir.titulo', 'es'));
    await otro.getByRole('button', { name: T('recibir.anadir', 'es') }).click();
    expect(await guardado(otro)).toMatchObject({ progreso: PROGRESO_A });
    await otro.context().close();
  });

  test('pegar el enlace entero (con texto alrededor) también vale', async ({ page, browser, baseURL }) => {
    await preparar(page, { almacen: { idioma: 'es', progreso: PROGRESO_A } });
    const { enlace } = await enlaceDe(page);
    const otro = await otroMovil(browser, baseURL!, { idioma: 'es' });
    await otro.goto('./#/ajustes/pasar');
    await otro.getByLabel(T('pasar.pegar', 'es')).fill(`Mirad el jardín: ${enlace} ¡gracias!`);
    await otro.getByRole('button', { name: T('pasar.continuar', 'es') }).click();
    await expect(otro.getByRole('button', { name: T('recibir.anadir', 'es') })).toBeVisible();
    await otro.context().close();
  });

  test('un código dañado a mano no se carga y se pide enviarlo otra vez', async ({ page, browser, baseURL }) => {
    await preparar(page, { almacen: { idioma: 'es', progreso: PROGRESO_A } });
    const { enlace } = await enlaceDe(page);
    const [inicio, codigo] = enlace.split('#/recibir/') as [string, string];

    const otro = await otroMovil(browser, baseURL!, { idioma: 'es' });
    await otro.goto('./#/ajustes');
    const antes = await guardado(otro);
    // Se cambia un carácter en medio del código.
    const medio = Math.floor(codigo.length / 2);
    const dañado = `${codigo.slice(0, medio)}${codigo[medio] === '7' ? '8' : '7'}${codigo.slice(medio + 1)}`;
    await otro.goto(`${inicio}#/recibir/${dañado}`);
    await expect(otro.getByRole('alert')).toHaveText(T('recibir.error', 'es'));
    await expect(otro.getByRole('button', { name: T('recibir.anadir', 'es') })).toHaveCount(0);
    await sinProblemasDeAccesibilidad(otro);
    expect(await guardado(otro)).toEqual(antes);

    // Y un código al que le falta un trozo.
    await otro.goto(`${inicio}#/recibir/${codigo.slice(0, -3)}`);
    await expect(otro.getByRole('alert')).toHaveText(T('recibir.error', 'es'));
    // O que ni siquiera es un código.
    await otro.goto(`${inicio}#/recibir/HOLAUUUU`);
    await expect(otro.getByRole('alert')).toHaveText(T('recibir.error', 'es'));
    expect(await guardado(otro)).toEqual(antes);
    await otro.context().close();
  });

  test('en el cuadro de pegar, un código malo avisa sin salir de la pantalla', async ({ page }) => {
    await preparar(page, { almacen: { idioma: 'es' } });
    await page.goto('./#/ajustes/pasar');
    await page.getByLabel(T('pasar.pegar', 'es')).fill('esto no es un código ñ');
    await page.getByRole('button', { name: T('pasar.continuar', 'es') }).click();
    await expect(page.getByRole('alert')).toHaveText(T('recibir.error', 'es'));
    await expect(page).toHaveURL(/ajustes\/pasar$/);
  });

  test('un enlace vacío o con cursos que esta web no tiene no añade nada raro', async ({ page, browser, baseURL }) => {
    await preparar(page, { almacen: { idioma: 'es', cursos: [] } });
    await page.goto('./#/ajustes/pasar');
    await expect(page.getByText(T('pasar.vacio', 'es'))).toBeVisible();
    await expect(page.locator('input[readonly]')).toHaveCount(0);
    await sinProblemasDeAccesibilidad(page);

    // El código de «nada» (versión 1, ningún bloque, CRC) es válido pero no trae nada.
    const otro = await otroMovil(browser, baseURL!, { idioma: 'es' });
    await otro.goto('./#/recibir/0402WFG'); // versión 1, ningún bloque y CRC, en Base32
    await expect(otro.getByText(T('recibir.vacio', 'es'))).toBeVisible();
    await otro.context().close();
  });

  test('copiar el enlace y el código, y el QR lleva el enlace', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await preparar(page, { almacen: { idioma: 'es', progreso: PROGRESO_A } });
    await page.addInitScript(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }));
    const { enlace, texto } = await enlaceDe(page);

    await page.getByRole('button', { name: T('pasar.copiar_enlace', 'es') }).click();
    await expect(page.getByText(T('pasar.copiado', 'es'))).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(enlace);
    await page.getByRole('button', { name: T('pasar.copiar_codigo', 'es') }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(texto);

    // El QR es el del enlace.
    await expect(page.locator('.qr')).toHaveAttribute('role', 'img');
    const esperado = /<path d="([^"]+)"/.exec(qrSvg(enlace))![1];
    expect(await page.locator('.qr path').getAttribute('d')).toBe(esperado);
    // Sin navigator.share, no hay botón de compartir.
    await expect(page.getByRole('button', { name: T('pasar.compartir', 'es') })).toHaveCount(0);
  });

  test('compartir usa el menú del sistema con el enlace', async ({ page }) => {
    await preparar(page, { almacen: { idioma: 'es', progreso: PROGRESO_A } });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { value: async (datos: unknown) => ((window as unknown as { compartido: unknown }).compartido = datos), configurable: true });
    });
    const { enlace } = await enlaceDe(page);
    await page.getByRole('button', { name: T('pasar.compartir', 'es') }).click();
    const compartido = await page.evaluate(() => (window as unknown as { compartido: { url: string; title: string } }).compartido);
    expect(compartido.url).toBe(enlace);
    expect(compartido.title).toBe('Germina');
  });

  for (const idioma of ['es', 'ar'] as const) {
    test.describe(`en ${idioma}`, () => {
      test.use({ locale: idioma === 'ar' ? 'ar' : 'es-ES' });

      test('llevar y recibir: axe y objetivos táctiles', async ({ page, browser, baseURL }) => {
        await preparar(page, { almacen: { idioma, progreso: PROGRESO_A } });
        const { enlace } = await enlaceDe(page);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('pasar.titulo', idioma));
        await expect(page.locator('.codigo')).toHaveAttribute('dir', 'ltr'); // el código va de izquierda a derecha
        await sinProblemasDeAccesibilidad(page);
        await objetivosTactiles(page);

        const contexto = await browser.newContext({ baseURL, viewport: { width: 375, height: 812 }, locale: idioma === 'ar' ? 'ar' : 'es-ES' });
        const otro = await contexto.newPage();
        await preparar(otro);
        await otro.goto(enlace);
        await expect(otro.getByRole('heading', { level: 1 })).toHaveText(T('recibir.titulo', idioma));
        await sinProblemasDeAccesibilidad(otro);
        await objetivosTactiles(otro);
        await otro.getByRole('button', { name: T('recibir.anadir', idioma) }).click();
        await expect(otro.getByText(T('recibir.hecho', idioma))).toBeVisible();
        await sinProblemasDeAccesibilidad(otro);
        await contexto.close();
      });

      test('hoja de récords: axe y objetivos táctiles', async ({ page }) => {
        await preparar(page, { almacen: { idioma, progreso: { [`2026/${CURSO_3}`]: { s13: { hecho: ['reto'], record: 14 } } } } });
        await page.goto('./#/imprimir/records');
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('imprimir.titulo', idioma));
        await expect(page.locator('.tabla-records tbody tr')).toHaveCount(4); // semanas 13, 17 y 34 y el verano 1
        await sinProblemasDeAccesibilidad(page);
        await objetivosTactiles(page);
      });
    });
  }
});

test.describe('hoja de récords', () => {
  test('muestra el mejor récord, con huecos para anotar, y al imprimir solo queda la hoja', async ({ page }) => {
    await preparar(page, {
      almacen: { idioma: 'es', progreso: { [`2025/${CURSO_3}`]: { s13: { hecho: ['reto'], record: 9 } }, [`2026/${CURSO_3}`]: { s13: { hecho: ['reto'], record: 14 } } } },
    });
    await page.goto('./#/imprimir/records');
    const fila = page.locator('.tabla-records tbody tr', { hasText: T('semana.titulo', 'es', { n: 13 }) });
    await expect(fila.locator('td').nth(1)).toHaveText('14'); // el mejor de todos los años
    await expect(page.locator('.tabla-records tbody tr', { hasText: T('semana.titulo', 'es', { n: 17 }) }).locator('td').nth(1)).toHaveText('');
    await expect(page.locator('.tabla-records tbody tr', { hasText: T('verano.titulo', 'es', { n: 1 }) })).toBeVisible();

    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.cabecera')).toBeHidden();
    await expect(page.getByRole('button', { name: T('imprimir.imprimir', 'es') })).toBeHidden();
    await expect(page.locator('.tabla-records')).toBeVisible();
  });

  test('sin cursos, pide elegir uno', async ({ page }) => {
    await preparar(page, { almacen: { idioma: 'es', cursos: [] } });
    await page.goto('./#/imprimir/records');
    await expect(page.getByText(T('imprimir.sin_cursos', 'es'))).toBeVisible();
  });

  test('desde ajustes se llega a «Llevar el jardín» y a la hoja', async ({ page }) => {
    await preparar(page, { almacen: { idioma: 'es' } });
    await page.goto('./#/ajustes');
    await page.getByRole('link', { name: T('ajustes.records', 'es') }).click();
    await expect(page).toHaveURL(/imprimir\/records$/);
    await page.goto('./#/ajustes');
    await page.getByRole('link', { name: T('ajustes.pasar', 'es'), exact: true }).first().click();
    await expect(page).toHaveURL(/ajustes\/pasar$/);
  });
});
