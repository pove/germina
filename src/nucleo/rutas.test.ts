import { describe, expect, it } from 'vitest';
import { construir, interpretar, type Ruta } from './rutas';

const curso = { ciclo: 2, area: 'matematicas', curso: 3 };

const rutas: [string, Ruta][] = [
  ['#/', { tipo: 'inicio' }],
  ['#/bienvenida', { tipo: 'bienvenida' }],
  ['#/2/matematicas/3/semana/7', { tipo: 'semana', ...curso, n: 7 }],
  ['#/2/matematicas/4/semana/41/pregunta/5', { tipo: 'pregunta', ...curso, curso: 4, n: 41, p: 5 }],
  ['#/2/matematicas/3/semana/1/reto', { tipo: 'reto', ...curso, n: 1 }],
  ['#/2/matematicas/3/verano/10', { tipo: 'verano', ...curso, n: 10 }],
  ['#/2/matematicas/3/verano/2/reto', { tipo: 'veranoReto', ...curso, n: 2 }],
  ['#/2/matematicas/3/jardin', { tipo: 'jardin', ...curso }],
  ['#/2/matematicas/3/aprenden', { tipo: 'aprenden', ...curso }],
  ['#/2/conocimiento-medio/4/jardin', { tipo: 'jardin', ciclo: 2, area: 'conocimiento-medio', curso: 4 }],
  ['#/ayuda', { tipo: 'ayuda' }],
  ['#/ajustes', { tipo: 'ajustes' }],
  ['#/ajustes/pasar', { tipo: 'pasar' }],
  ['#/recibir/ABCD-EF12', { tipo: 'recibir', codigo: 'ABCD-EF12' }],
  ['#/imprimir/records', { tipo: 'imprimirRecords' }],
  ['#/privacidad', { tipo: 'privacidad' }],
  ['#/accesibilidad', { tipo: 'accesibilidad' }],
];

describe('interpretar y construir', () => {
  it.each(rutas)('%s', (hash, ruta) => {
    expect(interpretar(hash)).toEqual(ruta);
    expect(construir(ruta)).toBe(hash);
  });

  it('ida y vuelta de todas las semanas, preguntas y veranos', () => {
    for (let n = 1; n <= 41; n++) {
      for (const r of [{ tipo: 'semana', n }, { tipo: 'reto', n }, ...[1, 2, 3, 4, 5].map((p) => ({ tipo: 'pregunta', n, p }))] as Ruta[]) {
        expect(interpretar(construir({ ...curso, ...r } as Ruta))).toEqual({ ...curso, ...r });
      }
    }
    for (let n = 1; n <= 10; n++) expect(interpretar(construir({ tipo: 'verano', ...curso, n }))).toEqual({ tipo: 'verano', ...curso, n });
  });

  it('la ruta de la ejemplo de la especificación', () => {
    expect(interpretar('#/2/matematicas/3/semana/7')).toMatchObject({ tipo: 'semana', n: 7 });
  });
});

describe('formas de escribir el hash', () => {
  it.each(['', '#', '/', '#/', '#//'])('«%s» es el inicio', (hash) => {
    expect(interpretar(hash)).toEqual({ tipo: 'inicio' });
  });
  it('admite la barra final y la falta de almohadilla', () => {
    expect(interpretar('#/ayuda/')).toEqual({ tipo: 'ayuda' });
    expect(interpretar('/ajustes/pasar')).toEqual({ tipo: 'pasar' });
    expect(interpretar('ayuda')).toEqual({ tipo: 'ayuda' });
  });
  it('el código de «recibir» puede venir con porcentajes', () => {
    expect(interpretar('#/recibir/AB%2DCD')).toEqual({ tipo: 'recibir', codigo: 'AB-CD' });
    expect(construir({ tipo: 'recibir', codigo: 'AB-CD' })).toBe('#/recibir/AB-CD');
  });
});

describe('rutas desconocidas', () => {
  it.each([
    '#/nada',
    '#/ayuda/mas',
    '#/ajustes/otra',
    '#/imprimir',
    '#/2/matematicas/3',
    '#/2/matematicas/3/semana',
    '#/2/matematicas/3/semana/0',
    '#/2/matematicas/3/semana/42',
    '#/2/matematicas/3/semana/07',
    '#/2/matematicas/3/semana/x',
    '#/2/matematicas/3/semana/7/pregunta/0',
    '#/2/matematicas/3/semana/7/pregunta/6',
    '#/2/matematicas/3/semana/7/pregunta',
    '#/2/matematicas/3/semana/7/otra',
    '#/2/matematicas/3/semana/7/reto/1',
    '#/2/matematicas/3/verano/0',
    '#/2/matematicas/3/verano/11',
    '#/2/matematicas/3/verano/1/otra',
    '#/2/matematicas/3/verano/x',
    '#/2/matematicas/3/jardin/1',
    '#/2/matematicas/3/otra',
    '#/4/matematicas/3/semana/7',
    '#/0/matematicas/3/semana/7',
    '#/2/matematicas/7/semana/7',
    '#/2/Matematicas/3/semana/7',
    '#/2/mate_maticas/3/semana/7',
    '#/2//3/semana/7',
    '#/2/matematicas',
    '#/recibir',
    '#/recibir/%E0%A4%A',
    '#/recibir/a$b',
    `#/recibir/${'A'.repeat(4001)}`,
    '#/recibir/AB/CD',
  ])('«%s»', (hash) => {
    expect(interpretar(hash)).toEqual({ tipo: 'desconocida' });
  });

  it('una ruta desconocida se construye como el inicio', () => {
    expect(construir({ tipo: 'desconocida' })).toBe('#/');
  });
});
