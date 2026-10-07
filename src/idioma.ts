// Idioma de la interfaz: señal, `lang` y `dir` en <html>, textos con vuelta al español y persistencia.
import { computed, signal } from '@preact/signals';
import idiomasConfig from '../config/idiomas.json';
import textos from '../contenido/comun/textos-interfaz.json';
import { datos, guardar } from './estado';
import { detectarIdioma } from './nucleo/idiomas';
import { elegir, faltaAlguno, interpolar } from './nucleo/textos';
import { IDIOMAS, type Idioma } from './nucleo/tipos';

export type ClaveTexto = keyof typeof textos;

interface ConfigIdioma {
  id: Idioma;
  nombre: string;
  dir: 'ltr' | 'rtl';
  lang: string;
}

export const IDIOMAS_CONFIG = idiomasConfig.idiomas as ConfigIdioma[];
const POR_DEFECTO = idiomasConfig.porDefecto as Idioma;

export const idioma = signal<Idioma>(POR_DEFECTO);

/** ¿Hay textos de la interfaz sin traducir al idioma elegido? (Una red de seguridad: el validador lo impide.) */
export const faltanTextos = computed(() => faltaAlguno(Object.values(textos), idioma.value));

/** El texto de la interfaz en el idioma elegido; si falta, el español. Los huecos `{n}` se rellenan con `valores`. */
export function t(clave: ClaveTexto, valores?: Readonly<Record<string, string | number>>): string {
  return interpolar(elegir(textos[clave], idioma.value).texto, valores);
}

/** Como `t`, para claves que se forman al vuelo (`curso.3`). Si no existe, devuelve la propia clave. */
export function tDinamico(clave: string, valores?: Readonly<Record<string, string | number>>): string {
  return clave in textos ? t(clave as ClaveTexto, valores) : clave;
}

/** Pone `lang` y `dir` en <html>, y carga la tipografía árabe solo si hace falta. */
export function aplicarIdioma(id: Idioma): void {
  const config = IDIOMAS_CONFIG.find((c) => c.id === id) ?? IDIOMAS_CONFIG[0]!;
  document.documentElement.lang = config.lang;
  document.documentElement.dir = config.dir;
  if (id === 'ar') void import('./estilos-arabe.css');
  // El manifiesto de la aplicación instalable, en el idioma elegido.
  const manifiesto = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (manifiesto) manifiesto.href = `${import.meta.env.BASE_URL}${id === 'es' ? 'manifest.webmanifest' : `manifest-${id}.webmanifest`}`;
}

/** Idioma de partida: el guardado, si no el del navegador (si es uno de los cinco), si no el español. */
export function iniciarIdioma(): Idioma {
  const lenguas = typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language];
  const id = datos.value.idioma ?? detectarIdioma(lenguas) ?? POR_DEFECTO;
  idioma.value = id;
  aplicarIdioma(id);
  return id;
}

/** Cambia el idioma, lo aplica y lo guarda en el dispositivo. */
export function elegirIdioma(id: Idioma): void {
  if (!(IDIOMAS as readonly string[]).includes(id)) return;
  idioma.value = id;
  aplicarIdioma(id);
  guardar({ ...datos.value, idioma: id });
}
