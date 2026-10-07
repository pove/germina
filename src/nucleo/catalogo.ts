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

/** El curso siguiente dentro del mismo ciclo y área, si existe (3.º → 4.º). */
export function cursoSiguiente(curso: Curso, catalogo: Catalogo): Curso | null {
  const ciclo = catalogo.ciclos.find((c) => c.ciclo === curso.ciclo);
  if (!ciclo?.cursos.includes(curso.curso + 1)) return null;
  return { ...curso, curso: curso.curso + 1 };
}
