import { describe, expect, it } from 'vitest';
import { buscar, normalizar, palabras, porCurso, type EntradaBusqueda, type IndiceBusqueda } from './buscar';

const entrada = (clave: string, campos: Partial<EntradaBusqueda>): EntradaBusqueda => ({
  clave, titulo: '', objetivo: '', reto: '', preguntas: ['', '', '', '', ''], ...campos,
});
const indice = (...semillas: EntradaBusqueda[]): IndiceBusqueda => ({ version: 1, semillas });

const ES = indice(
  entrada('2/matematicas/3/s02', {
    titulo: '¡Mil!',
    objetivo: 'Esta semana llegan al millar: diez centenas hacen 1000.',
    preguntas: ['Hay 2 cajas de 1000 folios.', '¿Cuántas unidades de millar tiene {{2345}}?', '', '', ''],
    tema: 'Llegamos al millar: números de cuatro cifras',
    saberes: ['Lectura de numerales superiores al millar'],
  }),
  entrada('2/matematicas/3/s07', { titulo: 'Abrir una decena', objetivo: 'Se abre una decena y salen 10 unidades.', tema: 'Resta con llevada' }),
  entrada('2/matematicas/4/s01', { titulo: 'Números grandes', objetivo: 'Leen números grandes.', tema: 'Hasta la centena de millar', saberes: ['Numerales superiores al millar'] }),
);

const VA = indice(
  entrada('2/matematicas/3/s02', {
    titulo: 'Mil!',
    objetivo: 'Aquesta setmana arriben al miler (millar): deu centenes fan 1000.',
    preguntas: ['Hi ha 2 caixes de 1000 fulls.', 'Quantes unitats de miler té {{2345}}?', '', '', ''],
  }),
  entrada('2/matematicas/3/s07', { titulo: 'Obrir una desena', objetivo: "S'obri una desena i ixen 10 unitats." }),
  entrada('2/matematicas/4/s01', { titulo: 'Nombres grans', objetivo: 'Llegeixen nombres grans.' }),
);

describe('normalizar', () => {
  it('sin mayúsculas, tildes ni marcado', () => {
    expect(normalizar('Cuántas UNIDADES {{2 + 3 = 5}}')).toBe('cuantas unidades 2 + 3 = 5');
    expect(normalizar('Ça déçoit')).toBe('ca decoit');
  });

  it('en árabe, sin vocales cortas ni tatweel y con un solo alif', () => {
    expect(normalizar('الأَلْف')).toBe(normalizar('الالف'));
    expect(normalizar('إلـى')).toBe('الى');
  });
});

describe('palabras', () => {
  it('deja fuera las palabras cortas si hay otras', () => {
    expect(palabras('Unidades de millar')).toEqual(['unidades', 'millar']);
    expect(palabras('  la  ')).toEqual(['la']);
  });

  it('los números cuentan aunque sean cortos, y no se repite nada', () => {
    expect(palabras('tabla del 7, tabla')).toEqual(['tabla', 'del', '7']);
  });

  it('nada que buscar', () => {
    expect(palabras('  ¿? ')).toEqual([]);
  });
});

describe('buscar', () => {
  it('en español: las semillas con todas las palabras, en el orden del índice', () => {
    expect(buscar('millar', ES, null).map((r) => r.clave)).toEqual(['2/matematicas/3/s02', '2/matematicas/4/s01']);
    expect(buscar('unidades de millar', ES, null).map((r) => r.clave)).toEqual(['2/matematicas/3/s02']);
    expect(buscar('decena', ES, null).map((r) => r.clave)).toEqual(['2/matematicas/3/s07']);
    expect(buscar('dinosaurio', ES, null)).toEqual([]);
    expect(buscar('', ES, null)).toEqual([]);
  });

  it('dice dónde sale, sin el título; el tema y los saberes solo si no sale en la semilla', () => {
    const [mil, grandes] = buscar('millar', ES, null);
    expect(mil?.titulo).toBe('¡Mil!');
    expect(mil?.coincidencias).toEqual([
      { lugar: { tipo: 'objetivo' }, texto: 'Esta semana llegan al millar: diez centenas hacen 1000.', deEspanol: false },
      { lugar: { tipo: 'pregunta', p: 2 }, texto: '¿Cuántas unidades de millar tiene {{2345}}?', deEspanol: false },
    ]);
    expect(grandes?.coincidencias).toEqual([
      { lugar: { tipo: 'tema' }, texto: 'Hasta la centena de millar', deEspanol: false },
      { lugar: { tipo: 'saber' }, texto: 'Numerales superiores al millar', deEspanol: false },
    ]);
  });

  it('solo en el título: sale, sin más lugares', () => {
    expect(buscar('abrir', ES, null)).toEqual([{ clave: '2/matematicas/3/s07', titulo: 'Abrir una decena', coincidencias: [] }]);
  });

  it('en otro idioma busca también en español, y enseña el texto en el idioma elegido si coincide en los dos', () => {
    const resultados = buscar('millar', VA, ES);
    expect(resultados.map((r) => r.clave)).toEqual(['2/matematicas/3/s02', '2/matematicas/4/s01']);
    expect(resultados[0]?.titulo).toBe('Mil!');
    expect(resultados[0]?.coincidencias).toEqual([
      { lugar: { tipo: 'objetivo' }, texto: 'Aquesta setmana arriben al miler (millar): deu centenes fan 1000.', deEspanol: false },
      { lugar: { tipo: 'pregunta', p: 2 }, texto: '¿Cuántas unidades de millar tiene {{2345}}?', deEspanol: true },
    ]);
    expect(resultados[1]?.coincidencias.map((c) => c.deEspanol)).toEqual([true, true]);
  });

  it('las palabras pueden salir unas en un idioma y otras en el otro', () => {
    expect(buscar('miler unidades', VA, ES).map((r) => r.clave)).toEqual(['2/matematicas/3/s02']);
    expect(buscar('desena', VA, ES).map((r) => r.clave)).toEqual(['2/matematicas/3/s07']);
  });
});

describe('porCurso', () => {
  const resultados = buscar('millar', ES, null).concat(buscar('decena', ES, null));

  it('primero los cursos de la familia', () => {
    expect(porCurso(resultados, ['2/matematicas/4']).map((g) => [g.curso, g.resultados.length])).toEqual([
      ['2/matematicas/4', 1],
      ['2/matematicas/3', 2],
    ]);
  });

  it('sin cursos de la familia, en el orden de los resultados', () => {
    expect(porCurso(resultados, []).map((g) => g.curso)).toEqual(['2/matematicas/3', '2/matematicas/4']);
  });
});
