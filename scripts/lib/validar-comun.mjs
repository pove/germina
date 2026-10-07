// Reglas de los archivos comunes (textos de interfaz, glosario, cómo ayudar, objetivos) y de los pictogramas.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { campoDe, revisarTextos } from './validar-semilla.mjs';
import { palabrasProhibidasEn } from './palabras.mjs';

const ID_COMUN = 'https://pove.github.io/germina/esquemas/comun.schema.json';

/** Convierte los errores de ajv en {ruta, motivo}, sin el ruido de oneOf/if/anyOf/not/allOf. */
export function fallosDeAjv(errores) {
  const ruido = new Set(['oneOf', 'anyOf', 'if', 'not', 'allOf']);
  const utiles = errores.some((e) => !ruido.has(e.keyword)) ? errores.filter((e) => !ruido.has(e.keyword)) : errores;
  const vistos = new Set();
  const salida = [];
  for (const e of utiles) {
    const ruta = e.instancePath
      .split('/')
      .slice(1)
      .map((p) => (/^\d+$/.test(p) ? Number(p) : p.replace(/~1/g, '/').replace(/~0/g, '~')));
    let motivo = e.message;
    if (e.keyword === 'required') motivo = `falta «${e.params.missingProperty}»`;
    else if (e.keyword === 'additionalProperties' || e.keyword === 'unevaluatedProperties') {
      motivo = `«${e.params.additionalProperty ?? e.params.unevaluatedProperty}» no está permitido`;
    } else if (e.keyword === 'propertyNames') motivo = `la clave «${e.params.propertyName}» no tiene el formato esperado`;
    else if (e.keyword === 'enum') motivo = `debe ser uno de: ${e.params.allowedValues.join(', ')}`;
    else if (e.keyword === 'const') motivo = `debe ser ${JSON.stringify(e.params.allowedValue)}`;
    else if (e.keyword === 'pattern') motivo = `no tiene el formato esperado (${e.params.pattern})`;
    else if (e.keyword === 'type') motivo = `debe ser de tipo ${e.params.type}`;
    else if (e.keyword === 'minLength') motivo = 'no puede estar vacío';
    else if (e.keyword === 'minItems') motivo = `debe tener al menos ${e.params.limit} elementos`;
    else if (e.keyword === 'maxItems') motivo = `debe tener como mucho ${e.params.limit} elementos`;
    else if (e.keyword === 'uniqueItems') motivo = 'hay elementos repetidos';
    const clave = `${campoDe(ruta)}|${motivo}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    salida.push({ ruta, motivo });
  }
  return salida;
}

/**
 * Comprueba un archivo común: JSON válido, esquema y textos.
 * @returns {{errores: object[], avisos: object[]}}
 */
function validarArchivo({ raiz, rel, ajv, definicion, requerido, revisar }) {
  const errores = [];
  const avisos = [];
  const ruta = join(raiz, rel);
  if (!existsSync(ruta)) {
    if (requerido) errores.push({ archivo: rel, campo: '(archivo)', motivo: 'no existe' });
    return { errores, avisos };
  }
  let datos;
  try {
    datos = JSON.parse(readFileSync(ruta, 'utf8'));
  } catch (e) {
    errores.push({ archivo: rel, campo: '(archivo)', motivo: `no es JSON válido: ${e.message}` });
    return { errores, avisos };
  }
  const validar = ajv.getSchema(`${ID_COMUN}#/$defs/${definicion}`);
  if (!validar(datos)) {
    for (const f of fallosDeAjv(validar.errors)) errores.push({ archivo: rel, campo: campoDe(f.ruta), motivo: f.motivo });
    return { errores, avisos };
  }
  revisar({
    datos,
    error: (r, motivo) => errores.push({ archivo: rel, campo: campoDe(r), motivo }),
    aviso: (r, motivo) => avisos.push({ archivo: rel, campo: campoDe(r), motivo }),
  });
  return { errores, avisos };
}

function revisarGlosario({ datos, error, aviso }) {
  revisarTextos(datos.map(({ nota, ...texto }) => texto), { error, aviso });
  const vistos = new Map();
  datos.forEach((t, i) => {
    const clave = t.es.trim().toLowerCase();
    if (vistos.has(clave)) error([i, 'es'], `el término «${t.es}» ya está en la posición ${vistos.get(clave)}`);
    else vistos.set(clave, i);
    for (const p of palabrasProhibidasEn(t.nota ?? '')) error([i, 'nota'], `aparece la palabra «${p}», que Germina no usa (especificación, 5.4)`);
  });
}

/** Valida los archivos de `contenido/comun/` y los `objetivos.json` de cada área. */
export function validarComunes({ raiz, ajv }) {
  const errores = [];
  const avisos = [];
  const sumar = (r) => {
    errores.push(...r.errores);
    avisos.push(...r.avisos);
  };
  const revisarTodo = ({ datos, error, aviso }) => revisarTextos(datos, { error, aviso });
  sumar(validarArchivo({
    raiz, rel: 'contenido/comun/textos-interfaz.json', ajv, definicion: 'textosInterfaz', requerido: true,
    revisar: ({ datos, error, aviso }) => revisarTextos(datos, { error, aviso, huecos: true }),
  }));
  sumar(validarArchivo({ raiz, rel: 'contenido/comun/glosario.json', ajv, definicion: 'glosario', requerido: true, revisar: revisarGlosario }));
  sumar(validarArchivo({ raiz, rel: 'contenido/comun/como-ayudar.json', ajv, definicion: 'comoAyudar', requerido: true, revisar: revisarTodo }));
  const base = join(raiz, 'contenido');
  const subcarpetas = (ruta) => (existsSync(ruta) ? readdirSync(ruta, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : []);
  for (const ciclo of subcarpetas(base).filter((c) => c.startsWith('ciclo-'))) {
    for (const area of subcarpetas(join(base, ciclo))) {
      sumar(validarArchivo({
        raiz, rel: `contenido/${ciclo}/${area}/objetivos.json`, ajv, definicion: 'objetivos', requerido: false, revisar: revisarTodo,
      }));
    }
  }
  return { errores, avisos };
}

/** Cada pictograma de la lista cerrada del esquema tiene su SVG, bien hecho, y no sobra ninguno. */
export function validarPictogramas({ raiz, esquema }) {
  const errores = [];
  const lista = esquema.$defs.pictograma.enum;
  const dir = join(raiz, 'src/assets/pictos');
  const archivos = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.svg')) : [];
  const error = (nombre, motivo) => errores.push({ archivo: `src/assets/pictos/${nombre}.svg`, campo: '(archivo)', motivo });
  for (const nombre of lista) {
    if (!archivos.includes(`${nombre}.svg`)) {
      error(nombre, 'falta el SVG del pictograma de la lista del esquema');
      continue;
    }
    const svg = readFileSync(join(dir, `${nombre}.svg`), 'utf8');
    if (!/^\s*<svg[\s>]/.test(svg)) error(nombre, 'no empieza con <svg>');
    if (!svg.includes('aria-hidden="true"')) error(nombre, 'le falta aria-hidden="true"');
    if (!svg.includes('stroke="currentColor"')) error(nombre, 'debe heredar el color con stroke="currentColor"');
    if (/<(script|style|image|text|foreignObject)\b/i.test(svg)) error(nombre, 'contiene un elemento no permitido (script, style, image, text, foreignObject)');
    if (/\bhref\s*=|url\(|#[0-9a-f]{3,8}\b|rgba?\(/i.test(svg)) error(nombre, 'no puede llevar enlaces ni colores fijos');
    if (svg.replace('http://www.w3.org/2000/svg', '').includes('http')) error(nombre, 'no puede referirse a otras direcciones');
  }
  for (const f of archivos) {
    const nombre = f.replace(/\.svg$/, '');
    if (!lista.includes(nombre)) error(nombre, 'no está en la lista del esquema: hay que añadirlo a $defs.pictograma o quitar el archivo');
  }
  return { errores };
}
