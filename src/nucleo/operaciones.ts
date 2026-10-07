// Evaluador de operaciones con enteros: + - × : y paréntesis, sin eval ni Function.
// La implementación es la misma que usa el validador de contenido (`scripts/lib/operaciones.mjs`).
import { ErrorOperacion, evaluar as evaluarExacto } from '../../scripts/lib/operaciones.mjs';

export { ErrorOperacion };

/**
 * Calcula una operación con enteros. Cada división tiene que ser exacta.
 * @throws ErrorOperacion si está mal escrita o no se puede calcular.
 */
export function evaluar(operacion: string): number {
  const f = evaluarExacto(operacion, { soloEnteros: true });
  return Number(f.n);
}

/** `true` si la operación da exactamente ese resultado. Una operación mal escrita da `false`. */
export function cuadra(operacion: string, resultado: number): boolean {
  try {
    return evaluar(operacion) === resultado;
  } catch (e) {
    if (e instanceof ErrorOperacion) return false;
    throw e;
  }
}
