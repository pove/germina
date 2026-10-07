// Números como en el cuaderno, en los cinco idiomas: cifras 0–9 (también en árabe) y coma decimal.

const formato = new Intl.NumberFormat('es-ES', { numberingSystem: 'latn', useGrouping: false, maximumFractionDigits: 20 });

export function formatearNumero(n: number): string {
  return formato.format(n);
}

/** Minutos y segundos como en el reloj: `1:05`. */
export function formatearTiempo(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
