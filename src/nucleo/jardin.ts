// El jardín (especificación, 6.2): una planta por semana, en tres estados que dependen solo de lo marcado.
import type { Semilla } from './tipos';

export type EstadoPlanta = 'semilla' | 'brote' | 'flor';

/** Semilla: nada marcado. Brote: alguna pregunta hablada. Planta en flor: el reto jugado. Nunca hay plantas secas. */
export function estadoPlanta(marcado: Semilla | undefined): EstadoPlanta {
  if (!marcado) return 'semilla';
  if (marcado.hecho.includes('reto')) return 'flor';
  return marcado.hecho.length > 0 ? 'brote' : 'semilla';
}

/**
 * La semilla publicada más cercana a la semana `n` (de 1 a `total`), para no dejar a la familia sin nada que jugar
 * cuando la suya está en camino: primero la anterior más próxima; si no hay ninguna antes, la siguiente.
 */
export function semillaCercana(existe: (m: number) => boolean, n: number, total: number): number | null {
  for (let m = Math.min(n - 1, total); m >= 1; m--) if (existe(m)) return m;
  for (let m = Math.max(n + 1, 1); m <= total; m++) if (existe(m)) return m;
  return null;
}
