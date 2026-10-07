import { describe, expect, it, vi } from 'vitest';
import {
  CLAVE, almacenDelNavegador, borrar, conElemento, conRecord, datosVacios, escribir, leer, sanear, type Almacenamiento,
} from './almacen';
import type { Datos } from './tipos';

const curso3 = { ciclo: 2, area: 'matematicas', curso: 3 };

function falso(inicial: Record<string, string> = {}): Almacenamiento & { datos: Record<string, string> } {
  const datos = { ...inicial };
  return {
    datos,
    getItem: (k) => datos[k] ?? null,
    setItem: (k, v) => void (datos[k] = v),
    removeItem: (k) => void delete datos[k],
  };
}

const ejemplo: Datos = {
  v: 1,
  idioma: 'ar',
  cursos: ['2/matematicas/3', '2/matematicas/4'],
  cursoActivo: '2/matematicas/3',
  ultimoAnoCurso: 2026,
  progreso: {
    '2026/2/matematicas/3': { s07: { hecho: ['p1', 'p2', 'reto'], record: 14 }, v03: { hecho: ['reto'] } },
  },
};

describe('leer y escribir', () => {
  it('lo escrito se lee igual (con los elementos en su orden)', () => {
    const a = falso();
    expect(escribir(a, ejemplo)).toBe(true);
    const { datos, estado } = leer(a);
    expect(estado).toBe('ok');
    expect(datos.progreso['2026/2/matematicas/3']!.s07).toEqual({ hecho: ['reto', 'p1', 'p2'], record: 14 });
    expect(datos.idioma).toBe('ar');
    expect(datos.cursoActivo).toBe('2/matematicas/3');
    expect(datos.ultimoAnoCurso).toBe(2026);
  });

  it('el ejemplo de la especificación se entiende tal cual', () => {
    const a = falso({
      [CLAVE]: JSON.stringify({
        v: 1, idioma: 'es', cursos: ['2/matematicas/3', '2/matematicas/4'], cursoActivo: '2/matematicas/3', ultimoAnoCurso: 2026,
        progreso: { '2026/2/matematicas/3': { s07: { hecho: ['reto', 'p1', 'p2'], record: 14 }, v03: { hecho: ['reto'] } } },
      }),
    });
    expect(leer(a).estado).toBe('ok');
    expect(leer(a).datos.progreso['2026/2/matematicas/3']!.v03).toEqual({ hecho: ['reto'] });
  });

  it('sin nada guardado: vacío', () => {
    expect(leer(falso())).toEqual({ datos: datosVacios(), estado: 'vacio' });
  });

  it.each(['no es json', '[1,2]', 'null', '"texto"', '42', '{"v":2}', '{"v":0}', '{}', '{"idioma":"es"}'])('basura «%s»: datos vacíos', (texto) => {
    expect(leer(falso({ [CLAVE]: texto }))).toEqual({ datos: datosVacios(), estado: 'ilegible' });
  });

  it('sin localStorage la web funciona con datos vacíos', () => {
    expect(leer(null)).toEqual({ datos: datosVacios(), estado: 'noDisponible' });
    expect(escribir(null, ejemplo)).toBe(false);
    expect(borrar(null)).toBe(false);
  });

  it('si localStorage lanza al leer, al escribir o al borrar, no se rompe nada', () => {
    const roto: Almacenamiento = {
      getItem: () => { throw new Error('bloqueado'); },
      setItem: () => { throw new Error('lleno'); },
      removeItem: () => { throw new Error('bloqueado'); },
    };
    expect(leer(roto).estado).toBe('noDisponible');
    expect(escribir(roto, ejemplo)).toBe(false);
    expect(borrar(roto)).toBe(false);
  });

  it('empezar de cero borra lo guardado', () => {
    const a = falso();
    escribir(a, ejemplo);
    expect(borrar(a)).toBe(true);
    expect(leer(a).estado).toBe('vacio');
  });
});

