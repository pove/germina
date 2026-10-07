// Marcado {{…}} de los textos de contenido: las operaciones se muestran aisladas de izquierda a derecha.

export type Segmento = { tipo: 'texto'; valor: string } | { tipo: 'operacion'; valor: string };

/**
 * Parte un texto en trozos de texto normal y operaciones (lo que va entre `{{` y `}}`).
 * Es tolerante: un `{{` sin cerrar, un `}}` suelto o un `{{}}` vacío se dejan como texto.
 */
export function partirMarcado(texto: string): Segmento[] {
  const segmentos: Segmento[] = [];
  let pendiente = '';
  let i = 0;
  while (i < texto.length) {
    const abre = texto.indexOf('{{', i);
    const cierra = abre === -1 ? -1 : texto.indexOf('}}', abre + 2);
    const dentro = cierra === -1 ? '' : texto.slice(abre + 2, cierra).trim();
    if (abre === -1 || cierra === -1 || dentro === '' || /[{}]/.test(dentro)) {
      // No hay una operación válida a partir de aquí: lo que queda (o el «{{» roto) es texto.
      const hasta = abre === -1 || cierra === -1 ? texto.length : abre + 2;
      pendiente += texto.slice(i, hasta);
      i = hasta;
      continue;
    }
    pendiente += texto.slice(i, abre);
    if (pendiente) segmentos.push({ tipo: 'texto', valor: pendiente });
    pendiente = '';
    segmentos.push({ tipo: 'operacion', valor: dentro });
    i = cierra + 2;
  }
  if (pendiente) segmentos.push({ tipo: 'texto', valor: pendiente });
  return segmentos;
}

/** El texto sin marcar: lo que lee una persona, con las operaciones tal cual. */
export const sinMarcado = (texto: string): string => partirMarcado(texto).map((s) => s.valor).join('');
