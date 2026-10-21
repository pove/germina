// Índice para buscar en las semillas: `contenido/busqueda-{idioma}.json`, uno por idioma.
// Lleva lo que se lee de cada semilla (título, lo que descubren, el reto y las cinco preguntas) en ese idioma.
// El de español lleva además el tema del mapa y los saberes del currículo, que solo están en español:
// la aplicación lo busca siempre, también con otro idioma elegido, porque en clase todo se nombra en español.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const IDIOMAS = ['es', 'va', 'en', 'fr', 'ar'];

const leerJson = (ruta) => JSON.parse(readFileSync(ruta, 'utf8'));
const subcarpetas = (ruta) =>
  existsSync(ruta) ? readdirSync(ruta, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];

/** Las semillas que existen, en orden: `[{ clave: '2/matematicas/3/s07', semilla, entradaMapa, saberes }]`. */
function semillasConMapa(raiz) {
  const base = join(raiz, 'contenido');
  const lista = [];
  for (const carpetaCiclo of subcarpetas(base)) {
    const ciclo = /^ciclo-(\d)$/.exec(carpetaCiclo)?.[1];
    if (!ciclo) continue;
    for (const area of subcarpetas(join(base, carpetaCiclo))) {
      const rutaMapa = join(base, carpetaCiclo, area, 'mapa-semanas.json');
      const mapa = existsSync(rutaMapa) ? leerJson(rutaMapa) : { cursos: {}, verano: {} };
      const rutaCurriculo = join(raiz, 'config', 'curriculo', `${area}.json`);
      const saberes = new Map(existsSync(rutaCurriculo) ? leerJson(rutaCurriculo).saberes.map((s) => [s.id, s.texto]) : []);
      for (const curso of subcarpetas(join(base, carpetaCiclo, area))) {
        if (!/^\d$/.test(curso)) continue;
        const dir = join(base, carpetaCiclo, area, curso);
        for (const archivo of readdirSync(dir).sort()) {
          const m = /^(semana|verano)-(\d\d)\.json$/.exec(archivo);
          if (!m) continue;
          const verano = m[1] === 'verano';
          const n = Number(m[2]);
          const entradaMapa = verano
            ? (mapa.verano?.[curso] ?? []).find((e) => e.id === `verano-${m[2]}`)
            : (mapa.cursos?.[curso] ?? []).find((e) => e.semana === n);
          lista.push({ clave: `${ciclo}/${area}/${curso}/${verano ? 'v' : 's'}${m[2]}`, semilla: leerJson(join(dir, archivo)), entradaMapa, saberes });
        }
      }
    }
  }
  return lista.sort((a, b) => (a.clave < b.clave ? -1 : 1));
}

/** `{ es: { version: 1, semillas: [{ clave, titulo, objetivo, reto, preguntas, tema, saberes }] }, va: …, … }` */
export function indicesDeBusqueda(raiz) {
  const semillas = semillasConMapa(raiz);
  return Object.fromEntries(
    IDIOMAS.map((idioma) => {
      const texto = (t) => t?.[idioma] || t?.es || '';
      const entradas = semillas.map(({ clave, semilla, entradaMapa, saberes }) => ({
        clave,
        titulo: texto(semilla.titulo),
        objetivo: texto(semilla.objetivo),
        reto: texto(semilla.reto?.titulo),
        preguntas: (semilla.preguntas ?? []).map((p) => texto(p.texto)),
        ...(idioma === 'es' && {
          tema: entradaMapa?.tema ?? '',
          saberes: (semilla.saberes ?? []).map((id) => saberes.get(id)).filter((s) => s !== undefined),
        }),
      }));
      return [idioma, { version: 1, semillas: entradas }];
    }),
  );
}
