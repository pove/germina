// Evaluador de operaciones de clase: + - × : y paréntesis, sin eval ni Function.
// Usa fracciones exactas (BigInt), así que 1,5 + 2,5 = 4 y 7 : 2 = 3,5 son exactos.
// Acepta «−» (U+2212) además de «-». Los espacios se ignoran.

export class ErrorOperacion extends Error {}

const mcd = (a, b) => (b === 0n ? (a < 0n ? -a : a) : mcd(b, a % b));

function fraccion(n, d = 1n) {
  if (d === 0n) throw new ErrorOperacion('división entre cero');
  if (d < 0n) [n, d] = [-n, -d];
  const g = mcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}

const esEntera = (f) => f.d === 1n;

function tokenizar(texto, decimales) {
  const fichas = [];
  const limpio = texto.replace(/−/g, '-');
  const re = /\s*(?:(\d+(?:,\d+)?)|(.))/gy;
  let m;
  while (re.lastIndex < limpio.length && (m = re.exec(limpio))) {
    if (m[1] !== undefined) {
      if (m[1].includes(',') && !decimales) throw new ErrorOperacion(`decimal «${m[1]}» no permitido aquí`);
      fichas.push({ t: 'num', v: m[1] });
    } else if (m[2] !== undefined && /[+\-×:()]/.test(m[2])) {
      fichas.push({ t: m[2] });
    } else if (m[2] !== undefined && m[2].trim() !== '') {
      throw new ErrorOperacion(`carácter no válido «${m[2]}»`);
    }
  }
  // Los espacios finales los consume el patrón de arriba sin producir ficha.
  return fichas;
}

function numero(texto) {
  const [ent, dec = ''] = texto.split(',');
  return fraccion(BigInt(ent + dec), 10n ** BigInt(dec.length));
}

/**
 * Evalúa una operación y devuelve una fracción {n, d} (BigInt).
 * @param {string} texto
 * @param {{decimales?: boolean, soloEnteros?: boolean}} [opciones]
 *   decimales: admite coma decimal. soloEnteros: cada resultado intermedio debe ser entero.
 */
export function evaluar(texto, { decimales = false, soloEnteros = false } = {}) {
  const fichas = tokenizar(texto, decimales);
  if (!fichas.length) throw new ErrorOperacion('operación vacía');
  let pos = 0;
  const ver = () => fichas[pos]?.t;
  const comprobar = (f) => {
    if (soloEnteros && !esEntera(f)) throw new ErrorOperacion('división no exacta');
    return f;
  };

  function factor() {
    const f = fichas[pos++];
    if (!f) throw new ErrorOperacion('la operación termina de forma inesperada');
    if (f.t === 'num') return numero(f.v);
    if (f.t === '(') {
      const v = expresion();
      if (fichas[pos++]?.t !== ')') throw new ErrorOperacion('paréntesis sin cerrar');
      return v;
    }
    throw new ErrorOperacion(`no se esperaba «${f.t}»`);
  }

  function termino() {
    let v = factor();
    while (ver() === '×' || ver() === ':') {
      const op = fichas[pos++].t;
      const w = factor();
      v = op === '×' ? fraccion(v.n * w.n, v.d * w.d) : fraccion(v.n * w.d, v.d * w.n);
      comprobar(v);
    }
    return v;
  }

  function expresion() {
    let v = termino();
    while (ver() === '+' || ver() === '-') {
      const op = fichas[pos++].t;
      const w = termino();
      const nn = op === '+' ? v.n * w.d + w.n * v.d : v.n * w.d - w.n * v.d;
      v = fraccion(nn, v.d * w.d);
    }
    return v;
  }

  const resultado = expresion();
  if (pos < fichas.length) throw new ErrorOperacion(pos < fichas.length && fichas[pos].t === ')' ? 'paréntesis de más' : `no se esperaba «${fichas[pos].t}»`);
  return resultado;
}

export const iguales = (a, b) => a.n === b.n && a.d === b.d;

/** Texto legible de una fracción: entero o decimal con coma (si no es exacto, «n/d»). */
export function aTexto(f) {
  if (esEntera(f)) return String(f.n);
  let d = f.d;
  let dos = 0;
  let cinco = 0;
  while (d % 2n === 0n) { d /= 2n; dos++; }
  while (d % 5n === 0n) { d /= 5n; cinco++; }
  if (d !== 1n) return `${f.n}/${f.d}`;
  const cifras = Math.max(dos, cinco);
  const escala = 10n ** BigInt(cifras);
  const total = (f.n * escala) / f.d;
  const neg = total < 0n;
  const s = (neg ? -total : total).toString().padStart(cifras + 1, '0');
  return `${neg ? '-' : ''}${s.slice(0, -cifras)},${s.slice(-cifras)}`;
}

/**
 * Comprueba las igualdades de una expresión con «=» (admite cadenas: a = b = c).
 * @returns {{estado: 'sin-igualdad'|'cuadra'|'no-cuadra'|'no-evaluable', detalle?: string}}
 */
export function comprobarIgualdad(texto) {
  const partes = texto.split('=');
  if (partes.length < 2) return { estado: 'sin-igualdad' };
  let valores;
  try {
    valores = partes.map((p) => evaluar(p, { decimales: true }));
  } catch (e) {
    if (e instanceof ErrorOperacion) return { estado: 'no-evaluable', detalle: e.message };
    throw e;
  }
  for (let i = 1; i < valores.length; i++) {
    if (!iguales(valores[0], valores[i])) {
      return { estado: 'no-cuadra', detalle: `${partes[0].trim()} da ${aTexto(valores[0])}, no ${partes[i].trim()}` };
    }
  }
  return { estado: 'cuadra' };
}
