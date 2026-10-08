import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const leer = (ruta) => readFileSync(new URL(`../../${ruta}`, import.meta.url), 'utf8').trim();

describe('icono de la cabecera', () => {
  it('es el mismo dibujo que el icono de la aplicación, oculto al lector de pantalla', () => {
    const marca = leer('src/assets/ui/marca.svg');
    expect(marca).toMatch(/^<svg aria-hidden="true" /);
    expect(marca.replace('<svg aria-hidden="true" ', '<svg ')).toBe(leer('public/favicon.svg'));
  });
});
