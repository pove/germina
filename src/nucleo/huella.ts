// Huella de los textos en español de una semilla (la misma que calcula `scripts/lib/huella.mjs`).
// Sirve para saber si una traducción se ha quedado vieja porque después cambió el español.

/** Recorre el JSON en profundidad, saltando «revision», y recoge cada valor de las claves «es». */
export function textosEspanol(nodo: unknown, salida: string[] = []): string[] {
  if (Array.isArray(nodo)) {
    for (const x of nodo) textosEspanol(x, salida);
  } else if (nodo && typeof nodo === 'object') {
    for (const [clave, valor] of Object.entries(nodo)) {
      if (clave === 'revision') continue;
      if (clave === 'es' && typeof valor === 'string') salida.push(valor);
      else textosEspanol(valor, salida);
    }
  }
  return salida;
}

/** SHA-256 de los textos unidos con «\n», con los 12 primeros caracteres hexadecimales. */
export async function huella(semilla: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(textosEspanol(semilla).join('\n'));
  const resumen = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return [...resumen].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
}
