import { describe, expect, it } from 'vitest';
import { ErrorOperacion, cuadra, evaluar } from './operaciones';

describe('evaluar', () => {
  it.each([
    ['32 - 5', 27],
    ['42 − 17', 25],
    ['4 × 3', 12],
    ['12 : 4', 3],
    ['2 + 3 × 4', 14],
    ['(2 + 3) × 4', 20],
    ['100 - (30 + 20) : 5', 90],
    ['7', 7],
  ])('%s = %i', (operacion, resultado) => {
    expect(evaluar(operacion)).toBe(resultado);
  });

  it('puede dar negativos si la operación lo pide', () => {
    expect(evaluar('3 - 5')).toBe(-2);
  });

  it.each(['', '2 +', '(1 + 2', '1 + 2)', '7 : 2', '1 : 0', '2 ** 3', '1,5 + 1', 'abc', 'alert(1)'])('rechaza «%s»', (operacion) => {
    expect(() => evaluar(operacion)).toThrow(ErrorOperacion);
  });
});

describe('cuadra', () => {
  it('compara el resultado', () => {
    expect(cuadra('32 - 5', 27)).toBe(true);
    expect(cuadra('32 - 5', 28)).toBe(false);
  });
  it('una operación mal escrita no cuadra', () => {
    expect(cuadra('32 -', 27)).toBe(false);
  });
});
