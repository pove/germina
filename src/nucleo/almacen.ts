// Lo que se guarda en el dispositivo (especificación, 6.1). Tolera basura y la ausencia de `localStorage`.
import {
  IDIOMAS, esElemento, leerClaveCurso, leerClaveSemilla, ordenarElementos,
  type Curso, type Datos, type Elemento, type Idioma, type Semilla,
} from './tipos';
import { claveCurso } from './tipos';

export const CLAVE = 'germina';
export const VERSION = 1;
export const RECORD_MAXIMO = 255;

/** Lo mínimo que usamos de `localStorage`, para poder probarlo con uno falso. */
export interface Almacenamiento {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
  removeItem(clave: string): void;
}

export type EstadoLectura = 'ok' | 'vacio' | 'ilegible' | 'noDisponible';

export interface Lectura {
  datos: Datos;
  estado: EstadoLectura;
}

export const datosVacios = (): Datos => ({ v: 1, idioma: null, cursos: [], cursoActivo: null, ultimoAnoCurso: null, progreso: {} });

/** `localStorage` si existe y se puede usar; `null` en navegación privada o sin él. */
export function almacenDelNavegador(): Almacenamiento | null {
  try {
    const a = globalThis.localStorage;
    if (!a) return null;
    const prueba = `${CLAVE}:prueba`;
    a.setItem(prueba, '1');
    a.removeItem(prueba);
    return a;
  } catch {
    return null;
  }
}

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const esEnteroEn = (x: unknown, min: number, max: number): x is number => typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max;

/** Convierte el formato de una versión anterior al actual. Hoy solo existe la versión 1. */
export function migrar(bruto: unknown): unknown {
  return bruto;
}

function sanearSemillas(bruto: unknown): Record<string, Semilla> {
  const salida: Record<string, Semilla> = {};
  if (!esObjeto(bruto)) return salida;
  for (const [clave, valor] of Object.entries(bruto)) {
    if (!leerClaveSemilla(clave) || !esObjeto(valor)) continue;
    const hecho = Array.isArray(valor.hecho) ? ordenarElementos(valor.hecho.filter(esElemento)) : [];
    const semilla: Semilla = { hecho };
    if (esEnteroEn(valor.record, 0, RECORD_MAXIMO)) semilla.record = valor.record;
    if (hecho.length > 0 || semilla.record !== undefined) salida[clave] = semilla;
  }
  return salida;
}

/** Deja solo lo que encaja con el formato; lo demás se ignora sin romper nada. */
export function sanear(bruto: unknown): Datos | null {
  const migrado = migrar(bruto);
  if (!esObjeto(migrado) || migrado.v !== VERSION) return null;
  const datos = datosVacios();
  if (typeof migrado.idioma === 'string' && (IDIOMAS as readonly string[]).includes(migrado.idioma)) datos.idioma = migrado.idioma as Idioma;
  if (Array.isArray(migrado.cursos)) {
    datos.cursos = [...new Set(migrado.cursos.filter((c): c is string => leerClaveCurso(c) !== null))];
  }
  const activo = migrado.cursoActivo;
  datos.cursoActivo = typeof activo === 'string' && datos.cursos.includes(activo) ? activo : (datos.cursos[0] ?? null);
  if (esEnteroEn(migrado.ultimoAnoCurso, 2000, 2255)) datos.ultimoAnoCurso = migrado.ultimoAnoCurso;
  if (esObjeto(migrado.progreso)) {
    for (const [clave, semillas] of Object.entries(migrado.progreso)) {
      const m = /^(\d{4})\/(.+)$/.exec(clave);
      if (!m || !esEnteroEn(Number(m[1]), 2000, 2255) || leerClaveCurso(m[2]) === null) continue;
      const limpias = sanearSemillas(semillas);
      if (Object.keys(limpias).length > 0) datos.progreso[clave] = limpias;
    }
  }
  return datos;
}

/** Lee lo guardado. Nunca lanza: si algo falla devuelve datos vacíos y dice por qué. */
export function leer(almacen: Almacenamiento | null): Lectura {
  if (!almacen) return { datos: datosVacios(), estado: 'noDisponible' };
  let texto: string | null;
  try {
    texto = almacen.getItem(CLAVE);
  } catch {
    return { datos: datosVacios(), estado: 'noDisponible' };
  }
  if (texto === null) return { datos: datosVacios(), estado: 'vacio' };
  try {
    const datos = sanear(JSON.parse(texto));
    if (datos) return { datos, estado: 'ok' };
  } catch {
    // JSON roto: se trata como ilegible
  }
  return { datos: datosVacios(), estado: 'ilegible' };
}

/** Guarda. Devuelve `false` si no se pudo (sin espacio, navegación privada…). */
export function escribir(almacen: Almacenamiento | null, datos: Datos): boolean {
  if (!almacen) return false;
  try {
    almacen.setItem(CLAVE, JSON.stringify(datos));
    return true;
  } catch {
    return false;
  }
}

/** «Empezar de cero». */
export function borrar(almacen: Almacenamiento | null): boolean {
  if (!almacen) return false;
  try {
    almacen.removeItem(CLAVE);
    return true;
  } catch {
    return false;
  }
}

export const claveProgreso = (ano: number, curso: Curso): string => `${ano}/${claveCurso(curso)}`;

/** Marca o desmarca una casilla. No toca el original. */
export function conElemento(datos: Datos, ano: number, curso: Curso, claveSemilla: string, elemento: Elemento, marcado = true): Datos {
  const clave = claveProgreso(ano, curso);
  const antes = datos.progreso[clave]?.[claveSemilla];
  const hecho = new Set(antes?.hecho ?? []);
  if (marcado) hecho.add(elemento);
  else hecho.delete(elemento);
  return conSemilla(datos, clave, claveSemilla, { ...antes, hecho: ordenarElementos(hecho) });
}

/** Apunta el récord de una semilla (entero de 0 a 255). */
export function conRecord(datos: Datos, ano: number, curso: Curso, claveSemilla: string, record: number): Datos {
  if (!esEnteroEn(record, 0, RECORD_MAXIMO)) throw new RangeError(`El récord debe ser un entero de 0 a ${RECORD_MAXIMO}`);
  const clave = claveProgreso(ano, curso);
  const antes = datos.progreso[clave]?.[claveSemilla];
  return conSemilla(datos, clave, claveSemilla, { hecho: antes?.hecho ?? [], record });
}

function conSemilla(datos: Datos, clave: string, claveSemilla: string, semilla: Semilla): Datos {
  const semillas = { ...datos.progreso[clave] };
  if (semilla.hecho.length === 0 && semilla.record === undefined) delete semillas[claveSemilla];
  else semillas[claveSemilla] = semilla;
  const progreso = { ...datos.progreso, [clave]: semillas };
  if (Object.keys(semillas).length === 0) delete progreso[clave];
  return { ...datos, progreso };
}
