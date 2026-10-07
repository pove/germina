// Reglas de contenido de una semilla (especificación, apartado 11).
// Todo error o aviso lleva archivo, campo y motivo.
import { huella } from './huella.mjs';
import { ErrorOperacion, evaluar, aTexto, comprobarIgualdad } from './operaciones.mjs';
import { palabrasProhibidasEn } from './palabras.mjs';

export const IDIOMAS = ['es', 'va', 'en', 'fr', 'ar'];

/** ['preguntas', 0, 'texto'] → «preguntas[0].texto» */
export function campoDe(ruta) {
  return ruta.reduce((acc, p) => (typeof p === 'number' ? `${acc}[${p}]` : acc ? `${acc}.${p}` : String(p)), '') || '(raíz)';
}

const esTexto = (v) =>
  v && typeof v === 'object' && !Array.isArray(v) && IDIOMAS.every((i) => i in v) && Object.keys(v).length === IDIOMAS.length;

/** Recorre el JSON entregando cada valor con su ruta, sin entrar en «revision». */
function* recorrer(nodo, ruta = []) {
  yield [nodo, ruta];
  if (Array.isArray(nodo)) {
    for (let i = 0; i < nodo.length; i++) yield* recorrer(nodo[i], [...ruta, i]);
  } else if (nodo && typeof nodo === 'object') {
    for (const [k, v] of Object.entries(nodo)) {
      if (ruta.length === 0 && k === 'revision') continue;
      yield* recorrer(v, [...ruta, k]);
    }
  }
}

/** Extrae los {{…}} de un texto. Devuelve {partes, problema}. */
export function extraerMarcado(texto) {
  const partes = [];
  let i = 0;
  while (i < texto.length) {
    const abre = texto.indexOf('{{', i);
    const cierra = texto.indexOf('}}', i);
    if (abre === -1 && cierra === -1) {
      return { partes, problema: /[{}]/.test(texto.slice(i)) ? 'llave suelta fuera de «{{…}}»' : null };
    }
    if (cierra !== -1 && (abre === -1 || cierra < abre)) return { partes, problema: '«}}» sin su «{{»' };
    if (/[{}]/.test(texto.slice(i, abre))) return { partes, problema: 'llave suelta fuera de «{{…}}»' };
    const fin = texto.indexOf('}}', abre + 2);
    if (fin === -1) return { partes, problema: '«{{» sin cerrar con «}}»' };
    const dentro = texto.slice(abre + 2, fin);
    if (dentro.includes('{{')) return { partes, problema: '«{{…}}» anidado' };
    if (/[{}]/.test(dentro)) return { partes, problema: 'llave suelta dentro de «{{…}}»' };
    if (dentro.trim() === '') return { partes, problema: '«{{}}» vacío' };
    partes.push(dentro.trim());
    i = fin + 2;
  }
  return { partes, problema: null };
}

const HUECO = /(?<!\{)\{([a-z_]+)\}(?!\})/g;

/**
 * Revisa todos los textos en cinco idiomas de un documento: marcado «{{…}}» equilibrado e idéntico en los
 * cinco idiomas, igualdades que cuadran y palabras de Germina (4, 6 y 8 de la especificación, apartado 11).
 * Con `huecos`, admite huecos con llaves simples ({n}) que deben ser los mismos en los cinco idiomas.
 * @param {object} documento
 * @param {{error: (ruta: (string|number)[], motivo: string) => void, aviso: (ruta: (string|number)[], motivo: string) => void, huecos?: boolean}} salida
 */
export function revisarTextos(documento, { error, aviso, huecos = false }) {
  for (const [valor, r] of recorrer(documento)) {
    if (!esTexto(valor)) continue;
    const porIdioma = {};
    const nombresDeHuecos = {};
    for (const idioma of IDIOMAS) {
      let texto = valor[idioma];
      if (huecos) {
        nombresDeHuecos[idioma] = [...texto.matchAll(HUECO)].map((m) => m[1]).sort();
        texto = texto.replace(HUECO, '');
      }
      const { partes, problema } = extraerMarcado(texto);
      if (problema) error([...r, idioma], problema);
      porIdioma[idioma] = partes;
      // 6. Palabras de Germina, en cualquier idioma.
      for (const p of palabrasProhibidasEn(valor[idioma])) error([...r, idioma], `aparece la palabra «${p}», que Germina no usa (especificación, 5.4)`);
    }
    // 4b. Las igualdades de «{{…}}» cuadran (se comprueba en español; el resto debe ser idéntico).
    for (const parte of porIdioma.es) {
      const res = comprobarIgualdad(parte);
      if (res.estado === 'no-cuadra') error([...r, 'es'], `«{{${parte}}}» no cuadra: ${res.detalle}`);
      else if (res.estado === 'no-evaluable') aviso([...r, 'es'], `no se puede comprobar «{{${parte}}}»: ${res.detalle}`);
    }
    // 8. Las operaciones (y los huecos) son idénticos en los cinco idiomas.
    const lista = (partes) => partes.map((x) => `{{${x}}}`).join(' ') || 'ninguna';
    for (const idioma of IDIOMAS.slice(1)) {
      const otras = porIdioma[idioma];
      if (otras.length !== porIdioma.es.length || otras.some((x, k) => x !== porIdioma.es[k])) {
        error([...r, idioma], `las operaciones «{{…}}» no son idénticas a las del español (es: ${lista(porIdioma.es)}; ${idioma}: ${lista(otras)})`);
      }
      if (huecos && nombresDeHuecos[idioma].join() !== nombresDeHuecos.es.join()) {
        error([...r, idioma], `los huecos no son los mismos que en español (es: ${nombresDeHuecos.es.map((x) => `{${x}}`).join(' ') || 'ninguno'}; ${idioma}: ${nombresDeHuecos[idioma].map((x) => `{${x}}`).join(' ') || 'ninguno'})`);
      }
    }
  }
}

