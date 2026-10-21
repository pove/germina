// Buscar en las semillas (`contenido/busqueda-{idioma}.json`). Funciones puras.
import { sinMarcado } from './marcado';

/** Una semilla en el índice de un idioma. `tema` y `saberes` solo están en el de español. */
export interface EntradaBusqueda {
  clave: string;
  titulo: string;
  objetivo: string;
  reto: string;
  preguntas: string[];
  tema?: string;
  saberes?: string[];
}

export interface IndiceBusqueda {
  version: 1;
  semillas: EntradaBusqueda[];
}

/** Dónde ha salido lo buscado. Las preguntas, de 1 a 5. */
export type Lugar = { tipo: 'titulo' } | { tipo: 'objetivo' } | { tipo: 'reto' } | { tipo: 'pregunta'; p: number } | { tipo: 'tema' } | { tipo: 'saber' };

export interface Coincidencia {
  lugar: Lugar;
  texto: string;
  /** El texto sale del índice en español aunque se haya elegido otro idioma (lo que solo coincide en español). */
  deEspanol: boolean;
}

export interface Resultado {
  clave: string;
  /** El título en el idioma elegido. */
  titulo: string;
  /** Dónde sale, sin el título, en el orden de la semilla. */
  coincidencias: Coincidencia[];
}

/** Sin mayúsculas, tildes ni marcado, y en árabe sin vocales cortas, sin tatweel y con un solo alif. */
export function normalizar(texto: string): string {
  return sinMarcado(texto)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ـ/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .toLowerCase();
}

/** Las palabras de lo buscado. Las de una o dos letras («de», «la») se dejan fuera si hay otras. */
export function palabras(consulta: string): string[] {
  const todas = [...new Set(normalizar(consulta).split(/[^\p{L}\p{N}]+/u).filter((p) => p !== ''))];
  const largas = todas.filter((p) => p.length >= 3 || /^\p{N}+$/u.test(p));
  return largas.length > 0 ? largas : todas;
}

function lugares(e: EntradaBusqueda): { lugar: Lugar; texto: string }[] {
  return [
    { lugar: { tipo: 'titulo' }, texto: e.titulo },
    { lugar: { tipo: 'objetivo' }, texto: e.objetivo },
    { lugar: { tipo: 'reto' }, texto: e.reto },
    ...e.preguntas.map((texto, i) => ({ lugar: { tipo: 'pregunta', p: i + 1 } as Lugar, texto })),
    ...(e.tema ? [{ lugar: { tipo: 'tema' } as Lugar, texto: e.tema }] : []),
    ...(e.saberes ?? []).map((texto) => ({ lugar: { tipo: 'saber' } as Lugar, texto })),
  ];
}

const orden = (l: Lugar): number => ['titulo', 'objetivo', 'reto', 'pregunta', 'tema', 'saber'].indexOf(l.tipo) * 10 + (l.tipo === 'pregunta' ? l.p : 0);

const mismoLugar = (a: Lugar, b: Lugar): boolean => a.tipo === b.tipo && (a.tipo !== 'pregunta' || (b.tipo === 'pregunta' && a.p === b.p));

/**
 * Las semillas donde salen todas las palabras de lo buscado, en el idioma elegido o en español (`espanol`, `null` si
 * el elegido ya es el español), en el orden del índice. Un lugar cuenta si tiene alguna de las palabras; si coincide en
 * los dos idiomas, se enseña en el elegido. El tema del mapa y los saberes solo se enseñan si no coincide nada más.
 */
export function buscar(consulta: string, indice: IndiceBusqueda, espanol: IndiceBusqueda | null): Resultado[] {
  const buscadas = palabras(consulta);
  if (buscadas.length === 0) return [];
  const porClave = new Map((espanol?.semillas ?? []).map((e) => [e.clave, e]));
  const resultados: Resultado[] = [];
  for (const entrada of indice.semillas) {
    const enEspanol = porClave.get(entrada.clave);
    const candidatos = [
      ...lugares(entrada).map((l) => ({ ...l, deEspanol: false })),
      ...(enEspanol ? lugares(enEspanol).map((l) => ({ ...l, deEspanol: true })) : []),
    ].map((l) => ({ ...l, normal: normalizar(l.texto) }));
    if (!buscadas.every((p) => candidatos.some((c) => c.normal.includes(p)))) continue;
    const coinciden = candidatos.filter((c) => c.lugar.tipo !== 'titulo' && buscadas.some((p) => c.normal.includes(p)));
    const delCurriculo = (l: Lugar): boolean => l.tipo === 'tema' || l.tipo === 'saber';
    const deLaSemilla = coinciden.filter((c, i) => !delCurriculo(c.lugar) && !coinciden.slice(0, i).some((x) => mismoLugar(x.lugar, c.lugar)));
    const elegidos = deLaSemilla.length > 0 ? deLaSemilla.sort((a, b) => orden(a.lugar) - orden(b.lugar)) : coinciden.filter((c) => delCurriculo(c.lugar));
    resultados.push({
      clave: entrada.clave,
      titulo: entrada.titulo,
      coincidencias: elegidos.map(({ lugar, texto, deEspanol }) => ({ lugar, texto, deEspanol })),
    });
  }
  return resultados;
}

/** Los resultados por curso (`2/matematicas/3`): primero los cursos de la familia, en su orden, y luego los demás. */
export function porCurso(resultados: readonly Resultado[], deLaFamilia: readonly string[]): { curso: string; resultados: Resultado[] }[] {
  const grupos = new Map<string, Resultado[]>();
  for (const r of resultados) {
    const curso = r.clave.split('/').slice(0, 3).join('/');
    grupos.set(curso, [...(grupos.get(curso) ?? []), r]);
  }
  const posicion = (c: string): number => (deLaFamilia.includes(c) ? deLaFamilia.indexOf(c) : deLaFamilia.length);
  return [...grupos].map(([curso, rs]) => ({ curso, resultados: rs })).sort((a, b) => posicion(a.curso) - posicion(b.curso));
}
