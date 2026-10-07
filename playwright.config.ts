import { defineConfig, devices } from '@playwright/test';

// En local, si no hay navegador de Playwright, PW_CANAL=chrome usa el Chrome instalado.
const channel = process.env.PW_CANAL || undefined;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173/germina/',
    ...devices['Pixel 5'],
    viewport: { width: 375, height: 812 },
    locale: 'es-ES',
    channel,
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/germina/',
    reuseExistingServer: !process.env.CI,
  },
});
