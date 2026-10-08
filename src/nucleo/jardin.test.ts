import { describe, expect, it } from 'vitest';
import { estadoPlanta, semillaCercana } from './jardin';

describe('estadoPlanta', () => {
  it('semilla: nada marcado', () => {
    expect(estadoPlanta(undefined)).toBe('semilla');
    expect(estadoPlanta({ hecho: [] })).toBe('semilla');
    expect(estadoPlanta({ hecho: [], record: 9 })).toBe('semilla');
  });
  it('brote: alguna pregunta hablada', () => {
    expect(estadoPlanta({ hecho: ['p3'] })).toBe('brote');
    expect(estadoPlanta({ hecho: ['p1', 'p2', 'p3', 'p4', 'p5'] })).toBe('brote');
  });
  it('flor: el reto jugado, con o sin preguntas', () => {
    expect(estadoPlanta({ hecho: ['reto'] })).toBe('flor');
    expect(estadoPlanta({ hecho: ['reto', 'p1'] })).toBe('flor');
  });
});

describe('semillaCercana', () => {
  const de = (...semanas: number[]) => (m: number) => semanas.includes(m);
  it('prefiere la anterior más próxima', () => {
    expect(semillaCercana(de(2, 4, 9), 6, 41)).toBe(4);
  });
  it('si no hay ninguna antes, la siguiente', () => {
    expect(semillaCercana(de(7, 12), 5, 41)).toBe(7);
  });
  it('nunca la propia semana', () => {
    expect(semillaCercana(de(5), 5, 41)).toBeNull();
  });
  it('sin ninguna publicada, ninguna', () => {
    expect(semillaCercana(de(), 5, 41)).toBeNull();
  });
  it('no se sale de 1…total', () => {
    expect(semillaCercana(de(0, 11), 10, 10)).toBeNull();
    expect(semillaCercana(de(10), 12, 10)).toBe(10);
  });
});
