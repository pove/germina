import { describe, expect, it } from 'vitest';
import { aTexto, comprobarIgualdad, ErrorOperacion, evaluar } from '../lib/operaciones.mjs';

const calcula = (t, o) => aTexto(evaluar(t, { decimales: true, ...o }));

describe('evaluar', () => {
  it('respeta la precedencia y los paréntesis', () => {
    expect(calcula('2 + 3 × 4')).toBe('14');
    expect(calcula('(2 + 3) × 4')).toBe('20');
    expect(calcula('20 : 4 : 5')).toBe('1');
  });

  it('acepta el signo menos tipográfico y los espacios', () => {
    expect(calcula(' 42 − 17 ')).toBe('25');
    expect(calcula('42-17')).toBe('25');
  });

  it('calcula con decimales exactos', () => {
    expect(calcula('1,5 + 2,5')).toBe('4');
    expect(calcula('7 : 2')).toBe('3,5');
    expect(calcula('0,1 + 0,2')).toBe('0,3');
  });

  it('con soloEnteros rechaza una división no exacta', () => {
    expect(() => evaluar('7 : 2', { soloEnteros: true })).toThrow(/no exacta/);
    expect(calcula('12 : 4', { soloEnteros: true })).toBe('3');
  });

  it('sin decimales rechaza la coma', () => {
    expect(() => evaluar('1,5 + 1')).toThrow(ErrorOperacion);
  });

  it.each(['', '2 +', '(1 + 2', '1 + 2)', '3 4', '2 × × 3', '5 : 0', 'abc', '2 ** 3', '1 + eval(1)'])('rechaza «%s»', (t) => {
    expect(() => evaluar(t, { decimales: true })).toThrow(ErrorOperacion);
  });
});

describe('comprobarIgualdad', () => {
  it('cuadra, no cuadra y cadenas', () => {
    expect(comprobarIgualdad('42 − 17 = 25').estado).toBe('cuadra');
    expect(comprobarIgualdad('42 − 17 = 24').estado).toBe('no-cuadra');
    expect(comprobarIgualdad('2 + 3 = 5 = 10 : 2').estado).toBe('cuadra');
    expect(comprobarIgualdad('2 + 3 = 5 = 6').estado).toBe('no-cuadra');
  });

  it('sin igual no hay nada que comprobar', () => {
    expect(comprobarIgualdad('23 − 8').estado).toBe('sin-igualdad');
  });

  it('lo que no es una operación no se puede comprobar', () => {
    expect(comprobarIgualdad('3 m + 2 m = 5 m').estado).toBe('no-evaluable');
  });
});
