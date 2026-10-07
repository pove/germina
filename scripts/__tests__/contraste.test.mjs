import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { coloresDeRaiz, contraste } from '../lib/contraste.mjs';

const colores = coloresDeRaiz(readFileSync(new URL('../../src/estilos.css', import.meta.url), 'utf8'));

const FONDOS = ['fondo', 'tarjeta', 'acento-suave', 'hierba-suave', 'tierra-suave', 'flor-suave', 'sol-suave', 'gris-suave'];

// Texto: 4,5:1 sobre cualquier fondo de la paleta.
const TEXTO = ['texto', 'texto-suave', 'acento', 'flor', 'tierra'];
// Dibujos que dicen algo (las plantas del jardín) y bordes de los controles: 3:1 (1.4.11). Las flores van también a 4,5:1 por si acaso.
const GRAFICOS = ['flor-rosa', 'flor-morada', 'borde-control'];

describe('contraste', () => {
  it('calcula bien los extremos', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21);
    expect(contraste('#777777', '#777777')).toBe(1);
  });

  it('lee la paleta de estilos.css', () => {
    for (const nombre of [...FONDOS, ...TEXTO, ...GRAFICOS, 'sobre-acento', 'acento-oscuro']) expect(colores[nombre], nombre).toMatch(/^#/);
  });

  for (const texto of TEXTO) {
    for (const fondo of FONDOS) {
      it(`${texto} sobre ${fondo}: 4,5:1 o más`, () => {
        expect(contraste(colores[texto], colores[fondo])).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  for (const grafico of GRAFICOS) {
    for (const fondo of FONDOS) {
      it(`${grafico} sobre ${fondo}: 3:1 o más`, () => {
        expect(contraste(colores[grafico], colores[fondo])).toBeGreaterThanOrEqual(3);
      });
    }
  }

  it('texto de los botones principales: 4,5:1 o más, también al pasar el ratón', () => {
    expect(contraste(colores['sobre-acento'], colores['acento'])).toBeGreaterThanOrEqual(4.5);
    expect(contraste(colores['sobre-acento'], colores['acento-oscuro'])).toBeGreaterThanOrEqual(4.5);
  });

  it('el foco (borde de acento) se ve sobre los fondos: 3:1 o más', () => {
    for (const fondo of FONDOS) expect(contraste(colores['acento'], colores[fondo]), fondo).toBeGreaterThanOrEqual(3);
  });
});
