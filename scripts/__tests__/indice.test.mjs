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
    expect(Object.keys(indiceDeSemillas(RAIZ).semillas)).toContain('2/matematicas/3/s07');
    expect(Object.keys(indiceDeSemillas(RAIZ).semillas)).toContain('1/matematicas/1/s01');
  });

  it('semanas y veranos, ordenados, con su huella, y nada más', () => {
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
    const { version, semillas } = indiceDeSemillas(raiz);
    expect(version).toBe(2);
    expect(Object.keys(semillas)).toEqual(['2/matematicas/3/s01', '2/matematicas/4/s10', '2/matematicas/4/v02']);
    for (const h of Object.values(semillas)) expect(h).toMatch(/^[0-9a-f]{10}$/);
  });

  it('la huella cambia cuando cambia la semilla', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'germina-'));
    temporales.push(raiz);
    const dir = join(raiz, 'contenido/ciclo-1/matematicas/1');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'semana-01.json'), '{"a":1}');
    const antes = indiceDeSemillas(raiz).semillas['1/matematicas/1/s01'];
    writeFileSync(join(dir, 'semana-01.json'), '{"a":2}');
    expect(indiceDeSemillas(raiz).semillas['1/matematicas/1/s01']).not.toBe(antes);
  });

  it('sin carpeta de contenido, vacío', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'germina-'));
    temporales.push(raiz);
    expect(indiceDeSemillas(raiz)).toEqual({ version: 2, semillas: {} });
  });
});
