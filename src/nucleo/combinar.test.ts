import { describe, expect, it } from 'vitest';
import { combinar } from './combinar';
import { datosVacios } from './almacen';
import { codigoDeDatos, decodificar, type Recibido } from './enlace';
import type { Datos } from './tipos';

const mio: Datos = {
  v: 1,
  idioma: 'va',
  cursos: ['2/matematicas/3'],
  cursoActivo: '2/matematicas/3',
  ultimoAnoCurso: 2026,
  progreso: {
    '2026/2/matematicas/3': { s07: { hecho: ['p1'], record: 10 }, s08: { hecho: ['reto'] } },
  },
};

const recibido: Recibido = {
  cursos: ['2/matematicas/4', '2/matematicas/3'],
  progreso: {
    '2026/2/matematicas/3': { s07: { hecho: ['reto', 'p2'], record: 14 }, s09: { hecho: ['p5'] } },
    '2026/2/matematicas/4': { s01: { hecho: ['reto'] } },
  },
};

describe('combinar', () => {
  it('suma las casillas, se queda con el mejor récord y añade lo nuevo', () => {
    const r = combinar(mio, recibido);
    expect(r.progreso).toEqual({
      '2026/2/matematicas/3': {
        s07: { hecho: ['reto', 'p1', 'p2'], record: 14 },
        s08: { hecho: ['reto'] },
        s09: { hecho: ['p5'] },
      },
      '2026/2/matematicas/4': { s01: { hecho: ['reto'] } },
    });
  });

  it('el récord propio mayor se conserva', () => {
    const r = combinar({ ...mio, progreso: { '2026/2/matematicas/3': { s07: { hecho: [], record: 20 } } } }, recibido);
    expect(r.progreso['2026/2/matematicas/3']!.s07).toEqual({ hecho: ['reto', 'p2'], record: 20 });
  });

  it('un récord solo en un lado se queda, y sin récord en ninguno no aparece', () => {
    const r = combinar(
      { ...mio, progreso: { '2026/2/matematicas/3': { s01: { hecho: ['reto'] } } } },
      { cursos: [], progreso: { '2026/2/matematicas/3': { s01: { hecho: ['p1'], record: 0 }, s02: { hecho: ['p1'] } } } },
    );
    expect(r.progreso['2026/2/matematicas/3']).toEqual({ s01: { hecho: ['reto', 'p1'], record: 0 }, s02: { hecho: ['p1'] } });
  });

  it('añade los cursos nuevos sin repetir y sin cambiar el orden de los propios', () => {
    expect(combinar(mio, recibido).cursos).toEqual(['2/matematicas/3', '2/matematicas/4']);
  });

  it('el idioma, el curso activo y el año de curso del móvil que recibe no cambian', () => {
    const r = combinar(mio, recibido);
    expect(r.idioma).toBe('va');
    expect(r.cursoActivo).toBe('2/matematicas/3');
    expect(r.ultimoAnoCurso).toBe(2026);
  });

  it('no modifica los datos de entrada', () => {
    const copiaMio = structuredClone(mio);
    const copiaRecibido = structuredClone(recibido);
    combinar(mio, recibido);
    expect(mio).toEqual(copiaMio);
    expect(recibido).toEqual(copiaRecibido);
  });

  it('lo que se desmarcó en un móvil no se desmarca en el otro', () => {
    const sinNada: Datos = { ...mio, progreso: {} };
    expect(combinar(sinNada, recibido).progreso['2026/2/matematicas/3']!.s07!.hecho).toEqual(['reto', 'p2']);
    expect(combinar(mio, { cursos: [], progreso: {} }).progreso).toEqual(mio.progreso);
  });

  it('combinar es conmutativo en lo marcado y es idempotente', () => {
    const otro: Datos = { ...datosVacios(), cursos: recibido.cursos, progreso: recibido.progreso };
    const ab = combinar(mio, { cursos: otro.cursos, progreso: otro.progreso });
    const ba = combinar(otro, { cursos: mio.cursos, progreso: mio.progreso });
    expect(ab.progreso).toEqual(ba.progreso);
    expect(combinar(ab, { cursos: otro.cursos, progreso: otro.progreso })).toEqual(ab);
  });

  it('de punta a punta: un móvil genera el código y otro lo recibe', () => {
    const r = decodificar(codigoDeDatos({ ...mio, cursos: ['2/matematicas/3', '2/matematicas/4'] }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const nuevo = combinar({ ...datosVacios(), idioma: 'ar' }, r.recibido);
    expect(nuevo.idioma).toBe('ar');
    expect(nuevo.cursos).toEqual(['2/matematicas/3', '2/matematicas/4']);
    expect(nuevo.progreso['2026/2/matematicas/3']!.s07).toEqual({ hecho: ['p1'], record: 10 });
  });
});
