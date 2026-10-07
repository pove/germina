// Genera los iconos de la aplicación (public/favicon.svg y public/iconos/*.png) a partir de un SVG propio.
// Uso: node scripts/iconos.mjs   (necesita Playwright; PW_CANAL=chrome usa el Chrome instalado)
// Los iconos ya generados se guardan en el repositorio: este script solo hace falta si se cambia el dibujo.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const VERDE = '#2f6b3a';
const CREMA = '#fbf8f1';

/** El brote de Germina sobre fondo verde. `redondeado` para el icono normal; sin redondear para el «maskable». */
function icono({ redondeado, escala = 1 }) {
  const fondo = redondeado ? `<rect width="512" height="512" rx="104" fill="${VERDE}"/>` : `<rect width="512" height="512" fill="${VERDE}"/>`;
  const centro = 256;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${fondo}` +
    `<g transform="translate(${centro} ${centro}) scale(${escala}) translate(${-centro} ${-centro})" fill="${CREMA}" stroke="${CREMA}" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M256 384V256" stroke-width="30" fill="none"/>` +
    `<path d="M256 308C256 244 214 206 146 206C146 274 188 308 256 308Z" stroke-width="10"/>` +
    `<path d="M256 266C256 200 300 160 370 160C370 228 324 266 256 266Z" stroke-width="10"/>` +
    `<path d="M170 396H342" stroke-width="30" fill="none"/>` +
    `</g></svg>`
  );
}

const destino = join(raiz, 'public');
mkdirSync(join(destino, 'iconos'), { recursive: true });
writeFileSync(join(destino, 'favicon.svg'), `${icono({ redondeado: true })}\n`);

const navegador = await chromium.launch({ channel: process.env.PW_CANAL || undefined });
const pagina = await navegador.newPage();
const hacer = async (nombre, lado, svg) => {
  await pagina.setViewportSize({ width: lado, height: lado });
  await pagina.setContent(`<style>html,body{margin:0}svg{display:block;width:${lado}px;height:${lado}px}</style>${svg}`);
  await pagina.screenshot({ path: join(destino, 'iconos', nombre), omitBackground: true });
};
await hacer('icono-192.png', 192, icono({ redondeado: true }));
await hacer('icono-512.png', 512, icono({ redondeado: true }));
// «Maskable»: sin esquinas redondeadas y con el dibujo dentro de la zona segura (el 80 % central).
await hacer('icono-maskable-512.png', 512, icono({ redondeado: false, escala: 0.8 }));
// iOS pone sus propias esquinas: sin transparencia.
await hacer('apple-touch-icon.png', 180, icono({ redondeado: false }));
await navegador.close();
console.log('Iconos generados en public/');
