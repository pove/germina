// Elegir el idioma de partida a partir de los del navegador (especificación, 3: bienvenida).
import type { Idioma } from './tipos';

const PRIMARIOS: Readonly<Record<string, Idioma>> = { es: 'es', ca: 'va', va: 'va', en: 'en', fr: 'fr', ar: 'ar' };

/** El primer idioma de la lista que sea uno de los cinco. El catalán y el valenciano van a `va`. */
export function detectarIdioma(lenguas: readonly string[]): Idioma | null {
  for (const lengua of lenguas) {
    const primario = lengua.toLowerCase().split(/[-_]/)[0] ?? '';
    const idioma = PRIMARIOS[primario];
    if (idioma) return idioma;
  }
  return null;
}
