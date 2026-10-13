import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contenido } from '../vite-contenido.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Pasa una petición por el middleware de desarrollo y dice si la ha servido él o la ha dejado a Vite. */
function pedir(url) {
  const plugin = contenido();
  plugin.configResolved({ root: RAIZ, base: '/germina/', command: 'serve' });
  let middleware;
  plugin.configureServer({ middlewares: { use: (f) => (middleware = f) } });
  const res = { statusCode: 200, cabeceras: {}, cuerpo: null, setHeader(k, v) { this.cabeceras[k] = v; }, end(c) { this.cuerpo = c; } };
  let siguiente = false;
  middleware({ url }, res, () => (siguiente = true));
  return { siguiente, res };
}

describe('servidor de desarrollo: contenido', () => {
  it('sirve el contenido que la app pide con fetch', () => {
    const { siguiente, res } = pedir('/germina/contenido/comun/como-ayudar.json');
    expect(siguiente).toBe(false);
    expect(res.cabeceras['Content-Type']).toMatch(/application\/json/);
    expect(JSON.parse(String(res.cuerpo)).ideas.length).toBeGreaterThan(0);
  });

  it('deja a Vite los imports de módulo (textos-interfaz.json en idioma.ts)', () => {
    expect(pedir('/germina/contenido/comun/textos-interfaz.json?import').siguiente).toBe(true);
    expect(pedir('/germina/contenido/comun/textos-interfaz.json?t=123').siguiente).toBe(true);
  });

  it('no sale de la carpeta de contenido', () => {
    const { siguiente, res } = pedir('/germina/contenido/..%2Fpackage.json');
    expect(siguiente).toBe(false);
    expect(res.statusCode).toBe(404);
  });
});
