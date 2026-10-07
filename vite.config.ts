import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { contenido } from './scripts/vite-contenido.mjs';

export default defineConfig({
  base: '/germina/',
  plugins: [preact(), contenido()],
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
