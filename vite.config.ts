import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  base: '/germina/',
  plugins: [preact()],
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/__tests__/*.test.*'],
  },
});
