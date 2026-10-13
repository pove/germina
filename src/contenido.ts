// Carga del contenido con `fetch` relativo a la base. Todo se pide al propio sitio.
import { useEffect, useState } from 'preact/hooks';
import { huella } from './nucleo/huella';
import { rutaSemilla, type Indice } from './nucleo/semillas';
import { claveSemana, claveVerano, type Curso } from './nucleo/tipos';
import type { ComoAyudar, Mapa, Objetivos, SemillaContenido } from './nucleo/contenido';

const base = import.meta.env.BASE_URL;
const memoria = new Map<string, Promise<unknown>>();

function pedir<T>(ruta: string): Promise<T> {
  const guardada = memoria.get(ruta);
  if (guardada) return guardada as Promise<T>;
  const promesa = fetch(`${base}${ruta}`).then((r) => {
    if (!r.ok) throw new Error(`${r.status} ${ruta}`);
    return r.json() as Promise<T>;
  });
  memoria.set(ruta, promesa);
  promesa.catch(() => memoria.delete(ruta)); // para poder reintentar
  return promesa;
}

const carpeta = (c: Curso): string => `contenido/ciclo-${c.ciclo}/${c.area}`;

/** Las semillas que ya existen (`contenido/indice.json`), con su huella. */
export const cargarIndiceCompleto = (): Promise<Indice> => pedir<{ semillas: Indice }>('contenido/indice.json').then((i) => i.semillas);

/** Las claves de las semillas que ya existen. */
export const cargarIndice = (): Promise<ReadonlySet<string>> => cargarIndiceCompleto().then((s) => new Set(Object.keys(s)));

export const claveEnIndice = (curso: Curso, verano: boolean, n: number): string =>
  `${curso.ciclo}/${curso.area}/${curso.curso}/${verano ? claveVerano(n) : claveSemana(n)}`;

export interface SemillaCargada {
  semilla: SemillaContenido;
  /** Huella actual de los textos en español, para saber si una traducción revisada se ha quedado vieja. */
  huella: string | null;
}

/** La semilla, o `null` si todavía no existe («en camino»). */
export async function cargarSemilla(curso: Curso, verano: boolean, n: number): Promise<SemillaCargada | null> {
  const clave = claveEnIndice(curso, verano, n);
  const huellaArchivo = (await cargarIndiceCompleto())[clave];
  const ruta = huellaArchivo === undefined ? null : rutaSemilla(clave, huellaArchivo);
  if (!ruta) return null;
  // Con la huella en la ruta, la caché de semillas del service worker nunca da una versión vieja.
  const semilla = await pedir<SemillaContenido>(ruta);
  let h: string | null = null;
  try {
    h = await huella(semilla);
  } catch {
    // sin crypto.subtle (página no segura): no se compara la huella
  }
  return { semilla, huella: h };
}

export const cargarMapa = (c: Curso): Promise<Mapa> => pedir<Mapa>(`${carpeta(c)}/mapa-semanas.json`);
export const cargarObjetivos = (c: Curso): Promise<Objetivos> => pedir<Objetivos>(`${carpeta(c)}/objetivos.json`);
export const cargarComoAyudar = (): Promise<ComoAyudar> => pedir<ComoAyudar>('contenido/comun/como-ayudar.json');

export type Carga<T> = { estado: 'cargando' } | { estado: 'error'; reintentar: () => void } | { estado: 'listo'; valor: T };

/** Carga algo al mostrar la pantalla y cada vez que cambian `claves`. */
export function useCarga<T>(cargar: () => Promise<T>, claves: readonly unknown[]): Carga<T> {
  const [carga, setCarga] = useState<Carga<T>>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    let vigente = true;
    setCarga({ estado: 'cargando' });
    cargar().then(
      (valor) => vigente && setCarga({ estado: 'listo', valor }),
      () => vigente && setCarga({ estado: 'error', reintentar: () => setIntento((i) => i + 1) }),
    );
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...claves, intento]);
  return carga;
}
