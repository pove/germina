// Enlace de progreso (especificación, 6.3): formato binario, Base32 de Crockford y CRC-16/CCITT-FALSE.
import {
  ELEMENTOS, SEMANAS, VERANOS, claveSemana, claveVerano, claveCurso, leerClaveCurso, leerClaveSemilla,
  type Curso, type Datos, type Elemento, type Semilla,
} from './tipos';

export const VERSION_ENLACE = 1;
export const BASE_POR_DEFECTO = 'https://pove.github.io/germina/';

/** Código de cada área en el enlace. Igual que `config/catalogo.json`: nunca se reordena. */
export const CODIGOS_AREA: Readonly<Record<string, number>> = {
  matematicas: 1,
  'lengua-castellana': 2,
  valenciano: 3,
  'lengua-extranjera': 4,
  'conocimiento-medio': 5,
  lectura: 6,
};

/** Lo que trae un enlace, listo para combinar. */
export interface Recibido {
  cursos: string[];
  progreso: Datos['progreso'];
}

export type MotivoError = 'vacio' | 'caracteres' | 'version' | 'crc' | 'formato';

export type Decodificado = { ok: true; recibido: Recibido } | { ok: false; motivo: MotivoError };

// --- CRC-16/CCITT-FALSE: polinomio 0x1021, valor inicial 0xFFFF, sin reflejar ---

export function crc16(bytes: Uint8Array): number {
  let crc = 0xffff;
  for (const b of bytes) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc;
}

// --- Base32 de Crockford ---

const ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function base32Codificar(bytes: Uint8Array): string {
  let salida = '';
  let acumulado = 0;
  let bits = 0;
  for (const b of bytes) {
    acumulado = (acumulado << 8) | b;
    bits += 8;
    while (bits >= 5) {
      salida += ALFABETO[(acumulado >> (bits - 5)) & 31];
      bits -= 5;
    }
    acumulado &= (1 << bits) - 1;
  }
  if (bits > 0) salida += ALFABETO[(acumulado << (5 - bits)) & 31];
  return salida;
}

/** Quita espacios y guiones, ignora mayúsculas y lee O como 0 e I, L como 1. */
export function normalizarCodigo(texto: string): string {
  return texto.replace(/[\s-]+/g, '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1');
}

/** `null` si hay caracteres que no son de Crockford o los bits de relleno no son cero. */
export function base32Decodificar(texto: string): Uint8Array | null {
  const limpio = normalizarCodigo(texto);
  const bytes: number[] = [];
  let acumulado = 0;
  let bits = 0;
  for (const c of limpio) {
    const v = ALFABETO.indexOf(c);
    if (v < 0) return null;
    acumulado = (acumulado << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bytes.push((acumulado >> (bits - 8)) & 255);
      bits -= 8;
    }
    acumulado &= (1 << bits) - 1;
  }
  if (bits >= 5 || acumulado !== 0) return null; // el relleno de un código bien hecho es de menos de 5 bits, todos a cero
  return Uint8Array.from(bytes);
}

/** Grupos de 4 separados por guiones, para copiar a mano. */
export const agruparCodigo = (codigo: string): string => normalizarCodigo(codigo).replace(/(.{4})(?=.)/g, '$1-');

export const enlaceDe = (codigo: string, base: string = BASE_POR_DEFECTO): string => `${base}#/recibir/${normalizarCodigo(codigo)}`;

/** Saca el código de lo que pegue la persona: un enlace completo o el texto en grupos. */
export function codigoDeTexto(texto: string): string {
  const i = texto.indexOf('#/recibir/');
  return i >= 0 ? texto.slice(i + '#/recibir/'.length).split(/[?\s]/)[0] ?? '' : texto;
}

// --- Formato binario ---

/** Peso de cada casilla en el byte de una semilla: reto = 32, p1 = 16 … p5 = 1. */
const PESO: Record<Elemento, number> = { reto: 32, p1: 16, p2: 8, p3: 4, p4: 2, p5: 1 };

