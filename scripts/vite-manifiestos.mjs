// Plugin de Vite: emite un manifiesto por idioma (`manifest.webmanifest` es el español).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { manifiesto, nombreDeManifiesto } from './lib/manifiestos.mjs';

export function manifiestos() {
  let raiz = process.cwd();
  let base = '/';
  const generar = () => {
    const idiomas = JSON.parse(readFileSync(join(raiz, 'config/idiomas.json'), 'utf8')).idiomas;
    const textos = JSON.parse(readFileSync(join(raiz, 'contenido/comun/textos-interfaz.json'), 'utf8'));
    return idiomas.map((i) => ({ nombre: nombreDeManifiesto(i.id), json: manifiesto(i, textos['app.lema'][i.id], base) }));
  };
  return {
    name: 'germina-manifiestos',
    configResolved(config) {
      raiz = config.root;
      base = config.base;
    },
    generateBundle() {
      for (const { nombre, json } of generar()) this.emitFile({ type: 'asset', fileName: nombre, source: JSON.stringify(json, null, 2) });
    },
    configureServer(servidor) {
      servidor.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        const encontrado = generar().find((m) => url === `${base}${m.nombre}`);
        if (!encontrado) return next();
        res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
        res.end(JSON.stringify(encontrado.json));
      });
    },
  };
}
