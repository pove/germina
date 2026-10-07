import { describe, expect, it } from 'vitest';
import catalogoJson from '../../config/catalogo.json';
import { datosVacios } from './almacen';
import { aplicarCambio, hayCambioDeAno, pendientes } from './cambio-de-curso';
import { cursoSiguiente, cursosActivos, esCursoActivo, nombreDeArea, type Catalogo } from './catalogo';
import type { Datos } from './tipos';

const catalogo = catalogoJson as Catalogo;
const c3 = { ciclo: 2, area: 'matematicas', curso: 3 };
const c4 = { ciclo: 2, area: 'matematicas', curso: 4 };
const datos = (cursos: string[], activo: string | null, ano: number | null): Datos => ({ ...datosVacios(), cursos, cursoActivo: activo, ultimoAnoCurso: ano });

describe('catálogo', () => {
  it('solo está activo el 2.º ciclo de Matemáticas: 3.º y 4.º', () => {
    expect(cursosActivos(catalogo)).toEqual([c3, c4]);
    expect(esCursoActivo(c3, catalogo)).toBe(true);
    expect(esCursoActivo({ ciclo: 1, area: 'matematicas', curso: 1 }, catalogo)).toBe(false);
    expect(esCursoActivo({ ciclo: 2, area: 'lectura', curso: 3 }, catalogo)).toBe(false);
    expect(esCursoActivo({ ciclo: 2, area: 'matematicas', curso: 5 }, catalogo)).toBe(false);
  });

  it('nombres de área', () => {
    expect(nombreDeArea('matematicas', 'ar', catalogo)).toBe('الرياضيات');
    expect(nombreDeArea('matematicas', 'en', catalogo)).toBe('Maths');
    expect(nombreDeArea('desconocida', 'es', catalogo)).toBe('desconocida');
  });

  it('el curso siguiente existe dentro del ciclo', () => {
    expect(cursoSiguiente(c3, catalogo)).toEqual(c4);
    expect(cursoSiguiente(c4, catalogo)).toBeNull();
    expect(cursoSiguiente({ ciclo: 9, area: 'matematicas', curso: 3 }, catalogo)).toBeNull();
  });
});

describe('cambio de año de curso', () => {
  it('solo pregunta cuando el año de curso es posterior al último', () => {
    expect(hayCambioDeAno(datos(['2/matematicas/3'], '2/matematicas/3', 2026), 2027)).toBe(true);
    expect(hayCambioDeAno(datos(['2/matematicas/3'], '2/matematicas/3', 2026), 2026)).toBe(false);
    expect(hayCambioDeAno(datos(['2/matematicas/3'], '2/matematicas/3', null), 2027)).toBe(false);
    expect(hayCambioDeAno(datos([], null, 2026), 2027)).toBe(false);
  });

  it('una pregunta por curso guardado, con su siguiente', () => {
    expect(pendientes(datos(['2/matematicas/3', '2/matematicas/4', 'basura'], null, 2026), catalogo)).toEqual([
      { curso: c3, siguiente: c4 },
      { curso: c4, siguiente: null },
    ]);
  });

  it('3.º pasa a 4.º y el curso activo lo sigue', () => {
    const d = datos(['2/matematicas/3'], '2/matematicas/3', 2026);
    const r = aplicarCambio(d, pendientes(d, catalogo), new Set(['2/matematicas/3']), 2027);
    expect(r.cursos).toEqual(['2/matematicas/4']);
    expect(r.cursoActivo).toBe('2/matematicas/4');
    expect(r.ultimoAnoCurso).toBe(2027);
  });

  it('3.º que no pasa se queda como estaba', () => {
    const d = datos(['2/matematicas/3'], '2/matematicas/3', 2026);
    const r = aplicarCambio(d, pendientes(d, catalogo), new Set(), 2027);
    expect(r.cursos).toEqual(['2/matematicas/3']);
    expect(r.cursoActivo).toBe('2/matematicas/3');
  });

  it('4.º termina el ciclo: sale de los cursos y no queda curso activo', () => {
    const d = datos(['2/matematicas/4'], '2/matematicas/4', 2026);
    const r = aplicarCambio(d, pendientes(d, catalogo), new Set(), 2027);
    expect(r.cursos).toEqual([]);
    expect(r.cursoActivo).toBeNull();
    expect(r.ultimoAnoCurso).toBe(2027);
  });

  it('hermanos: 3.º pasa a 4.º y 4.º termina; no se repite el 4.º', () => {
    const d = datos(['2/matematicas/3', '2/matematicas/4'], '2/matematicas/4', 2026);
    const r = aplicarCambio(d, pendientes(d, catalogo), new Set(['2/matematicas/3']), 2027);
    expect(r.cursos).toEqual(['2/matematicas/4']);
    expect(r.cursoActivo).toBe('2/matematicas/4');
  });

  it('hermanos: si el activo era el 3.º que pasa, sigue activo (ahora 4.º)', () => {
    const d = datos(['2/matematicas/3', '2/matematicas/4'], '2/matematicas/3', 2026);
    const r = aplicarCambio(d, pendientes(d, catalogo), new Set(['2/matematicas/3']), 2027);
    expect(r.cursoActivo).toBe('2/matematicas/4');
  });

  it('el progreso del año anterior se conserva', () => {
    const d: Datos = { ...datos(['2/matematicas/3'], '2/matematicas/3', 2026), progreso: { '2026/2/matematicas/3': { s01: { hecho: ['reto'] } } } };
    const r = aplicarCambio(d, pendientes(d, catalogo), new Set(['2/matematicas/3']), 2027);
    expect(r.progreso).toEqual(d.progreso);
  });
});