interface Bloque {
  ano: number;
  curso: Curso;
  semanas: Map<number, number>;
  veranos: Map<number, number>;
  records: Map<number, number>;
}

const mascara = (hecho: readonly Elemento[]): number => hecho.reduce((m, e) => m | PESO[e], 0);
const elementosDe = (m: number): Elemento[] => ELEMENTOS.filter((e) => m & PESO[e]);

function bloquesDe(datos: Datos): Bloque[] {
  const bloques = new Map<string, Bloque>();
  const dar = (ano: number, curso: Curso): Bloque => {
    const clave = `${ano}/${claveCurso(curso)}`;
    let b = bloques.get(clave);
    if (!b) bloques.set(clave, (b = { ano, curso, semanas: new Map(), veranos: new Map(), records: new Map() }));
    return b;
  };
  for (const [clave, semillas] of Object.entries(datos.progreso)) {
    const m = /^(\d{4})\/(.+)$/.exec(clave);
    const curso = leerClaveCurso(m?.[2]);
    if (!m || !curso || CODIGOS_AREA[curso.area] === undefined) continue;
    const b = dar(Number(m[1]), curso);
    for (const [cs, semilla] of Object.entries(semillas)) {
      const id = leerClaveSemilla(cs);
      if (!id) continue;
      const mk = mascara(semilla.hecho);
      if (mk) (id.verano ? b.veranos : b.semanas).set(id.n, mk);
      if (semilla.record !== undefined) b.records.set(id.verano ? 100 + id.n : id.n, semilla.record);
    }
  }
  // Los cursos guardados sin nada marcado también viajan, como bloque vacío del último año de curso.
  if (datos.ultimoAnoCurso !== null) {
    for (const c of datos.cursos) {
      const curso = leerClaveCurso(c);
      if (!curso || CODIGOS_AREA[curso.area] === undefined) continue;
      if (![...bloques.values()].some((b) => claveCurso(b.curso) === c)) dar(datos.ultimoAnoCurso, curso);
    }
  }
  return [...bloques.values()].sort(
    (x, y) => x.ano - y.ano || x.curso.ciclo - y.curso.ciclo || CODIGOS_AREA[x.curso.area]! - CODIGOS_AREA[y.curso.area]! || x.curso.curso - y.curso.curso,
  );
}

/** Pone un bit por cada número marcado, de izquierda a derecha, en `bytes` bytes. */
function bitmap(marcados: Iterable<number>, bytes: number): number[] {
  const salida = new Array<number>(bytes).fill(0);
  for (const n of marcados) salida[(n - 1) >> 3]! |= 0x80 >> ((n - 1) & 7);
  return salida;
}

export function codificar(datos: Datos): Uint8Array {
  const bloques = bloquesDe(datos);
  if (bloques.length > 255) throw new RangeError('Hay demasiados cursos y años para un solo enlace');
  const bytes: number[] = [VERSION_ENLACE, bloques.length];
  for (const b of bloques) {
    bytes.push(b.ano - 2000, b.curso.ciclo, CODIGOS_AREA[b.curso.area]!, b.curso.curso);
    const semanas = [...b.semanas.keys()].sort((x, y) => x - y);
    bytes.push(...bitmap(semanas, 6), ...semanas.map((n) => b.semanas.get(n)!));
    const veranos = [...b.veranos.keys()].sort((x, y) => x - y);
    bytes.push(...bitmap(veranos, 2), ...veranos.map((n) => b.veranos.get(n)!));
    const records = [...b.records.keys()].sort((x, y) => x - y);
    bytes.push(records.length);
    for (const pos of records) bytes.push(pos, b.records.get(pos)!);
  }
  const crc = crc16(Uint8Array.from(bytes));
  bytes.push(crc >> 8, crc & 255);
  return Uint8Array.from(bytes);
}

/** El código en Base32, sin guiones. */
export const codigoDeDatos = (datos: Datos): string => base32Codificar(codificar(datos));

