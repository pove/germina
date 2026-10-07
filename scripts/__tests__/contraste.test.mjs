import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { coloresDeRaiz, contraste } from '../lib/contraste.mjs';

const colores = coloresDeRaiz(readFileSync(new URL('../../src/estilos.css', import.meta.url), 'utf8'));

const FONDOS = [
  'fondo', 'tarjeta', 'acento-suave', 'acento-hover', 'hierba-suave', 'reto-suave', 'pregunta-suave', 'sol-suave', 'tierra-suave',
  'flor-suave', 'gris-suave',
];

// Texto: 4,5:1 sobre cualquier fondo de la paleta.
const TEXTO = ['texto', 'texto-suave', 'acento', 'acento-oscuro', 'reto', 'pregunta', 'sol', 'flor', 'tierra'];
// Dibujos que dicen algo (las plantas del jardín), bordes de los controles y foco: 3:1 (1.4.11). El foco va separado
// 3 px del control (outline-offset), así que lo que tiene al lado es siempre un fondo, nunca el relleno del botón.
const GRAFICOS = ['flor-rosa', 'flor-morada', 'borde-control', 'foco'];

describe('contraste', () => {
  it('calcula bien los extremos', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21);
    expect(contraste('#777777', '#777777')).toBe(1);
  });

  it('lee la paleta de estilos.css', () => {
    for (const nombre of [...FONDOS, ...TEXTO, ...GRAFICOS, 'sobre-acento']) expect(colores[nombre], nombre).toMatch(/^#/);
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

  it('texto blanco sobre los rellenos (botón principal, pestaña actual, número de hoy, número de paso): 4,5:1 o más', () => {
    for (const relleno of ['acento', 'acento-oscuro', 'pregunta', 'reto']) {
      expect(contraste(colores['sobre-acento'], colores[relleno]), relleno).toBeGreaterThanOrEqual(4.5);
    }
  });

});
