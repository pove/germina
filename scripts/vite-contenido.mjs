// Plugin de Vite: valida el contenido al construir y lo sirve en `contenido/…` (en desarrollo y en `dist`).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { validarContenido } from './validar-contenido.mjs';

function* archivos(dir) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) yield* archivos(ruta);
    else if (nombre.endsWith('.json')) yield ruta;
  }
}

export function contenido() {
  let raiz = process.cwd();
  let base = '/';
  let construyendo = false;
  return {
    name: 'germina-contenido',
    configResolved(config) {
      raiz = config.root;
      base = config.base;
      construyendo = config.command === 'build';
    },
    buildStart() {
      if (!construyendo) return;
      const { errores } = validarContenido({ raiz });
      if (errores.length) {
        this.error(`El contenido no es válido:\n${errores.map((e) => `- ${e.archivo}: ${e.campo} — ${e.motivo}`).join('\n')}`);
      }
    },
    generateBundle() {
      const dir = join(raiz, 'contenido');
      if (!existsSync(dir)) return;
      for (const ruta of archivos(dir)) {
        this.emitFile({ type: 'asset', fileName: relative(raiz, ruta).split('\\').join('/'), source: readFileSync(ruta) });
      }
    },
    configureServer(servidor) {
      const prefijo = `${base}contenido/`;
      servidor.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        if (!url.startsWith(prefijo)) return next();
        const ruta = join(raiz, 'contenido', decodeURIComponent(url.slice(prefijo.length)));
        if (!ruta.startsWith(join(raiz, 'contenido')) || !ruta.endsWith('.json') || !existsSync(ruta)) return next();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(readFileSync(ruta));
      });
    },
  };
}
