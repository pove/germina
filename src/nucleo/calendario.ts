// Calendario del curso (especificación, 4.2). Todo con año, mes y día, sin horas,
// para que el cambio de horario de verano no mueva ninguna semana.
import { SEMANAS } from './tipos';

/** Fecha local de calendario. `m` va de 1 a 12. */
export interface Fecha {
  a: number;
  m: number;
  d: number;
}

export interface ConfigCurso {
  readonly semanas: number;
  readonly trimestres: readonly { readonly trimestre: number; readonly desde: number; readonly hasta: number }[];
}

/** Igual que `config/curso.json` (lo comprueba un test). */
export const CURSO_POR_DEFECTO: ConfigCurso = {
  semanas: SEMANAS,
  trimestres: [
    { trimestre: 1, desde: 1, hasta: 15 },
    { trimestre: 2, desde: 16, hasta: 28 },
    { trimestre: 3, desde: 29, hasta: 41 },
  ],
};

export type Situacion =
  | { tipo: 'curso'; anoCurso: number; semana: number; trimestre: number }
  | { tipo: 'verano'; anoCurso: number };

export type Hoy = { tipo: 'pregunta'; n: number } | { tipo: 'finde' };

const MS_DIA = 86_400_000;

/** Fecha de un `Date` según la hora local del dispositivo. */
export const fechaDeDate = (d: Date): Fecha => ({ a: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() });

/** Días desde 1970-01-01, contados en UTC para no sufrir cambios de hora. */
const aDias = (f: Fecha): number => Math.round(Date.UTC(f.a, f.m - 1, f.d) / MS_DIA);

const deDias = (n: number): Fecha => {
  const d = new Date(n * MS_DIA);
  return { a: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
};

/** 0 = lunes … 6 = domingo. */
export const diaDeLaSemana = (f: Fecha): number => (new Date(aDias(f) * MS_DIA).getUTCDay() + 6) % 7;

export const lunesDe = (f: Fecha): Fecha => deDias(aDias(f) - diaDeLaSemana(f));

export const mismaFecha = (x: Fecha, y: Fecha): boolean => x.a === y.a && x.m === y.m && x.d === y.d;

/**
 * Lunes de la semana 1 del año de curso que empieza en `ano`: el primer lunes de septiembre,
 * que es donde empieza la primera semana (de lunes a domingo) entera dentro de septiembre.
 * Es una regla, no una fecha: no depende de ningún año ni día concreto.
 */
export function inicioDelCurso(ano: number): Fecha {
  const primero: Fecha = { a: ano, m: 9, d: 1 };
  return deDias(aDias(primero) + ((7 - diaDeLaSemana(primero)) % 7));
}

/** El año del primer lunes de septiembre más reciente, es decir, de la semana 1 que ya ha empezado. */
export function anoDeCurso(f: Fecha): number {
  return aDias(f) >= aDias(inicioDelCurso(f.a)) ? f.a : f.a - 1;
}

/** Trimestre (1 a 3) de una semana del curso, o `null` si no es del curso. */
export function trimestreDe(semana: number, config: ConfigCurso = CURSO_POR_DEFECTO): number | null {
  return config.trimestres.find((t) => semana >= t.desde && semana <= t.hasta)?.trimestre ?? null;
}

/** Dónde cae una fecha: una semana del curso (1 a 41) o el verano. */
export function situacion(f: Fecha, config: ConfigCurso = CURSO_POR_DEFECTO): Situacion {
  const anoCurso = anoDeCurso(f);
  const semana = Math.floor((aDias(f) - aDias(inicioDelCurso(anoCurso))) / 7) + 1;
  const trimestre = trimestreDe(semana, config);
  return semana <= config.semanas && trimestre !== null ? { tipo: 'curso', anoCurso, semana, trimestre } : { tipo: 'verano', anoCurso };
}

/** Lunes de la semana `n` (1 a 41) del año de curso dado. */
export function lunesDeSemana(anoCurso: number, n: number): Fecha {
  return deDias(aDias(inicioDelCurso(anoCurso)) + (n - 1) * 7);
}

/** Pregunta de hoy: lunes = 1 … viernes = 5; sábado y domingo no hay. */
export function hoy(f: Fecha): Hoy {
  const dia = diaDeLaSemana(f);
  return dia < 5 ? { tipo: 'pregunta', n: dia + 1 } : { tipo: 'finde' };
}
