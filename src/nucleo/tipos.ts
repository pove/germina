// Tipos y pequeñas funciones comunes del núcleo (especificación, 3 y 6.1).

export const IDIOMAS = ['es', 'va', 'en', 'fr', 'ar'] as const;
export type Idioma = (typeof IDIOMAS)[number];

/** Casillas que se pueden marcar en una semilla, en su orden fijo. */
export const ELEMENTOS = ['reto', 'p1', 'p2', 'p3', 'p4', 'p5'] as const;
export type Elemento = (typeof ELEMENTOS)[number];

export const SEMANAS = 41;
export const VERANOS = 10;

/** Un curso concreto: ciclo, área y curso (`2/matematicas/3`). */
export interface Curso {
  ciclo: number;
  area: string;
  curso: number;
}

/** Lo marcado en una semilla. */
export interface Semilla {
  hecho: Elemento[];
  record?: number;
}

/** Contenido de `localStorage` (formato versión 1). */
export interface Datos {
  v: 1;
  idioma: Idioma | null;
  cursos: string[];
  cursoActivo: string | null;
  ultimoAnoCurso: number | null;
  /** `{año}/{curso}` → `sNN` o `vNN` → lo marcado. */
  progreso: Record<string, Record<string, Semilla>>;
}

export const claveCurso = (c: Curso): string => `${c.ciclo}/${c.area}/${c.curso}`;

export function leerClaveCurso(texto: unknown): Curso | null {
  if (typeof texto !== 'string') return null;
  const m = /^([1-3])\/([a-z]+(?:-[a-z]+)*)\/([1-6])$/.exec(texto);
  return m ? { ciclo: Number(m[1]), area: m[2]!, curso: Number(m[3]) } : null;
}

const dos = (n: number): string => String(n).padStart(2, '0');

export const claveSemana = (n: number): string => `s${dos(n)}`;
export const claveVerano = (n: number): string => `v${dos(n)}`;

/** `s07` → semana 7; `v03` → verano 3. */
export function leerClaveSemilla(clave: unknown): { verano: boolean; n: number } | null {
  if (typeof clave !== 'string') return null;
  const m = /^([sv])(\d\d)$/.exec(clave);
  if (!m) return null;
  const n = Number(m[2]);
  const verano = m[1] === 'v';
  if (n < 1 || n > (verano ? VERANOS : SEMANAS)) return null;
  return { verano, n };
}

export const esElemento = (x: unknown): x is Elemento => typeof x === 'string' && (ELEMENTOS as readonly string[]).includes(x);

/** Deja los elementos sin repetir y en el orden fijo. */
export const ordenarElementos = (hechos: Iterable<Elemento>): Elemento[] => {
  const s = new Set(hechos);
  return ELEMENTOS.filter((e) => s.has(e));
};
