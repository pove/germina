import { cpSync, appendFileSync, createReadStream, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { CURSO_3, T, guardado, preparar, sinProblemasDeAccesibilidad } from './ayudas';

// Aquí sí se usa el service worker (en el resto de pruebas está bloqueado).
test.use({ serviceWorkers: 'allow' });
// Los service workers y las copias de `dist` son sensibles a la carga: estas pruebas van una detrás de otra.
test.describe.configure({ mode: 'serial' });

const SEMANA_7 = './#/2/matematicas/3/semana/7';

/** Espera a que el service worker esté activo y haya precargado la aplicación y el contenido (también el árabe). */
async function esperarPrecarga(page: Page): Promise<void> {
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.waitForFunction(
    async () => {
      const nombre = (await caches.keys()).find((n) => n.includes('precache'));
      if (!nombre) return false;
      const urls = (await (await caches.open(nombre)).keys()).map((r) => r.url);
      return ['contenido/indice.json', 'semana-07.json', 'mapa-semanas.json', 'textos-interfaz.json', 'noto-sans-arabic', 'estilos-arabe', 'manifest-ar.webmanifest'].every((parte) =>
        urls.some((u) => u.includes(parte)),
      );
    },
    undefined,
    { timeout: 30_000 },
  );
}

test.describe('sin conexión', () => {
  test('tras la primera visita, funciona sin red: recargar y navegar a otra semana', async ({ page, context }) => {
    const falladas: string[] = [];
    page.on('requestfailed', (r) => falladas.push(r.url()));
    await preparar(page, { sinReloj: true, almacen: { idioma: 'es' } });
    await page.goto(SEMANA_7);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cuando no llega: abrir una decena');
    await esperarPrecarga(page);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cuando no llega: abrir una decena');
    await expect(page.getByText('resta con llevada')).toBeVisible();

    // Otra semana (la 8 está «en camino»: su título sale del mapa) y volver.
    await page.getByRole('link', { name: T('semana.siguiente', 'es') }).click();
    await expect(page).toHaveURL(/semana\/8$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('La vuelta');
    await page.getByRole('link', { name: T('semana.anterior', 'es') }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cuando no llega: abrir una decena');

    // Pregunta, reto, jardín, qué aprenden, cómo ayudar y ajustes.
    await page.goto('./#/2/matematicas/3/semana/7/pregunta/1');
    await expect(page.getByText('Tenemos 32 galletas')).toBeVisible();
    await page.goto('./#/2/matematicas/3/semana/7/reto');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vasos de diez');
    await expect(page.locator('bdi[dir="ltr"]', { hasText: '42 − 17 = 25' })).toHaveCount(1);
    await page.goto('./#/2/matematicas/3/jardin');
    await expect(page.locator('.planta')).toHaveCount(51);
    await page.goto('./#/2/matematicas/3/aprenden');
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(3);
    await page.goto('./#/ayuda');
    await expect(page.locator('.ideas li')).toHaveCount(6);
    await page.goto('./#/ajustes/pasar');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('pasar.titulo', 'es'));

    // Y lo marcado sin red se guarda.
    await page.goto(SEMANA_7);
    await page.getByRole('link', { name: T('semana.ver_reto', 'es') }).click();
    await page.getByRole('button', { name: T('reto.jugado', 'es'), exact: true }).click();
    expect(await guardado(page)).toMatchObject({ progreso: { [`2026/${CURSO_3}`]: { s07: { hecho: ['reto'] } } } });

    // Una recarga con la red cortada en cualquier ruta sigue funcionando.
    await page.goto('./#/2/matematicas/3/jardin');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('jardin.titulo', 'es'));
    expect(falladas.filter((u) => !u.includes('/contenido/') || u.includes('indice'))).toEqual([]);
  });

  test('también en árabe: la tipografía árabe se sirve de la caché', async ({ page, context }) => {
    await preparar(page, { sinReloj: true, almacen: { idioma: 'ar' } });
    await page.goto(SEMANA_7);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await esperarPrecarga(page);

    await context.setOffline(true);
    const falladas: string[] = [];
    page.on('requestfailed', (r) => falladas.push(r.url()));
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('لا يكفي؟ نفتح عشرة');
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    expect(await page.evaluate(() => [...document.fonts].some((f) => f.family.includes('Noto Sans Arabic') && f.status === 'loaded'))).toBe(true);
    expect(falladas).toEqual([]);
  });
});

test.describe('aplicación instalable', () => {
  test('el manifiesto sigue al idioma y trae nombre, lema, iconos y dirección', async ({ page }) => {
    await preparar(page, { sinReloj: true, almacen: { idioma: 'es' } });
    await page.goto('./');
    const leer = async (): Promise<{ href: string; json: Record<string, unknown> }> => {
      const href = (await page.locator('link[rel="manifest"]').getAttribute('href')) ?? '';
      const respuesta = await page.request.get(href);
      expect(respuesta.ok()).toBe(true);
      return { href, json: await respuesta.json() };
    };

    const es = await leer();
    expect(es.href).toMatch(/\/germina\/manifest\.webmanifest$/);
    expect(es.json).toMatchObject({ name: 'Germina', short_name: 'Germina', description: T('app.lema', 'es'), lang: 'es', dir: 'ltr', display: 'standalone', start_url: '/germina/' });

    await page.goto('./#/ajustes');
    await page.getByRole('button', { name: 'العربية' }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const ar = await leer();
    expect(ar.href).toMatch(/\/germina\/manifest-ar\.webmanifest$/);
    expect(ar.json).toMatchObject({ name: 'Germina', description: T('app.lema', 'ar'), lang: 'ar', dir: 'rtl' });

    // Los iconos del manifiesto, el de iOS y el de la pestaña existen.
    const iconos = (ar.json.icons as { src: string; sizes: string; purpose: string }[]).map((i) => i.src);
    expect(iconos.length).toBeGreaterThanOrEqual(3);
    for (const src of [...iconos, (await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')) ?? '', (await page.locator('link[rel="icon"]').getAttribute('href')) ?? '']) {
      expect((await page.request.get(src)).ok(), src).toBe(true);
    }
    expect(await page.locator('meta[name="theme-color"]').getAttribute('content')).toBe('#2f6b3a');
  });

  test('pide al navegador que conserve los datos al marcar por primera vez, y solo una vez', async ({ page }) => {
    await page.addInitScript(() => {
      let llamadas = 0;
      Object.defineProperty(window, 'llamadasAPersist', { get: () => llamadas });
      Object.defineProperty(StorageManager.prototype, 'persist', { value: async () => ++llamadas > 0, configurable: true });
    });
    await preparar(page, { almacen: { idioma: 'es' } });
    await page.goto(SEMANA_7);
    expect(await page.evaluate(() => (window as unknown as { llamadasAPersist: number }).llamadasAPersist)).toBe(0);
    await page.getByRole('link', { name: T('semana.ver_reto', 'es') }).click();
    await page.getByRole('button', { name: T('reto.jugado', 'es'), exact: true }).click();
    await page.goto('./#/2/matematicas/3/semana/7/pregunta/1');
    await page.getByRole('button', { name: T('pregunta.hablado', 'es') }).click();
    expect(await page.evaluate(() => (window as unknown as { llamadasAPersist: number }).llamadasAPersist)).toBe(1);
  });
});

// --- Actualizaciones: una copia de `dist` que se puede cambiar mientras la web está abierta ---

const TIPOS: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json',
};

async function servirCopiaDeDist(): Promise<{ origen: string; dir: string; cerrar: () => Promise<void> }> {
  const dir = mkdtempSync(join(tmpdir(), 'germina-sitio-'));
  cpSync('dist', join(dir, 'germina'), { recursive: true });
  const servidor = createServer((peticion, respuesta) => {
    const ruta = normalize(decodeURIComponent((peticion.url ?? '/').split('?')[0]!));
    let archivo = join(dir, ruta);
    if (existsSync(archivo) && statSync(archivo).isDirectory()) archivo = join(archivo, 'index.html');
    if (!archivo.startsWith(dir) || !existsSync(archivo)) {
      respuesta.statusCode = 404;
      return void respuesta.end('no encontrado');
    }
    respuesta.setHeader('Content-Type', TIPOS[extname(archivo)] ?? 'application/octet-stream');
    respuesta.setHeader('Cache-Control', 'no-cache');
    createReadStream(archivo).pipe(respuesta);
  });
  await new Promise<void>((listo) => servidor.listen(0, '127.0.0.1', listo));
  const { port } = servidor.address() as AddressInfo;
  return {
    origen: `http://localhost:${port}`,
    dir: join(dir, 'germina'),
    cerrar: async () => {
      await new Promise((listo) => servidor.close(listo));
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

test.describe('actualizaciones', () => {
  test('si hay versión nueva avisa «Hay novedades · Ver ahora» y la aplica al pulsar', async ({ page }) => {
    const sitio = await servirCopiaDeDist();
    try {
      await preparar(page, { sinReloj: true, almacen: { idioma: 'es' } });
      await page.goto(`${sitio.origen}/germina/#/2/matematicas/3/semana/7`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cuando no llega: abrir una decena');
      await esperarPrecarga(page);
      await page.reload(); // ya controlada por el service worker
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText(T('aviso.novedades', 'es'))).toHaveCount(0);

      // Sale una versión nueva: cambia el service worker (y con él lo que precarga).
      appendFileSync(join(sitio.dir, 'sw.js'), '\n// versión nueva\n');
      await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r?.update()));

      const aviso = page.getByRole('status').filter({ hasText: T('aviso.novedades', 'es') });
      await expect(aviso).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible(); // la web sigue como estaba hasta que se pulsa
      await sinProblemasDeAccesibilidad(page);

      await Promise.all([page.waitForEvent('load'), aviso.getByRole('button', { name: T('aviso.ver_ahora', 'es') }).click()]);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cuando no llega: abrir una decena');
      await expect(page.getByText(T('aviso.novedades', 'es'))).toHaveCount(0);
    } finally {
      await sitio.cerrar();
    }
  });

  test('el aviso sale también en árabe, con su texto', async ({ page }) => {
    const sitio = await servirCopiaDeDist();
    try {
      await preparar(page, { sinReloj: true, almacen: { idioma: 'ar' } });
      await page.goto(`${sitio.origen}/germina/#/2/matematicas/3/semana/7`);
      await esperarPrecarga(page);
      await page.reload();
      appendFileSync(join(sitio.dir, 'sw.js'), '\n// versión nueva\n');
      await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r?.update()));
      await expect(page.getByRole('status').filter({ hasText: T('aviso.novedades', 'ar') })).toBeVisible();
      await expect(page.getByRole('button', { name: T('aviso.ver_ahora', 'ar') })).toBeVisible();
      await sinProblemasDeAccesibilidad(page);
    } finally {
      await sitio.cerrar();
    }
  });
});
