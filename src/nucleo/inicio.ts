// A dónde lleva `#/`: la semana actual del curso activo (o el primer reto de verano), o la bienvenida.
import type { Situacion } from './calendario';
import type { Ruta } from './rutas';
import { leerClaveCurso, type Curso, type Datos } from './tipos';

/** La semana de hoy (o el primer reto de verano) de un curso. */
export function rutaDeSituacion(curso: Curso, situacion: Situacion): Ruta {
  return situacion.tipo === 'curso' ? { tipo: 'semana', ...curso, n: situacion.semana } : { tipo: 'verano', ...curso, n: 1 };
}

export function destinoInicio(datos: Datos, situacion: Situacion): Ruta {
  const curso = leerClaveCurso(datos.cursoActivo ?? datos.cursos[0]);
  return curso ? rutaDeSituacion(curso, situacion) : { tipo: 'bienvenida' };
}
