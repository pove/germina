// Sin conexión, las semillas de vuestros cursos. El service worker precarga la aplicación y el contenido común; las
// semillas van en su propia caché (`germina-semillas`), de la que el service worker las sirve sin red. Aquí se guardan
// las de los cursos que sigue la familia, al abrir la web y cada vez que cambian sus cursos; las de otros cursos las
// guarda el service worker al mirarlas. No hace falta que el service worker controle ya la página (en la primera
// visita no la controla): la caché es la misma.
import { computed, effect } from '@preact/signals';
import { cargarIndiceCompleto } from './contenido';
import { datos } from './estado';
import { rutasDeCursos, type Indice } from './nucleo/semillas';

/** El mismo nombre que la caché de semillas de `vite.config.ts`. */
export const CACHE_SEMILLAS = 'germina-semillas';

const base = import.meta.env.BASE_URL;
const absoluta = (ruta: string): string => new URL(`${base}${ruta}`, location.origin).href;

/** Guarda las semillas de esos cursos que faltan y quita las versiones que ya no están en el índice. */
async function guardarSemillas(indice: Indice, cursos: readonly string[]): Promise<void> {
  const cache = await caches.open(CACHE_SEMILLAS);
  const vigentes = new Set(rutasDeCursos(indice, Object.keys(indice).map((k) => k.split('/').slice(0, 3).join('/'))).map(absoluta));
  for (const peticion of await cache.keys()) {
    if (!vigentes.has(peticion.url)) await cache.delete(peticion);
  }
  for (const ruta of rutasDeCursos(indice, cursos)) {
    const url = absoluta(ruta);
    if (await cache.match(url)) continue;
    try {
      await cache.add(url);
    } catch {
      return; // sin red: se intentará la próxima vez
    }
  }
}

export function iniciarPrecargaDeSemillas(): void {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator) || typeof caches === 'undefined') return;
  // Solo cuando cambian los cursos, no con cada casilla marcada.
  const claveCursos = computed(() => datos.value.cursos.join('|'));
  effect(() => {
    const cursos = claveCursos.value.split('|').filter(Boolean);
    if (cursos.length === 0) return;
    void cargarIndiceCompleto()
      .then((indice) => guardarSemillas(indice, cursos))
      .catch(() => undefined); // sin índice o sin caché: la web funciona igual con red
  });
}
