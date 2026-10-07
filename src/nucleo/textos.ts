// Elegir el texto en el idioma de la persona, con vuelta al español si falta.
import type { Idioma } from './tipos';

export type Texto = Readonly<Record<Idioma, string>>;

export interface Elegido {
  texto: string;
  /** `true` si se ha usado el español porque faltaba el idioma pedido. */
  deEspanol: boolean;
}

/** El texto en `idioma`; si falta o está vacío, el español. */
export function elegir(texto: Partial<Record<Idioma, string>>, idioma: Idioma): Elegido {
  const pedido = texto[idioma];
  if (pedido) return { texto: pedido, deEspanol: false };
  return { texto: texto.es ?? '', deEspanol: idioma !== 'es' };
}

const HUECO = /(?<!\{)\{([a-z_]+)\}(?!\})/g;

/** Rellena los huecos `{n}` de un texto. Un hueco sin valor se queda como está. */
export function interpolar(plantilla: string, valores: Readonly<Record<string, string | number>> = {}): string {
  return plantilla.replace(HUECO, (completo, nombre: string) => (nombre in valores ? String(valores[nombre]) : completo));
}

/** ¿Falta algún texto de la lista en este idioma? */
export function faltaAlguno(textos: Iterable<Partial<Record<Idioma, string>>>, idioma: Idioma): boolean {
  for (const t of textos) if (!t[idioma]) return true;
  return false;
}


