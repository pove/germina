import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { manifiesto, nombreDeManifiesto } from '../lib/manifiestos.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const idiomas = JSON.parse(readFileSync(join(RAIZ, 'config/idiomas.json'), 'utf8')).idiomas;
const textos = JSON.parse(readFileSync(join(RAIZ, 'contenido/comun/textos-interfaz.json'), 'utf8'));

describe('manifiesto', () => {
  it.each(idiomas.map((i) => [i.id, i]))('%s: nombre Germina, el lema como descripción, idioma y dirección', (id, idioma) => {
    const m = manifiesto(idioma, textos['app.lema'][id], '/germina/');
    expect(m.name).toBe('Germina');
    expect(m.short_name).toBe('Germina');
    expect(m.description).toBe(textos['app.lema'][id]);
    expect(m.lang).toBe(idioma.lang);
    expect(m.dir).toBe(idioma.dir);
    expect(m.display).toBe('standalone');
    expect(m.start_url).toBe('/germina/');
    expect(m.scope).toBe('/germina/');
  });

  it('el árabe es de derecha a izquierda', () => {
    const ar = idiomas.find((i) => i.id === 'ar');
    expect(manifiesto(ar, 'x', '/').dir).toBe('rtl');
  });

  it('los iconos existen y hay uno «maskable» de 512', () => {
    const m = manifiesto(idiomas[0], 'x', '/germina/');
    for (const icono of m.icons) {
      const archivo = icono.src.replace('/germina/', 'public/');
      expect(() => readFileSync(join(RAIZ, archivo)), archivo).not.toThrow();
    }
    expect(m.icons.some((i) => i.purpose === 'maskable' && i.sizes === '512x512')).toBe(true);
    expect(m.icons.some((i) => i.sizes === '192x192')).toBe(true);
  });

  it('el español es el manifiesto por defecto', () => {
    expect(nombreDeManifiesto('es')).toBe('manifest.webmanifest');
    expect(nombreDeManifiesto('ar')).toBe('manifest-ar.webmanifest');
  });
});
