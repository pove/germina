// Recibir un jardín por enlace o código (especificación, 6.3 y 6.4) y la hoja de récords.
import { combinar } from './combinar';
import { esCursoActivo, type Catalogo } from './catalogo';
import type { Recibido } from './enlace';
import { claveCurso, leerClaveCurso, type Curso, type Datos } from './tipos';

/** Se queda solo con los cursos que esta versión de la web sabe mostrar. */
export function soloActivos(recibido: Recibido, catalogo: Catalogo): Recibido {
  const activo = (clave: string): boolean => {
    const c = leerClaveCurso(clave);
    return c !== null && esCursoActivo(c, catalogo);
  };
  const progreso: Recibido['progreso'] = {};
  for (const [clave, semillas] of Object.entries(recibido.progreso)) {
    if (activo(clave.replace(/^\d{4}\//, ''))) progreso[clave] = semillas;
  }
  return { cursos: recibido.cursos.filter(activo), progreso };
}

export const estaVacio = (recibido: Recibido): boolean => recibido.cursos.length === 0 && Object.keys(recibido.progreso).length === 0;

/**
 * Suma lo recibido a lo propio (6.4). El idioma y el curso activo de quien recibe no cambian;
 * solo si todavía no tenía ni curso activo ni año de curso (un móvil recién estrenado) se rellenan.
 */
export function aplicarRecibido(datos: Datos, recibido: Recibido, anoCurso: number): Datos {
  const unidos = combinar(datos, recibido);
  return {
    ...unidos,
    cursoActivo: unidos.cursoActivo ?? unidos.cursos[0] ?? null,
    ultimoAnoCurso: unidos.ultimoAnoCurso ?? (unidos.cursos.length > 0 ? anoCurso : null),
  };
}

/** El mejor récord de cada semilla de un curso, en cualquier año de curso. */
export function recordsDe(datos: Datos, curso: Curso): Map<string, number> {
  const records = new Map<string, number>();
  const sufijo = `/${claveCurso(curso)}`;
  for (const [clave, semillas] of Object.entries(datos.progreso)) {
    if (!clave.endsWith(sufijo)) continue;
    for (const [id, s] of Object.entries(semillas)) {
      if (s.record !== undefined) records.set(id, Math.max(records.get(id) ?? 0, s.record));
    }
  }
  return records;
}
