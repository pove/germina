import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { indiceDeSemillas } from '../lib/indice.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const temporales = [];
afterAll(() => temporales.forEach((t) => rmSync(t, { recursive: true, force: true })));

describe('indiceDeSemillas', () => {
  it('lista la semilla de ejemplo', () => {
    expect(indiceDeSemillas(RAIZ).semillas).toContain('2/matematicas/3/s07');
  });

  it('semanas y veranos, ordenados, y nada más', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'germina-'));
    temporales.push(raiz);
    const curso = (c, ...archivos) => {
      mkdirSync(join(raiz, 'contenido/ciclo-2/matematicas', c), { recursive: true });
      for (const a of archivos) writeFileSync(join(raiz, 'contenido/ciclo-2/matematicas', c, a), '{}');
    };
    curso('4', 'verano-02.json', 'semana-10.json', 'notas.txt', 'semana-7.json');
    curso('3', 'semana-01.json');
    mkdirSync(join(raiz, 'contenido/comun'), { recursive: true });
    writeFileSync(join(raiz, 'contenido/ciclo-2/matematicas/mapa-semanas.json'), '{}');
    expect(indiceDeSemillas(raiz)).toEqual({ version: 1, semillas: ['2/matematicas/3/s01', '2/matematicas/4/s10', '2/matematicas/4/v02'] });
  });

  it('sin carpeta de contenido, vacío', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'germina-'));
    temporales.push(raiz);
    expect(indiceDeSemillas(raiz)).toEqual({ version: 1, semillas: [] });
  });
});
