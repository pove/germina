// Valida todo el contenido de contenido/ (especificación, apartado 11).
// Uso: node scripts/validar-contenido.mjs   (sale con código 1 si hay errores)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { fallosDeAjv, validarComunes, validarPictogramas } from './lib/validar-comun.mjs';
import { validarSemilla } from './lib/validar-semilla.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

const leerJson = (ruta) => JSON.parse(readFileSync(ruta, 'utf8'));
const subcarpetas = (ruta) =>
  existsSync(ruta) ? readdirSync(ruta, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];

/** Deduce ciclo, área, curso, id y semana/verano de la ruta de un archivo de semilla. */
function rutaDeSemilla([carpetaCiclo, area, curso, archivo]) {
  const ciclo = /^ciclo-(\d)$/.exec(carpetaCiclo)?.[1];
  const nombre = /^(semana|verano)-(\d\d)\.json$/.exec(archivo);
  if (!ciclo || !/^\d$/.test(curso) || !nombre) return null;
  const sigla = nombre[1] === 'semana' ? 's' : 'v';
  return {
    ciclo: Number(ciclo),
    area,
    curso: Number(curso),
    id: `${ciclo}.${area}.${curso}.${sigla}${nombre[2]}`,
    ...(sigla === 's' ? { semana: Number(nombre[2]) } : { verano: Number(nombre[2]) }),
  };
}

export function validarContenido({ raiz = RAIZ } = {}) {
  const errores = [];
  const avisos = [];
  const error = (archivo, campo, motivo) => errores.push({ archivo, campo, motivo });

  const ajv = new Ajv2020({ allErrors: true, validateFormats: false, strictTypes: false });
  const esquemaSemilla = leerJson(join(raiz, 'config/esquemas/semilla.schema.json'));
  ajv.addSchema(leerJson(join(raiz, 'config/esquemas/comun.schema.json')));
  const validarEsquema = ajv.compile(esquemaSemilla);
  const esquema = (semilla) => (validarEsquema(semilla) ? [] : fallosDeAjv(validarEsquema.errors));

  const cacheArea = new Map();
  const datosDeArea = (ciclo, area) => {
    const clave = `${ciclo}/${area}`;
    if (!cacheArea.has(clave)) {
      const rutaMapa = join(raiz, 'contenido', `ciclo-${ciclo}`, area, 'mapa-semanas.json');
      const rutaCurriculo = join(raiz, 'config/curriculo', `${area}.json`);
      cacheArea.set(clave, {
        mapa: existsSync(rutaMapa) ? leerJson(rutaMapa) : null,
        curriculo: existsSync(rutaCurriculo) ? leerJson(rutaCurriculo) : null,
      });
    }
    return cacheArea.get(clave);
  };
  const existePicto = (nombre) => existsSync(join(raiz, 'src/assets/pictos', `${nombre}.svg`));

  let semillas = 0;
  const base = join(raiz, 'contenido');
  for (const carpetaCiclo of subcarpetas(base).filter((c) => c.startsWith('ciclo-'))) {
    for (const area of subcarpetas(join(base, carpetaCiclo))) {
      for (const curso of subcarpetas(join(base, carpetaCiclo, area))) {
        const dir = join(base, carpetaCiclo, area, curso);
        for (const archivo of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
          const rel = relative(raiz, join(dir, archivo)).split('\\').join('/');
          const ruta = rutaDeSemilla([carpetaCiclo, area, curso, archivo]);
          if (!ruta) {
            error(rel, '(archivo)', 'el nombre no es «semana-NN.json» ni «verano-NN.json», o la carpeta no es de un curso');
            continue;
          }
          semillas++;
          let semilla;
          try {
            semilla = leerJson(join(dir, archivo));
          } catch (e) {
            error(rel, '(archivo)', `no es JSON válido: ${e.message}`);
            continue;
          }
          const { mapa, curriculo } = datosDeArea(ruta.ciclo, area);
          if (!curriculo) {
            error(rel, '(archivo)', `no existe config/curriculo/${area}.json`);
            continue;
          }
          if (!mapa) {
            error(rel, '(archivo)', `no existe contenido/ciclo-${ruta.ciclo}/${area}/mapa-semanas.json`);
            continue;
          }
          const r = validarSemilla(semilla, rel, { esquema, curriculo, mapa, existePicto, ruta });
          errores.push(...r.errores);
          avisos.push(...r.avisos);
        }
      }
    }
  }
  const comunes = validarComunes({ raiz, ajv });
  errores.push(...comunes.errores);
  avisos.push(...comunes.avisos);
  errores.push(...validarPictogramas({ raiz, esquema: esquemaSemilla }).errores);
  return { errores, avisos, semillas };
}

const formato = (x) => `${x.archivo}: ${x.campo} — ${x.motivo}`;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { errores, avisos, semillas } = validarContenido();
  for (const a of avisos) console.warn(`aviso  ${formato(a)}`);
  if (errores.length) {
    console.error(`${errores.length} error(es) en el contenido:\n${errores.map((e) => `- ${formato(e)}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`Contenido correcto: ${semillas} semilla(s)${avisos.length ? `, ${avisos.length} aviso(s)` : ''}.`);
}
