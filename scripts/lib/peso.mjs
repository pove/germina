// Peso de la web construida (especificación, 7). Todo en bytes comprimidos con gzip.
import { existsSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { gzipSync } from 'node:zlib';

/** Primera carga de la página de inicio: JS + CSS + HTML + fuente latina. */
export const PRESUPUESTO_INICIO = 200_000;
/** Todo lo que el service worker precarga (aplicación y contenido). */
export const PRESUPUESTO_PRECARGA = 1_500_000;

const comprimido = (ruta) => gzipSync(readFileSync(ruta), { level: 9 }).length;

/** Resuelve una referencia del HTML o del CSS (relativa o con la base del sitio) a una ruta dentro de `dist`. */
function dentroDeDist(referencia, base, desde = '') {
  const limpia = referencia.split(/[?#]/)[0];
  if (/^(https?:)?\/\//.test(limpia) || limpia.startsWith('data:')) return null;
  if (limpia.startsWith('/')) return limpia.startsWith(base) ? limpia.slice(base.length) : limpia.slice(1);
  return posix.normalize(posix.join(posix.dirname(desde), limpia));
}

/** Archivos de la primera carga: el HTML, sus scripts y hojas de estilo, y las fuentes de esas hojas. */
export function archivosDeInicio(dist, base) {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const archivos = new Set(['index.html']);
  for (const m of html.matchAll(/<(?:script|link)\b[^>]*>/g)) {
    const etiqueta = m[0];
    const esRecurso = /<script\b[^>]*\bsrc=/.test(etiqueta) || /rel=["'](?:stylesheet|modulepreload)["']/.test(etiqueta);
    const referencia = /(?:src|href)=["']([^"']+)["']/.exec(etiqueta)?.[1];
    if (!esRecurso || !referencia) continue;
    const ruta = dentroDeDist(referencia, base);
    if (ruta) archivos.add(ruta);
  }
  for (const css of [...archivos].filter((a) => a.endsWith('.css'))) {
    const texto = readFileSync(join(dist, css), 'utf8');
    for (const m of texto.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
      const ruta = dentroDeDist(m[1], base, css);
      if (ruta && existsSync(join(dist, ruta))) archivos.add(ruta);
    }
  }
  return [...archivos];
}

/** Archivos que precarga el service worker, leídos del manifiesto que Workbox deja en `sw.js`. */
export function archivosPrecargados(dist, base) {
  const sw = join(dist, 'sw.js');
  if (!existsSync(sw)) throw new Error('No existe dist/sw.js: hay que construir primero (npm run build).');
  const urls = [...readFileSync(sw, 'utf8').matchAll(/\burl:\s*"([^"]+)"/g)].map((m) => dentroDeDist(m[1], base)).filter(Boolean);
  if (urls.length === 0) throw new Error('No se encuentra el manifiesto de precarga en dist/sw.js.');
  return [...new Set(urls)];
}

function sumar(dist, archivos) {
  const detalle = archivos.map((ruta) => ({ ruta, bytes: comprimido(join(dist, ruta)) })).sort((a, b) => b.bytes - a.bytes);
  return { detalle, total: detalle.reduce((s, x) => s + x.bytes, 0) };
}

/** Mide y compara con los presupuestos. */
export function medir({ dist, base = '/', presupuestoInicio = PRESUPUESTO_INICIO, presupuestoPrecarga = PRESUPUESTO_PRECARGA }) {
  const inicio = { ...sumar(dist, archivosDeInicio(dist, base)), presupuesto: presupuestoInicio };
  const precarga = { ...sumar(dist, archivosPrecargados(dist, base)), presupuesto: presupuestoPrecarga };
  return { inicio, precarga, correcto: inicio.total <= inicio.presupuesto && precarga.total <= precarga.presupuesto };
}

const kb = (bytes) => `${(bytes / 1000).toFixed(1)} KB`;

/** Informe legible. */
export function informe({ inicio, precarga }) {
  const bloque = (titulo, { detalle, total, presupuesto }) => [
    `${titulo}: ${kb(total)} de ${kb(presupuesto)} (${Math.round((100 * total) / presupuesto)} %)${total > presupuesto ? '  ← SE PASA DEL PRESUPUESTO' : ''}`,
    ...detalle.slice(0, 8).map((x) => `    ${kb(x.bytes).padStart(9)}  ${x.ruta}`),
    ...(detalle.length > 8 ? [`    … y ${detalle.length - 8} archivos más`] : []),
  ];
  return [...bloque('Primera carga de la página de inicio', inicio), ...bloque('Conjunto precargado', precarga)].join('\n');
}