/**
 * Valida una semilla ya leída.
 * @param {object} semilla
 * @param {string} archivo ruta relativa que se muestra en los mensajes
 * @param {object} ctx
 *   esquema: (semilla) => [{ruta, motivo}] · curriculo · mapa · existePicto(nombre)
 *   ruta: {ciclo, area, curso, id, semana?, verano?} deducida del nombre del archivo
 */
export function validarSemilla(semilla, archivo, ctx) {
  const errores = [];
  const avisos = [];
  const error = (ruta, motivo) => errores.push({ archivo, campo: campoDe(ruta), motivo });
  const aviso = (ruta, motivo) => avisos.push({ archivo, campo: campoDe(ruta), motivo });

  // 1. Esquema.
  const fallosEsquema = ctx.esquema(semilla);
  for (const f of fallosEsquema) error(f.ruta, f.motivo);
  if (fallosEsquema.length) return { errores, avisos }; // el resto de reglas supone la forma correcta

  const { ruta } = ctx;
  // 1b. Coincide con su ruta.
  if (semilla.id !== ruta.id) error(['id'], `«${semilla.id}» no coincide con la ruta del archivo (debería ser «${ruta.id}»)`);
  if (semilla.ciclo !== ruta.ciclo) error(['ciclo'], `es ${semilla.ciclo}, pero el archivo está en el ciclo ${ruta.ciclo}`);
  if (semilla.area !== ruta.area) error(['area'], `es «${semilla.area}», pero el archivo está en «${ruta.area}»`);
  if (semilla.curso !== ruta.curso) error(['curso'], `es ${semilla.curso}, pero el archivo está en la carpeta del curso ${ruta.curso}`);
  if (ruta.semana !== undefined && semilla.semana !== ruta.semana) error(['semana'], `es ${semilla.semana}, pero el archivo es la semana ${ruta.semana}`);
  if (ruta.verano !== undefined && semilla.verano !== ruta.verano) error(['verano'], `es ${semilla.verano}, pero el archivo es el verano ${ruta.verano}`);
  const esVerano = ruta.verano !== undefined;
  if (esVerano && semilla.tipo !== 'verano') error(['tipo'], 'un archivo de verano debe tener tipo «verano»');
  if (!esVerano && semilla.tipo === 'verano') error(['tipo'], 'una semana del curso no puede tener tipo «verano»');

  // 2. Saberes, criterios y tipos de problema del currículo, y de su ciclo.
  const { curriculo } = ctx;
  const saberes = new Map(curriculo.saberes.map((s) => [s.id, s]));
  const criterios = new Map(curriculo.criterios.map((c) => [c.id, c]));
  const tipos = new Set(curriculo.tiposProblema.map((t) => t.id));
  semilla.saberes.forEach((s, i) => {
    if (!saberes.has(s)) error(['saberes', i], `el saber «${s}» no existe en el currículo`);
    else if (!saberes.get(s).ciclos.includes(semilla.ciclo)) error(['saberes', i], `el saber «${s}» no es del ${semilla.ciclo}.º ciclo`);
  });
  semilla.criterios.forEach((c, i) => {
    if (!criterios.has(c)) error(['criterios', i], `el criterio «${c}» no existe en el currículo`);
    else if (criterios.get(c).ciclo !== semilla.ciclo) error(['criterios', i], `el criterio «${c}» no es del ${semilla.ciclo}.º ciclo`);
  });
  semilla.preguntas.forEach((p, i) => {
    if (!tipos.has(p.tipoProblema)) error(['preguntas', i, 'tipoProblema'], `el tipo de problema «${p.tipoProblema}» no existe en el currículo`);
  });

  // 3. Coincide con su semana del mapa.
  const delCurso = ctx.mapa && (esVerano ? ctx.mapa.verano?.[String(semilla.curso)] : ctx.mapa.cursos?.[String(semilla.curso)]);
  const entrada = delCurso?.[(esVerano ? semilla.verano : semilla.semana) - 1];
  if (!entrada) {
    error([esVerano ? 'verano' : 'semana'], 'no hay entrada para esta semilla en mapa-semanas.json');
  } else {
    const tipoMapa = esVerano ? 'verano' : entrada.tipo;
    if (semilla.titulo.es !== entrada.titulo) error(['titulo', 'es'], `«${semilla.titulo.es}» no coincide con el título del mapa «${entrada.titulo}»`);
    if (semilla.tipo !== tipoMapa) error(['tipo'], `«${semilla.tipo}» no coincide con el tipo del mapa «${tipoMapa}»`);
    for (const campo of ['saberes', 'criterios']) {
      const falta = entrada[campo].filter((x) => !semilla[campo].includes(x));
      const sobra = semilla[campo].filter((x) => !entrada[campo].includes(x));
      if (falta.length) error([campo], `faltan los del mapa: ${falta.join(', ')}`);
      if (sobra.length) error([campo], `sobran respecto al mapa: ${sobra.join(', ')}`);
    }
    const rapidezMapa = entrada.rapidez === true;
    const rapidezSemilla = Boolean(semilla.reto.rapidez);
    if (rapidezMapa && !rapidezSemilla) error(['reto', 'rapidez'], 'el mapa marca un juego de rapidez y el reto no lo tiene');
    if (!rapidezMapa && rapidezSemilla) error(['reto', 'rapidez'], 'el reto tiene cronómetro, pero el mapa no lo marca como juego de rapidez');
    const recupera = semilla.preguntas[3].recupera;
    if (semilla.tipo === 'recordar' && entrada.recupera && !entrada.recupera.includes(recupera)) {
      aviso(['preguntas', 3, 'recupera'], `la semana ${recupera} no está entre las que recupera el mapa (${entrada.recupera.join(', ')})`);
    }
  }

  // 5. «recupera» es una semana anterior.
  const recupera = semilla.preguntas[3].recupera;
  if (!esVerano) {
    const n = semilla.semana;
    if (n === 1 && recupera !== 0) error(['preguntas', 3, 'recupera'], 'en la semana 1 debe ser 0 (el curso anterior)');
    if (n > 1 && !(recupera >= 1 && recupera < n)) error(['preguntas', 3, 'recupera'], `${recupera} no es una semana anterior a la ${n}`);
  } else if (recupera < 1) {
    error(['preguntas', 3, 'recupera'], 'en verano debe ser una semana del curso (1 a 41)');
  }

  // 4. Operaciones, resultados e igualdades.
  semilla.preguntas.forEach((p, i) => {
    if (p.respuesta.tipo !== 'calculo') return;
    try {
      const v = evaluar(p.respuesta.operacion, { soloEnteros: true });
      if (v.d !== 1n || v.n !== BigInt(p.respuesta.resultado)) {
        error(['preguntas', i, 'respuesta', 'resultado'], `«${p.respuesta.operacion}» da ${aTexto(v)}, no ${p.respuesta.resultado}`);
      }
    } catch (e) {
      if (!(e instanceof ErrorOperacion)) throw e;
      error(['preguntas', i, 'respuesta', 'operacion'], `no se puede calcular «${p.respuesta.operacion}»: ${e.message}`);
    }
  });

  // 4b, 6 y 8. Marcado «{{…}}», igualdades y palabras de Germina en todos los textos.
  revisarTextos(semilla, { error, aviso });

  // 9. Cada pictograma tiene su SVG.
  semilla.reto.pasos.forEach((paso, i) => {
    if (!ctx.existePicto(paso.pictograma)) {
      error(['reto', 'pasos', i, 'pictograma'], `falta el SVG del pictograma «${paso.pictograma}» (src/assets/pictos/${paso.pictograma}.svg)`);
    }
  });

  // 7. Huellas de las traducciones (avisos, no errores).
  const actual = huella(semilla);
  for (const idioma of IDIOMAS.slice(1)) {
    const t = semilla.revision.traducciones[idioma];
    if (t.huella === actual) continue;
    const donde = ['revision', 'traducciones', idioma, 'huella'];
    if (t.estado === 'revisada') aviso(donde, `la traducción está revisada, pero el español ha cambiado desde entonces (huella ${t.huella}, ahora ${actual}); cuenta como automática`);
    else aviso(donde, `la huella (${t.huella}) no es la del español actual (${actual}): hay que volver a generar la traducción`);
  }
  const fecha = semilla.revision.docente.fecha;
  if (fecha !== undefined && !(/^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(Date.parse(fecha)))) {
    error(['revision', 'docente', 'fecha'], `«${fecha}» no es una fecha AAAA-MM-DD`);
  }

  return { errores, avisos };
}
