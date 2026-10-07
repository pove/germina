// Aplicación instalable y sin conexión: registro del service worker y aviso «Hay novedades · Ver ahora».
import { signal } from '@preact/signals';
import { registerSW } from 'virtual:pwa-register';

/** `true` cuando hay una versión nueva esperando. */
export const hayNovedades = signal(false);

let aplicar: ((recargar?: boolean) => Promise<void>) | null = null;

/** Registra el service worker (solo en la versión construida y si el navegador lo permite). */
export function iniciarActualizaciones(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  aplicar = registerSW({
    onNeedRefresh: () => {
      hayNovedades.value = true;
    },
    onRegisteredSW: (_url, registro) => {
      // Al volver a la página, comprueba si hay versión nueva (como mucho una vez por minuto).
      let ultima = Date.now();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible' || Date.now() - ultima < 60_000) return;
        ultima = Date.now();
        void registro?.update().catch(() => undefined);
      });
    },
  });
}

/** «Ver ahora»: activa la versión nueva y recarga. */
export function verNovedades(): void {
  void aplicar?.(true);
}
