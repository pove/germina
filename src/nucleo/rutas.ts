// Rutas de la web con almohadilla (especificación, 3). Funciones puras.
import { SEMANAS, VERANOS, type Curso } from './tipos';

export type Ruta =
  | { tipo: 'inicio' }
  | { tipo: 'bienvenida' }
  | ({ tipo: 'semana'; n: number } & Curso)
  | ({ tipo: 'pregunta'; n: number; p: number } & Curso)
  | ({ tipo: 'reto'; n: number } & Curso)
  | ({ tipo: 'verano'; n: number } & Curso)
  | ({ tipo: 'veranoReto'; n: number } & Curso)
  | ({ tipo: 'jardin' } & Curso)
  | ({ tipo: 'aprenden' } & Curso)
  | { tipo: 'ayuda' }
  | { tipo: 'ajustes' }
  | { tipo: 'pasar' }
  | { tipo: 'recibir'; codigo: string }
  | { tipo: 'imprimirRecords' }
  | { tipo: 'privacidad' }
  | { tipo: 'accesibilidad' }
  | { tipo: 'desconocida' };

/** Solo el curso de una ruta (sin su tipo ni su semana), para construir otras rutas. */
export const cursoDe = (r: Curso): Curso => ({ ciclo: r.ciclo, area: r.area, curso: r.curso });

const DESCONOCIDA: Ruta = { tipo: 'desconocida' };
const MAX_CODIGO = 4000;

/** Número entero positivo escrito sin ceros a la izquierda, dentro del rango. */
function entero(texto: string | undefined, max: number): number | null {
  if (texto === undefined || !/^[1-9]\d*$/.test(texto)) return null;
  const n = Number(texto);
  return n <= max ? n : null;
}

function leerCurso(ciclo?: string, area?: string, curso?: string): Curso | null {
  const c = entero(ciclo, 3);
  const k = entero(curso, 6);
  if (c === null || k === null || area === undefined || !/^[a-z]+(?:-[a-z]+)*$/.test(area)) return null;
  return { ciclo: c, area, curso: k };
}

/** Interpreta un `location.hash`. Una ruta que no se entiende da `desconocida` (la app va a `#/`). */
export function interpretar(hash: string): Ruta {
  const limpio = hash.replace(/^#/, '');
  const partes = limpio.split('/').filter((p) => p !== '');
  const [a, b, c, d, e, f, g] = partes;

  if (partes.length === 0) return { tipo: 'inicio' };
  if (/^\d$/.test(a ?? '')) {
    const curso = leerCurso(a, b, c);
    if (!curso) return DESCONOCIDA;
    if (d === 'semana') {
      const n = entero(e, SEMANAS);
      if (n === null) return DESCONOCIDA;
      if (partes.length === 5) return { tipo: 'semana', ...curso, n };
      if (partes.length === 6 && f === 'reto') return { tipo: 'reto', ...curso, n };
      if (partes.length === 7 && f === 'pregunta') {
        const p = entero(g, 5);
        return p === null ? DESCONOCIDA : { tipo: 'pregunta', ...curso, n, p };
      }
    } else if (d === 'verano') {
      const n = entero(e, VERANOS);
      if (n === null) return DESCONOCIDA;
      if (partes.length === 5) return { tipo: 'verano', ...curso, n };
      if (partes.length === 6 && f === 'reto') return { tipo: 'veranoReto', ...curso, n };
    } else if (partes.length === 4 && d === 'jardin') return { tipo: 'jardin', ...curso };
    else if (partes.length === 4 && d === 'aprenden') return { tipo: 'aprenden', ...curso };
    return DESCONOCIDA;
  }

  if (partes.length === 1) {
    switch (a) {
      case 'bienvenida': return { tipo: 'bienvenida' };
      case 'ayuda': return { tipo: 'ayuda' };
      case 'ajustes': return { tipo: 'ajustes' };
      case 'privacidad': return { tipo: 'privacidad' };
      case 'accesibilidad': return { tipo: 'accesibilidad' };
    }
  }
  if (partes.length === 2 && a === 'ajustes' && b === 'pasar') return { tipo: 'pasar' };
  if (partes.length === 2 && a === 'imprimir' && b === 'records') return { tipo: 'imprimirRecords' };
  if (partes.length === 2 && a === 'recibir' && b !== undefined) {
    let codigo: string;
    try {
      codigo = decodeURIComponent(b);
    } catch {
      return DESCONOCIDA;
    }
    return /^[0-9A-Za-z-]+$/.test(codigo) && codigo.length <= MAX_CODIGO ? { tipo: 'recibir', codigo } : DESCONOCIDA;
  }
  return DESCONOCIDA;
}

const deCurso = (c: Curso): string => `${c.ciclo}/${c.area}/${c.curso}`;

/** Construye el `hash` de una ruta. La inversa de `interpretar`. */
export function construir(ruta: Ruta): string {
  switch (ruta.tipo) {
    case 'inicio': case 'desconocida': return '#/';
    case 'bienvenida': return '#/bienvenida';
    case 'semana': return `#/${deCurso(ruta)}/semana/${ruta.n}`;
    case 'pregunta': return `#/${deCurso(ruta)}/semana/${ruta.n}/pregunta/${ruta.p}`;
    case 'reto': return `#/${deCurso(ruta)}/semana/${ruta.n}/reto`;
    case 'verano': return `#/${deCurso(ruta)}/verano/${ruta.n}`;
    case 'veranoReto': return `#/${deCurso(ruta)}/verano/${ruta.n}/reto`;
    case 'jardin': return `#/${deCurso(ruta)}/jardin`;
    case 'aprenden': return `#/${deCurso(ruta)}/aprenden`;
    case 'ayuda': return '#/ayuda';
    case 'ajustes': return '#/ajustes';
    case 'pasar': return '#/ajustes/pasar';
    case 'recibir': return `#/recibir/${encodeURIComponent(ruta.codigo)}`;
    case 'imprimirRecords': return '#/imprimir/records';
    case 'privacidad': return '#/privacidad';
    case 'accesibilidad': return '#/accesibilidad';
  }
}
