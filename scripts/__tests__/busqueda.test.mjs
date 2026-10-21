import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { indicesDeBusqueda } from '../lib/busqueda.mjs';
import { indiceDeSemillas } from '../lib/indice.mjs';
import { palabrasProhibidasEn } from '../lib/palabras.mjs';
import { contenido } from '../vite-contenido.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const indices = indicesDeBusqueda(RAIZ);

describe('indicesDeBusqueda', () => {
  it('uno por idioma, con todas las semillas del índice y en su orden', () => {
    const claves = Object.keys(indiceDeSemillas(RAIZ).semillas);
    expect(Object.keys(indices)).toEqual(['es', 'va', 'en', 'fr', 'ar']);
    for (const indice of Object.values(indices)) expect(indice.semillas.map((s) => s.clave)).toEqual(claves);
  });

  it('la semilla de ejemplo, con sus textos en cada idioma', () => {
    const s07 = (idioma) => indices[idioma].semillas.find((s) => s.clave === '2/matematicas/3/s07');
    expect(s07('es')).toMatchObject({ titulo: 'Cuando no llega: abrir una decena', reto: 'Vasos de diez' });
    expect(s07('es').preguntas).toHaveLength(5);
    expect(s07('ar').titulo).toBe('لا يكفي؟ نفتح عشرة');
  });

  it('el tema del mapa y los saberes, solo en español', () => {
    const s02 = indices.es.semillas.find((s) => s.clave === '2/matematicas/3/s02');
    expect(s02.tema).toMatch(/millar/);
    expect(s02.saberes.some((t) => /millar/.test(t))).toBe(true);
    expect(indices.va.semillas[0]).not.toHaveProperty('tema');
    expect(indices.va.semillas[0]).not.toHaveProperty('saberes');
  });

  it('el tema y los saberes, que la web enseña, no usan palabras que Germina no dice', () => {
    const textos = indices.es.semillas.flatMap((s) => [s.tema, ...s.saberes]);
    expect(textos.flatMap((t) => palabrasProhibidasEn(t))).toEqual([]);
  });
});

describe('servidor de desarrollo: índices para buscar', () => {
  it('sirve el de cada idioma', () => {
    const plugin = contenido();
    plugin.configResolved({ root: RAIZ, base: '/germina/', command: 'serve' });
    let middleware;
    plugin.configureServer({ middlewares: { use: (f) => (middleware = f) } });
    const res = { statusCode: 200, setHeader() {}, end(c) { this.cuerpo = c; } };
    middleware({ url: '/germina/contenido/busqueda-fr.json' }, res, () => {});
    expect(JSON.parse(res.cuerpo).semillas.length).toBe(indices.fr.semillas.length);
  });
});
