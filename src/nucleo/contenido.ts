// Forma del contenido que lee la aplicación (config/esquemas/semilla.schema.json y mapa-semanas.json).
import type { Texto } from './textos';
import type { Idioma } from './tipos';

export interface PasoReto {
  texto: Texto;
  pictograma: string;
}

export interface Reto {
  titulo: Texto;
  material: Texto[];
  minutos: number;
  pasos: PasoReto[];
  masFacil: Texto;
  masDificil: Texto;
  paraQueSirve: Texto;
  aviso?: Texto;
  rapidez?: { segundos: 60 | 120 | 180; seCuenta: Texto };
}

export type Respuesta =
  | { tipo: 'calculo'; operacion: string; resultado: number; unidad?: string; texto: Texto }
  | { tipo: 'abierta'; orientacion: Texto };

export interface Pregunta {
  id: 'p1' | 'p2' | 'p3' | 'p4' | 'p5';
  rol: 'tema' | 'recordar' | 'explicamelo';
  texto: Texto;
  pista: Texto;
  respuesta: Respuesta;
  tipoProblema: string;
  inventala?: Texto;
  recupera?: number;
}

export type EstadoTraduccion = { estado: 'automatica' | 'revisada'; huella: string };

export interface SemillaContenido {
  version: 1;
  id: string;
  ciclo: number;
  area: string;
  curso: number;
  semana?: number;
  verano?: number;
  tipo: 'tema' | 'recordar' | 'verano';
  titulo: Texto;
  objetivo: Texto;
  comoAyudar: Texto;
  saberes: string[];
  criterios: string[];
  reto: Reto;
  preguntas: Pregunta[];
  revision: {
    docente: { revisada: boolean; fecha?: string };
    traducciones: Record<Exclude<Idioma, 'es'>, EstadoTraduccion>;
  };
}

/** Una fila de `mapa-semanas.json`. El título está solo en español. */
export interface EntradaMapa {
  semana?: number;
  id?: string;
  tipo?: 'tema' | 'recordar';
  titulo: string;
  tema: string;
  /** Juego de rapidez con cronómetro y récord. */
  rapidez?: boolean;
}

export interface Mapa {
  cursos: Record<string, EntradaMapa[]>;
  verano: Record<string, EntradaMapa[]>;
}

/** `objetivos.json`: curso → trimestre → frases. */
export type Objetivos = Record<string, Record<string, Texto[]>>;

/**
 * ¿Se ve el aviso de «traducción automática»? Sí si la traducción está sin revisar, o si estaba revisada
 * pero el español ha cambiado desde entonces (su huella ya no coincide). En español nunca.
 */
export function traduccionAutomatica(semilla: SemillaContenido, idioma: Idioma, huellaActual: string | null): boolean {
  if (idioma === 'es') return false;
  const t = semilla.revision.traducciones[idioma];
  return t.estado === 'automatica' || (huellaActual !== null && t.huella !== huellaActual);
}
