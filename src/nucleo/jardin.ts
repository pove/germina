// El jardín (especificación, 6.2): una planta por semana, en tres estados que dependen solo de lo marcado.
import type { Semilla } from './tipos';

export type EstadoPlanta = 'semilla' | 'brote' | 'flor';

/** Semilla: nada marcado. Brote: alguna pregunta hablada. Planta en flor: el reto jugado. Nunca hay plantas secas. */
export function estadoPlanta(marcado: Semilla | undefined): EstadoPlanta {
  if (!marcado) return 'semilla';
  if (marcado.hecho.includes('reto')) return 'flor';
  return marcado.hecho.length > 0 ? 'brote' : 'semilla';
}
