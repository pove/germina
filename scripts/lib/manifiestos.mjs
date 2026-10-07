// Manifiesto de la aplicación instalable, uno por idioma (nombre «Germina» y el lema como descripción).

export const THEME_COLOR = '#2f6b3a';
export const BACKGROUND_COLOR = '#fbf8f1';

/** Nombre del archivo: el español es el manifiesto por defecto. */
export const nombreDeManifiesto = (id) => (id === 'es' ? 'manifest.webmanifest' : `manifest-${id}.webmanifest`);

/**
 * @param {{id: string, lang: string, dir: string}} idioma de config/idiomas.json
 * @param {string} lema texto de `app.lema` en ese idioma
 * @param {string} base ruta base del sitio, p. ej. «/germina/»
 */
export function manifiesto(idioma, lema, base) {
  return {
    id: base,
    name: 'Germina',
    short_name: 'Germina',
    description: lema,
    lang: idioma.lang,
    dir: idioma.dir,
    start_url: base,
    scope: base,
    display: 'standalone',
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      { src: `${base}iconos/icono-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${base}iconos/icono-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${base}iconos/icono-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: `${base}favicon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
