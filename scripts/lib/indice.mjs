// Índice de las semillas que ya existen: `contenido/indice.json`.
// La aplicación lo usa para saber qué semillas hay sin pedir archivos que todavía no existen, y la huella de cada
// una le sirve para pedirla como `…/semana-07.json?v=<huella>`: así la caché de semillas nunca da una versión vieja.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const subcarpetas = (ruta) =>
  existsSync(ruta) ? readdirSync(ruta, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];

/** Huella del archivo: 10 cifras hexadecimales de su SHA-256. */
const huellaArchivo = (ruta) => createHash('sha256').update(readFileSync(ruta)).digest('hex').slice(0, 10);

/** `{ version: 2, semillas: { '2/matematicas/3/s07': 'a1b2c3d4e5', … } }`, con las claves ordenadas. */
export function indiceDeSemillas(raiz) {
  const base = join(raiz, 'contenido');
  const semillas = [];
  for (const carpetaCiclo of subcarpetas(base)) {
    const ciclo = /^ciclo-(\d)$/.exec(carpetaCiclo)?.[1];
    if (!ciclo) continue;
    for (const area of subcarpetas(join(base, carpetaCiclo))) {
      for (const curso of subcarpetas(join(base, carpetaCiclo, area))) {
        if (!/^\d$/.test(curso)) continue;
        const dir = join(base, carpetaCiclo, area, curso);
        for (const archivo of readdirSync(dir)) {
          const m = /^(semana|verano)-(\d\d)\.json$/.exec(archivo);
          if (m) semillas.push([`${ciclo}/${area}/${curso}/${m[1] === 'semana' ? 's' : 'v'}${m[2]}`, huellaArchivo(join(dir, archivo))]);
        }
      }
    }
  }
  return { version: 2, semillas: Object.fromEntries(semillas.sort(([a], [b]) => (a < b ? -1 : 1))) };
}
