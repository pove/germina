// Plugin de Vite: valida el contenido al construir y lo sirve en `contenido/…` (en desarrollo y en `dist`).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { indicesDeBusqueda } from './lib/busqueda.mjs';
import { indiceDeSemillas } from './lib/indice.mjs';
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
      this.emitFile({ type: 'asset', fileName: 'contenido/indice.json', source: JSON.stringify(indiceDeSemillas(raiz)) });
      for (const [idioma, indice] of Object.entries(indicesDeBusqueda(raiz))) {
        this.emitFile({ type: 'asset', fileName: `contenido/busqueda-${idioma}.json`, source: JSON.stringify(indice) });
      }
    },
    configureServer(servidor) {
      const prefijo = `${base}contenido/`;
      servidor.middlewares.use((req, res, next) => {
        const [url, consulta] = (req.url ?? '').split('?');
        // Con consulta (`?import`, `?t=…`) es un import de módulo, como `textos-interfaz.json` en `idioma.ts`: lo sirve Vite como JavaScript.
        // La app pide el contenido con `fetch`, sin consulta o, las semillas, con su huella (`?v=…`).
        if (!url.startsWith(prefijo) || (consulta !== undefined && !/^v=[0-9a-f]+$/.test(consulta))) return next();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (url === `${prefijo}indice.json`) return void res.end(JSON.stringify(indiceDeSemillas(raiz)));
        const busqueda = new RegExp(`^${prefijo}busqueda-([a-z]{2})\\.json$`).exec(url);
        const indiceBusqueda = busqueda && indicesDeBusqueda(raiz)[busqueda[1]];
        if (indiceBusqueda) return void res.end(JSON.stringify(indiceBusqueda));
        const ruta = join(raiz, 'contenido', decodeURIComponent(url.slice(prefijo.length)));
        if (!ruta.startsWith(join(raiz, 'contenido')) || !ruta.endsWith('.json') || !existsSync(ruta)) {
          res.statusCode = 404;
          return void res.end('{}');
        }
        res.end(readFileSync(ruta));
      });
    },
  };
}
