import { describe, expect, it } from 'vitest';
import { partirMarcado, sinMarcado } from './marcado';

describe('partirMarcado', () => {
  it('un texto sin marcado es un solo trozo', () => {
    expect(partirMarcado('Hola')).toEqual([{ tipo: 'texto', valor: 'Hola' }]);
    expect(partirMarcado('')).toEqual([]);
  });

  it('separa las operaciones', () => {
    expect(partirMarcado('Escribid la resta: {{42 − 17 = 25}}.')).toEqual([
      { tipo: 'texto', valor: 'Escribid la resta: ' },
      { tipo: 'operacion', valor: '42 − 17 = 25' },
      { tipo: 'texto', valor: '.' },
    ]);
  });

  it('varias operaciones, también pegadas, al principio y al final', () => {
    expect(partirMarcado('{{3 × 4}}{{4 × 3}}')).toEqual([
      { tipo: 'operacion', valor: '3 × 4' },
      { tipo: 'operacion', valor: '4 × 3' },
    ]);
    expect(partirMarcado('{{1}} y {{2}}')).toEqual([
      { tipo: 'operacion', valor: '1' },
      { tipo: 'texto', valor: ' y ' },
      { tipo: 'operacion', valor: '2' },
    ]);
  });

  it('quita los espacios de dentro', () => {
    expect(partirMarcado('{{  2 + 2  }}')).toEqual([{ tipo: 'operacion', valor: '2 + 2' }]);
  });

  it.each([
    ['sin cerrar', 'a {{2 + 2'],
    ['un cierre suelto', 'a 2 + 2}} b'],
    ['vacío', 'a {{}} b'],
    ['solo espacios', 'a {{  }} b'],
    ['anidado', 'a {{ {{2}} }} b'],
  ])('lo roto se queda como texto (%s)', (_nombre, texto) => {
    expect(partirMarcado(texto).every((s) => s.tipo === 'texto' || s.valor === '2')).toBe(true);
    expect(sinMarcado(texto).replace(/\s+/g, ' ')).toContain('a');
  });

  it('lo que queda tras un «{{» roto sigue pudiendo traer operaciones', () => {
    expect(partirMarcado('a {{ y luego {{2 + 2}}')).toEqual([
      { tipo: 'texto', valor: 'a {{ y luego ' },
      { tipo: 'operacion', valor: '2 + 2' },
    ]);
  });

  it('el árabe y las cifras se respetan', () => {
    expect(partirMarcado('اكتبوا: {{42 − 17 = 25}}.')).toEqual([
      { tipo: 'texto', valor: 'اكتبوا: ' },
      { tipo: 'operacion', valor: '42 − 17 = 25' },
      { tipo: 'texto', valor: '.' },
    ]);
  });
});

describe('sinMarcado', () => {
  it('quita las llaves y deja la operación', () => {
    expect(sinMarcado('Es {{3 × 4}}.')).toBe('Es 3 × 4.');
  });
});
