import { describe, expect, it } from 'vitest';
import { estadoPlanta } from './jardin';

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
