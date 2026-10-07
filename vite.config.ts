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
        // La aplicación y todo el contenido activo: funciona sin conexión desde la primera visita completa.
        globPatterns: ['**/*.{js,css,html,json,svg,png,woff2,webmanifest}'],
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