describe('sanear: ignora lo que no encaja sin romper el resto', () => {
  const base = { v: 1, idioma: 'es', cursos: ['2/matematicas/3'], cursoActivo: '2/matematicas/3', ultimoAnoCurso: 2026, progreso: {} };

  it('idioma desconocido', () => {
    expect(sanear({ ...base, idioma: 'de' })!.idioma).toBeNull();
    expect(sanear({ ...base, idioma: 3 })!.idioma).toBeNull();
  });

  it('cursos mal escritos y repetidos', () => {
    const d = sanear({ ...base, cursos: ['2/matematicas/3', '2/matematicas/3', '9/matematicas/3', 'x', 4, null, '2/Mates/3'] })!;
    expect(d.cursos).toEqual(['2/matematicas/3']);
  });

  it('un curso activo que no está en la lista pasa al primero, o a nada', () => {
    expect(sanear({ ...base, cursoActivo: '2/matematicas/4' })!.cursoActivo).toBe('2/matematicas/3');
    expect(sanear({ ...base, cursos: [], cursoActivo: '2/matematicas/4' })!.cursoActivo).toBeNull();
    expect(sanear({ ...base, cursoActivo: 7 })!.cursoActivo).toBe('2/matematicas/3');
  });

  it.each([1999, 2256, 2026.5, '2026', null])('último año de curso no válido (%s)', (ano) => {
    expect(sanear({ ...base, ultimoAnoCurso: ano })!.ultimoAnoCurso).toBeNull();
  });

  it('progreso: claves, semillas, elementos y récords no válidos', () => {
    const d = sanear({
      ...base,
      progreso: {
        '2026/2/matematicas/3': {
          s07: { hecho: ['p2', 'p1', 'p1', 'baile', 7, 'reto'], record: 200 },
          s42: { hecho: ['reto'] },
          s00: { hecho: ['reto'] },
          x01: { hecho: ['reto'] },
          s08: { hecho: ['reto'], record: 256 },
          s09: { hecho: ['reto'], record: -1 },
          s10: { hecho: ['reto'], record: 1.5 },
          s11: { hecho: 'reto' },
          s12: { hecho: [] },
          s13: 'nada',
          s14: { hecho: [], record: 0 },
          v11: { hecho: ['reto'] },
        },
        '1999/2/matematicas/3': { s01: { hecho: ['reto'] } },
        '2026/2/matematicas/9': { s01: { hecho: ['reto'] } },
        '2026/2/matematicas/4': { s01: { hecho: [] } },
        'basura': { s01: { hecho: ['reto'] } },
        '2026/2/matematicas/5': 'texto',
      },
    })!;
    expect(d.progreso).toEqual({
      '2026/2/matematicas/3': {
        s07: { hecho: ['reto', 'p1', 'p2'], record: 200 },
        s08: { hecho: ['reto'] },
        s09: { hecho: ['reto'] },
        s10: { hecho: ['reto'] },
        s14: { hecho: [], record: 0 },
      },
    });
  });

  it('un progreso que no es un objeto', () => {
    expect(sanear({ ...base, progreso: [] })!.progreso).toEqual({});
  });
});

describe('marcar', () => {
  it('marca, desmarca y apunta récords sin tocar el original', () => {
    const d0 = datosVacios();
    const d1 = conElemento(d0, 2026, curso3, 's07', 'p2');
    const d2 = conElemento(d1, 2026, curso3, 's07', 'reto');
    const d3 = conElemento(d2, 2026, curso3, 's07', 'p1');
    expect(d0).toEqual(datosVacios());
    expect(d3.progreso['2026/2/matematicas/3']!.s07!.hecho).toEqual(['reto', 'p1', 'p2']);
    const d4 = conRecord(d3, 2026, curso3, 's07', 14);
    expect(d4.progreso['2026/2/matematicas/3']!.s07).toEqual({ hecho: ['reto', 'p1', 'p2'], record: 14 });
    const d5 = conElemento(d4, 2026, curso3, 's07', 'p1', false);
    expect(d5.progreso['2026/2/matematicas/3']!.s07).toEqual({ hecho: ['reto', 'p2'], record: 14 });
  });

  it('marcar dos veces es lo mismo que una', () => {
    const d = conElemento(conElemento(datosVacios(), 2026, curso3, 's01', 'p1'), 2026, curso3, 's01', 'p1');
    expect(d.progreso['2026/2/matematicas/3']!.s01!.hecho).toEqual(['p1']);
  });

  it('desmarcarlo todo limpia la semilla y el curso', () => {
    let d = conElemento(datosVacios(), 2026, curso3, 's01', 'p1');
    d = conElemento(d, 2026, curso3, 's01', 'p1', false);
    expect(d.progreso).toEqual({});
  });

  it('un récord sin nada marcado se guarda', () => {
    const d = conRecord(datosVacios(), 2026, curso3, 'v01', 0);
    expect(d.progreso['2026/2/matematicas/3']!.v01).toEqual({ hecho: [], record: 0 });
  });

  it('un récord fuera de 0 a 255 no se admite', () => {
    expect(() => conRecord(datosVacios(), 2026, curso3, 's01', 256)).toThrow(RangeError);
    expect(() => conRecord(datosVacios(), 2026, curso3, 's01', -1)).toThrow(RangeError);
    expect(() => conRecord(datosVacios(), 2026, curso3, 's01', 1.5)).toThrow(RangeError);
  });
});

describe('almacenDelNavegador', () => {
  it('sin localStorage devuelve null', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(almacenDelNavegador()).toBeNull();
    vi.unstubAllGlobals();
  });

  it('si localStorage lanza (navegación privada) devuelve null', () => {
    vi.stubGlobal('localStorage', { setItem: () => { throw new Error('cuota'); }, removeItem: () => undefined, getItem: () => null });
    expect(almacenDelNavegador()).toBeNull();
    vi.unstubAllGlobals();
  });

  it('con localStorage lo devuelve y no deja rastro de la prueba', () => {
    const a = falso();
    vi.stubGlobal('localStorage', a);
    expect(almacenDelNavegador()).toBe(a);
    expect(a.datos).toEqual({});
    vi.unstubAllGlobals();
  });
});
