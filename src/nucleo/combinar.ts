// Combinar lo recibido con lo propio (especificación, 6.4). Todo se suma; nada se quita.
import { ordenarElementos, type Datos, type Semilla } from './tipos';
import type { Recibido } from './enlace';

function unir(propia: Semilla | undefined, recibida: Semilla): Semilla {
  const hecho = ordenarElementos([...(propia?.hecho ?? []), ...recibida.hecho]);
  const records = [propia?.record, recibida.record].filter((r): r is number => r !== undefined);
  return records.length > 0 ? { hecho, record: Math.max(...records) } : { hecho };
}

/**
 * Las casillas marcadas se suman y de cada récord se queda el mayor. Los cursos nuevos se añaden.
 * El idioma, el curso activo y el último año de curso del móvil que recibe no cambian.
 */
export function combinar(actual: Datos, recibido: Recibido): Datos {
  const progreso: Datos['progreso'] = {};
  for (const [clave, semillas] of Object.entries(actual.progreso)) progreso[clave] = { ...semillas };
  for (const [clave, semillas] of Object.entries(recibido.progreso)) {
    const destino = (progreso[clave] ??= {});
    for (const [id, semilla] of Object.entries(semillas)) destino[id] = unir(destino[id], semilla);
  }
  const cursos = [...actual.cursos, ...recibido.cursos.filter((c) => !actual.cursos.includes(c))];
  return { ...actual, cursos, progreso };
}