class Lector {
  pos = 0;
  constructor(private readonly bytes: Uint8Array, private readonly fin: number) {}
  byte(): number {
    if (this.pos >= this.fin) throw new FormatoError();
    return this.bytes[this.pos++]!;
  }
  get completo(): boolean {
    return this.pos === this.fin;
  }
}

class FormatoError extends Error {}

function leerBitmap(l: Lector, bytes: number, max: number): number[] {
  const marcados: number[] = [];
  for (let i = 0; i < bytes; i++) {
    const b = l.byte();
    for (let bit = 0; bit < 8; bit++) {
      if (!(b & (0x80 >> bit))) continue;
      const n = i * 8 + bit + 1;
      if (n > max) throw new FormatoError(); // relleno que debía ser cero
      marcados.push(n);
    }
  }
  return marcados;
}

function leerMascaras(l: Lector, marcados: number[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const n of marcados) {
    const v = l.byte();
    if (v < 1 || v > 63) throw new FormatoError();
    m.set(n, v);
  }
  return m;
}

const NOMBRE_AREA = new Map(Object.entries(CODIGOS_AREA).map(([nombre, codigo]) => [codigo, nombre]));

/** Lee los bytes de un enlace: comprueba versión, CRC y formato. Nunca lanza. */
export function decodificarBytes(bytes: Uint8Array): Decodificado {
  if (bytes.length === 0) return { ok: false, motivo: 'vacio' };
  if (bytes.length < 4) return { ok: false, motivo: 'formato' };
  const fin = bytes.length - 2;
  if (crc16(bytes.subarray(0, fin)) !== ((bytes[fin]! << 8) | bytes[fin + 1]!)) return { ok: false, motivo: 'crc' };
  if (bytes[0] !== VERSION_ENLACE) return { ok: false, motivo: 'version' };
  try {
    const l = new Lector(bytes, fin);
    l.byte();
    const cuantos = l.byte();
    const recibido: Recibido = { cursos: [], progreso: {} };
    const vistos = new Set<string>();
    for (let i = 0; i < cuantos; i++) {
      const ano = l.byte() + 2000;
      const ciclo = l.byte();
      const area = NOMBRE_AREA.get(l.byte());
      const curso = l.byte();
      if (ciclo < 1 || ciclo > 3 || curso < 1 || curso > 6 || !area) throw new FormatoError();
      const clave = claveCurso({ ciclo, area, curso });
      const semillas: Record<string, Semilla> = {};
      const semanas = leerMascaras(l, leerBitmap(l, 6, SEMANAS));
      const veranos = leerMascaras(l, leerBitmap(l, 2, VERANOS));
      for (const [n, m] of semanas) semillas[claveSemana(n)] = { hecho: elementosDe(m) };
      for (const [n, m] of veranos) semillas[claveVerano(n)] = { hecho: elementosDe(m) };
      for (let r = l.byte(); r > 0; r--) {
        const pos = l.byte();
        const valor = l.byte();
        const verano = pos >= 101 && pos <= 100 + VERANOS;
        if (!verano && (pos < 1 || pos > SEMANAS)) throw new FormatoError();
        const id = verano ? claveVerano(pos - 100) : claveSemana(pos);
        semillas[id] = { hecho: semillas[id]?.hecho ?? [], record: valor };
      }
      const id = `${ano}/${clave}`;
      if (vistos.has(id)) throw new FormatoError();
      vistos.add(id);
      if (!recibido.cursos.includes(clave)) recibido.cursos.push(clave);
      if (Object.keys(semillas).length > 0) recibido.progreso[id] = semillas;
    }
    if (!l.completo) throw new FormatoError();
    return { ok: true, recibido };
  } catch (e) {
    if (e instanceof FormatoError) return { ok: false, motivo: 'formato' };
    throw e;
  }
}

/** Lee un código escrito o pegado (con o sin guiones, mayúsculas o minúsculas). */
export function decodificar(codigo: string): Decodificado {
  const bytes = base32Decodificar(codigo);
  if (bytes === null) return { ok: false, motivo: 'caracteres' };
  return decodificarBytes(bytes);
}
