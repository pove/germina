// Rutas de las semillas a partir del índice (`contenido/indice.json`): qué pedir y qué guardar sin conexión.

/** Clave del índice → huella de la semilla: `{ '2/matematicas/3/s07': 'a1b2c3d4e5' }`. */
export type Indice = Readonly<Record<string, string>>;

const CLAVE = /^(\d)\/([a-z-]+)\/(\d)\/([sv])(\d\d)$/;

/**
 * Ruta de una semilla relativa a la base del sitio, con su huella como versión:
 * `2/matematicas/3/s07` → `contenido/ciclo-2/matematicas/3/semana-07.json?v=…`. `null` si la clave no es válida.
 */
export function rutaSemilla(clave: string, huella: string): string | null {
  const m = CLAVE.exec(clave);
  if (!m) return null;
  const [, ciclo, area, curso, tipo, n] = m;
  return `contenido/ciclo-${ciclo}/${area}/${curso}/${tipo === 's' ? 'semana' : 'verano'}-${n}.json?v=${encodeURIComponent(huella)}`;
}

/** Las rutas de todas las semillas publicadas de esos cursos (claves `ciclo/area/curso`), en el orden del índice. */
export function rutasDeCursos(indice: Indice, cursos: readonly string[]): string[] {
  const prefijos = cursos.map((c) => `${c}/`);
  return Object.entries(indice)
    .filter(([clave]) => prefijos.some((p) => clave.startsWith(p)))
    .map(([clave, huella]) => rutaSemilla(clave, huella))
    .filter((ruta): ruta is string => ruta !== null);
}
