// Índice de las semillas que ya existen: `contenido/indice.json`.
// La aplicación lo usa para saber qué semillas hay sin pedir archivos que todavía no existen.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const subcarpetas = (ruta) =>
  existsSync(ruta) ? readdirSync(ruta, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];

/** `{ version: 1, semillas: ['2/matematicas/3/s07', …] }`, ordenado. */
export function indiceDeSemillas(raiz) {
  const base = join(raiz, 'contenido');
  const semillas = [];
  for (const carpetaCiclo of subcarpetas(base)) {
    const ciclo = /^ciclo-(\d)$/.exec(carpetaCiclo)?.[1];
    if (!ciclo) continue;
    for (const area of subcarpetas(join(base, carpetaCiclo))) {
      for (const curso of subcarpetas(join(base, carpetaCiclo, area))) {
        if (!/^\d$/.test(curso)) continue;
        for (const archivo of readdirSync(join(base, carpetaCiclo, area, curso))) {
          const m = /^(semana|verano)-(\d\d)\.json$/.exec(archivo);
          if (m) semillas.push(`${ciclo}/${area}/${curso}/${m[1] === 'semana' ? 's' : 'v'}${m[2]}`);
        }
      }
    }
  }
  return { version: 1, semillas: semillas.sort() };
}
