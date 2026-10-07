import { describe, expect, it } from 'vitest';
import { datosVacios } from './almacen';
import { destinoInicio } from './inicio';
import type { Datos } from './tipos';

const con = (cursos: string[], activo: string | null): Datos => ({ ...datosVacios(), cursos, cursoActivo: activo });
const curso = { tipo: 'curso', anoCurso: 2026, semana: 7, trimestre: 1 } as const;
const verano = { tipo: 'verano', anoCurso: 2026 } as const;

describe('destinoInicio', () => {
  it('sin curso elegido, la bienvenida', () => {
    expect(destinoInicio(datosVacios(), curso)).toEqual({ tipo: 'bienvenida' });
    expect(destinoInicio(con(['basura'], 'basura'), curso)).toEqual({ tipo: 'bienvenida' });
  });

  it('la semana actual del curso activo', () => {
    expect(destinoInicio(con(['2/matematicas/3', '2/matematicas/4'], '2/matematicas/4'), curso)).toEqual({
      tipo: 'semana', ciclo: 2, area: 'matematicas', curso: 4, n: 7,
    });
  });

  it('si el activo no está, el primero guardado', () => {
    expect(destinoInicio(con(['2/matematicas/3'], null), curso)).toMatchObject({ tipo: 'semana', curso: 3 });
  });

  it('en verano, el primer reto de verano', () => {
    expect(destinoInicio(con(['2/matematicas/3'], '2/matematicas/3'), verano)).toEqual({
      tipo: 'verano', ciclo: 2, area: 'matematicas', curso: 3, n: 1,
    });
  });
});
