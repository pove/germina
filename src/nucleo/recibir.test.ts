import { describe, expect, it } from 'vitest';
import catalogoJson from '../../config/catalogo.json';
import { datosVacios } from './almacen';
import type { Catalogo } from './catalogo';
import type { Recibido } from './enlace';
import { aplicarRecibido, estaVacio, recordsDe, soloActivos } from './recibir';
import type { Datos } from './tipos';

const catalogo = catalogoJson as Catalogo;
const c3 = { ciclo: 2, area: 'matematicas', curso: 3 };

describe('soloActivos', () => {
  it('quita los cursos y el progreso de lo que esta web no muestra', () => {
    const r: Recibido = {
      cursos: ['2/matematicas/3', '2/lectura/3', '1/matematicas/2'],
      progreso: {
        '2026/2/matematicas/3': { s01: { hecho: ['reto'] } },
        '2026/2/lectura/3': { s01: { hecho: ['reto'] } },
        '2026/1/matematicas/2': { s01: { hecho: ['reto'] } },
      },
    };
    expect(soloActivos(r, catalogo)).toEqual({ cursos: ['2/matematicas/3'], progreso: { '2026/2/matematicas/3': { s01: { hecho: ['reto'] } } } });
  });
});

describe('estaVacio', () => {
  it('sin cursos ni progreso', () => {
    expect(estaVacio({ cursos: [], progreso: {} })).toBe(true);
    expect(estaVacio({ cursos: ['2/matematicas/3'], progreso: {} })).toBe(false);
    expect(estaVacio({ cursos: [], progreso: { '2026/2/matematicas/3': { s01: { hecho: ['p1'] } } } })).toBe(false);
  });
});

describe('aplicarRecibido', () => {
  const recibido: Recibido = { cursos: ['2/matematicas/4'], progreso: { '2026/2/matematicas/4': { s01: { hecho: ['reto'], record: 5 } } } };

  it('suma, y no cambia el idioma ni el curso activo ni el año de curso de quien recibe', () => {
    const mio: Datos = { ...datosVacios(), idioma: 'ar', cursos: ['2/matematicas/3'], cursoActivo: '2/matematicas/3', ultimoAnoCurso: 2026 };
    const r = aplicarRecibido(mio, recibido, 2027);
    expect(r.cursos).toEqual(['2/matematicas/3', '2/matematicas/4']);
    expect(r.idioma).toBe('ar');
    expect(r.cursoActivo).toBe('2/matematicas/3');
    expect(r.ultimoAnoCurso).toBe(2026);
  });

  it('un móvil recién estrenado queda con curso activo y año de curso', () => {
    const r = aplicarRecibido(datosVacios(), recibido, 2027);
    expect(r.cursoActivo).toBe('2/matematicas/4');
    expect(r.ultimoAnoCurso).toBe(2027);
    expect(r.idioma).toBeNull();
  });

  it('si no trae ningún curso, no inventa nada', () => {
    const r = aplicarRecibido(datosVacios(), { cursos: [], progreso: {} }, 2027);
    expect(r.cursoActivo).toBeNull();
    expect(r.ultimoAnoCurso).toBeNull();
  });
});

describe('recordsDe', () => {
  it('el mejor de cada semilla en cualquier año, solo del curso pedido', () => {
    const d: Datos = {
      ...datosVacios(),
      progreso: {
        '2025/2/matematicas/3': { s13: { hecho: ['reto'], record: 9 }, v01: { hecho: [], record: 4 } },
        '2026/2/matematicas/3': { s13: { hecho: ['reto'], record: 14 }, s17: { hecho: ['p1'] } },
        '2026/2/matematicas/4': { s13: { hecho: ['reto'], record: 99 } },
      },
    };
    expect([...recordsDe(d, c3)]).toEqual([['s13', 14], ['v01', 4]]);
    expect(recordsDe(datosVacios(), c3).size).toBe(0);
  });
});
