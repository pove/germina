// Cambio de curso en septiembre (especificación, 4.2): una pregunta por cada curso guardado.
import { cursoSiguiente, type Catalogo } from './catalogo';
import { claveCurso, leerClaveCurso, type Curso, type Datos } from './tipos';

export interface Pendiente {
  curso: Curso;
  /** El curso al que podría haber pasado, o `null` si era el último del ciclo (el ciclo ha terminado). */
  siguiente: Curso | null;
}

/** ¿Hay que preguntar? Solo cuando se abre la web en un año de curso posterior al último en que se usó. */
export function hayCambioDeAno(datos: Datos, anoCurso: number): boolean {
  return datos.cursos.length > 0 && datos.ultimoAnoCurso !== null && anoCurso > datos.ultimoAnoCurso;
}

/** Los cursos guardados sobre los que preguntar, en su orden. */
export function pendientes(datos: Datos, catalogo: Catalogo): Pendiente[] {
  return datos.cursos.flatMap((clave) => {
    const curso = leerClaveCurso(clave);
    return curso ? [{ curso, siguiente: cursoSiguiente(curso, catalogo) }] : [];
  });
}

/**
 * Aplica las respuestas: `pasaron` son los cursos (por clave) que han pasado al siguiente.
 * Los que no pasan se quedan como estaban; los del último curso del ciclo dejan de estar activos.
 * El progreso de años anteriores no se toca.
 */
export function aplicarCambio(datos: Datos, lista: Pendiente[], pasaron: ReadonlySet<string>, anoCurso: number): Datos {
  const cursos: string[] = [];
  let activo: string | null = null;
  for (const { curso, siguiente } of lista) {
    const clave = claveCurso(curso);
    let nueva: string | null = clave;
    if (siguiente === null) nueva = null;
    else if (pasaron.has(clave)) nueva = claveCurso(siguiente);
    if (nueva && !cursos.includes(nueva)) cursos.push(nueva);
    if (clave === datos.cursoActivo) activo = nueva;
  }
  return { ...datos, cursos, cursoActivo: activo && cursos.includes(activo) ? activo : (cursos[0] ?? null), ultimoAnoCurso: anoCurso };
}
