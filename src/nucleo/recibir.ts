// Recibir un jardín por enlace o código (especificación, 6.3 y 6.4).
import { combinar } from './combinar';
import { esCursoActivo, type Catalogo } from './catalogo';
import type { Recibido } from './enlace';
import { leerClaveCurso, type Datos } from './tipos';

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
