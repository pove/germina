// Enrutador de almohadilla: la ruta actual como señal.
import { computed, signal } from '@preact/signals';
import { construir, interpretar, type Ruta } from './nucleo/rutas';

export const hash = signal(window.location.hash);
window.addEventListener('hashchange', () => {
  hash.value = window.location.hash;
});

export const ruta = computed<Ruta>(() => interpretar(hash.value));

/** Va a una ruta. Con `reemplazar` no deja rastro en el historial (para las redirecciones). */
export function irA(destino: Ruta, reemplazar = false): void {
  const h = construir(destino);
  if (reemplazar) {
    window.history.replaceState(null, '', h);
    hash.value = h;
  } else {
    window.location.hash = h;
  }
}
