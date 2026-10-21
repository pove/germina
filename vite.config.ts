import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { contenido } from './scripts/vite-contenido.mjs';
import { manifiestos } from './scripts/vite-manifiestos.mjs';

export default defineConfig({
  base: '/germina/',
  plugins: [
    preact(),
    contenido(),
    manifiestos(),
    VitePWA({
      // Si hay versión nueva, avisa («Hay novedades · Ver ahora»); si no se pulsa, se aplica la próxima vez que se abra la web.
      registerType: 'prompt',
      injectRegister: false,
      manifest: false, // los manifiestos (uno por idioma) los emite `manifiestos()`
      workbox: {
        // La aplicación y el contenido común (textos, mapas, objetivos, índice). Las semillas no: con cuatro cursos
        // pasarían del presupuesto (especificación, 7). Se guardan en `germina-semillas` al pedirlas, y la aplicación
        // pide en segundo plano las de los cursos de la familia (src/precarga.ts).
        globPatterns: ['**/*.{js,css,html,json,svg,png,woff2,webmanifest}'],
        // Los índices para buscar tampoco (uno por idioma): se guardan en `germina-busqueda` la primera vez que se busca.
        globIgnores: ['**/contenido/ciclo-*/*/*/semana-*.json', '**/contenido/ciclo-*/*/*/verano-*.json', '**/contenido/busqueda-*.json'],
        runtimeCaching: [
          {
            // Se piden con su huella (`?v=…`), así que lo guardado nunca es una versión vieja. Las versiones que ya no
            // están en el índice las quita la aplicación (src/precarga.ts).
            urlPattern: ({ url }) => /\/contenido\/ciclo-\d\/[^/]+\/\d\/(semana|verano)-\d\d\.json$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'germina-semillas' },
          },
          {
            // Sin huella en la ruta: se sirve lo guardado y se renueva por detrás para la próxima vez.
            urlPattern: ({ url }) => /\/contenido\/busqueda-[a-z]{2}\.json$/.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'germina-busqueda' },
          },
        ],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/__tests__/*.test.*'],
    coverage: {
      provider: 'v8',
      include: ['src/nucleo/**/*.ts'],
      exclude: ['src/nucleo/**/*.test.ts'],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});
