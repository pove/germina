import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { archivosDeInicio, archivosPrecargados, informe, medir } from '../lib/peso.mjs';

const temporales = [];
afterAll(() => temporales.forEach((t) => rmSync(t, { recursive: true, force: true })));

/** Un `dist` de mentira: lo justo para medir. Los bytes aleatorios no se comprimen, así el tamaño es previsible. */
function dist({ js = 10_000, fuente = 20_000, arabe = 30_000, contenido = 40_000 } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'germina-dist-'));
  temporales.push(dir);
  mkdirSync(join(dir, 'assets'), { recursive: true });
  mkdirSync(join(dir, 'contenido'), { recursive: true });
  writeFileSync(
    join(dir, 'index.html'),
    `<!doctype html><html><head>
<link rel="icon" href="/germina/favicon.svg">
<link rel="manifest" href="/germina/manifest.webmanifest">
<script type="module" crossorigin src="/germina/assets/app.js"></script>
<link rel="modulepreload" crossorigin href="/germina/assets/extra.js">
<link rel="stylesheet" crossorigin href="/germina/assets/app.css">
</head><body><div id="app"></div></body></html>`,
  );
  writeFileSync(join(dir, 'assets/app.js'), randomBytes(js));
  writeFileSync(join(dir, 'assets/extra.js'), randomBytes(1_000));
  writeFileSync(join(dir, 'assets/app.css'), `@font-face{src:url(./latina.woff2) format("woff2")}body{color:red}`);
  writeFileSync(join(dir, 'assets/latina.woff2'), randomBytes(fuente));
  writeFileSync(join(dir, 'assets/arabe.css'), `@font-face{src:url(./arabe.woff2)}`);
  writeFileSync(join(dir, 'assets/arabe.woff2'), randomBytes(arabe));
  writeFileSync(join(dir, 'contenido/semilla.json'), randomBytes(contenido));
  writeFileSync(join(dir, 'favicon.svg'), '<svg/>');
  writeFileSync(
    join(dir, 'sw.js'),
    `precacheAndRoute([{url:"index.html",revision:"1"},{url:"assets/app.js",revision:null},{url:"assets/extra.js",revision:null},{url:"assets/app.css",revision:null},` +
      `{url:"assets/latina.woff2",revision:null},{url:"assets/arabe.css",revision:null},{url:"assets/arabe.woff2",revision:null},{url:"contenido/semilla.json",revision:"2"}])`,
  );
  return dir;
}

describe('archivosDeInicio', () => {
  it('el HTML, sus scripts y hojas de estilo y las fuentes de esas hojas; no el árabe ni los iconos', () => {
    expect(archivosDeInicio(dist(), '/germina/').sort()).toEqual(['assets/app.css', 'assets/app.js', 'assets/extra.js', 'assets/latina.woff2', 'index.html']);
  });
});

describe('archivosPrecargados', () => {
  it('lee el manifiesto de precarga de sw.js', () => {
    expect(archivosPrecargados(dist(), '/germina/')).toHaveLength(8);
  });

  it('sin sw.js, un error claro', () => {
    const vacio = mkdtempSync(join(tmpdir(), 'germina-dist-'));
    temporales.push(vacio);
    expect(() => archivosPrecargados(vacio, '/')).toThrow(/npm run build/);
  });

  it('un sw.js sin manifiesto, un error claro', () => {
    const d = dist();
    writeFileSync(join(d, 'sw.js'), 'nada');
    expect(() => archivosPrecargados(d, '/')).toThrow(/manifiesto de precarga/);
  });
});

describe('medir', () => {
  it('suma lo comprimido de cada conjunto', () => {
    const r = medir({ dist: dist(), base: '/germina/' });
    expect(r.inicio.total).toBeGreaterThan(10_000 + 20_000 + 1_000);
    expect(r.inicio.total).toBeLessThan(33_000);
    expect(r.precarga.total).toBeGreaterThan(r.inicio.total + 30_000 + 40_000);
    expect(r.correcto).toBe(true);
  });

  it('falla si la primera carga se pasa', () => {
    const r = medir({ dist: dist({ js: 210_000 }), base: '/germina/' });
    expect(r.inicio.total).toBeGreaterThan(200_000);
    expect(r.correcto).toBe(false);
    expect(informe(r)).toContain('SE PASA DEL PRESUPUESTO');
  });

  it('falla si lo precargado se pasa, aunque la primera carga no', () => {
    const r = medir({ dist: dist({ contenido: 1_500_000 }), base: '/germina/' });
    expect(r.inicio.total).toBeLessThan(200_000);
    expect(r.precarga.total).toBeGreaterThan(1_500_000);
    expect(r.correcto).toBe(false);
  });

  it('el informe lista lo más pesado primero', () => {
    const texto = informe(medir({ dist: dist(), base: '/germina/' }));
    expect(texto).toMatch(/Primera carga de la página de inicio: .* KB de 200\.0 KB/);
    expect(texto).toMatch(/Conjunto precargado: .* KB de 1500\.0 KB/);
    expect(texto.indexOf('contenido/semilla.json')).toBeLessThan(texto.indexOf('index.html', texto.indexOf('Conjunto')));
  });

  it('con los presupuestos reales y una web pequeña, correcto', () => {
    expect(medir({ dist: dist(), base: '/germina/', presupuestoInicio: 1, presupuestoPrecarga: 1 }).correcto).toBe(false);
  });
});
