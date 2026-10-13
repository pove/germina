// Ciclos y áreas activos (config/catalogo.json).
import type { Curso, Idioma } from './tipos';

export interface Catalogo {
  areas: { id: string; codigo: number; nombre: Record<Idioma, string> }[];
  ciclos: { ciclo: number; cursos: number[]; areasActivas: string[] }[];
}

/** Todos los cursos que hoy se pueden elegir (ciclo × área activa × curso). */
export function cursosActivos(catalogo: Catalogo): Curso[] {
  return catalogo.ciclos.flatMap((c) => c.areasActivas.flatMap((area) => c.cursos.map((curso) => ({ ciclo: c.ciclo, area, curso }))));
}

export function esCursoActivo(curso: Curso, catalogo: Catalogo): boolean {
  return cursosActivos(catalogo).some((c) => c.ciclo === curso.ciclo && c.area === curso.area && c.curso === curso.curso);
}

export function nombreDeArea(area: string, idioma: Idioma, catalogo: Catalogo): string {
  const a = catalogo.areas.find((x) => x.id === area);
  return a ? a.nombre[idioma] || a.nombre.es : area;
}

/**
 * El curso siguiente en la misma área, si está en Germina: dentro del ciclo (1.º → 2.º)
 * o en el ciclo siguiente si el área está activa en él (2.º → 3.º). Después de 4.º, hoy, `null`.
 */
export function cursoSiguiente(curso: Curso, catalogo: Catalogo): Curso | null {
  if (!catalogo.ciclos.some((c) => c.ciclo === curso.ciclo && c.cursos.includes(curso.curso))) return null;
  const destino = catalogo.ciclos.find((c) => c.cursos.includes(curso.curso + 1) && c.areasActivas.includes(curso.area));
  return destino ? { ciclo: destino.ciclo, area: curso.area, curso: curso.curso + 1 } : null;
}
