// Huella de los textos en español de una semilla: sirve para saber si una traducción
// revisada se ha quedado vieja porque después cambió el español.
// Algoritmo (no cambiarlo sin migrar las huellas guardadas):
//   1. Recorrer el JSON en profundidad, en el orden de las claves del archivo, saltando «revision».
//   2. Recoger el valor de cada clave «es» que sea texto.
//   3. Unirlos con «\n», calcular SHA-256 (UTF-8) y quedarse con los 12 primeros caracteres hexadecimales.
import { createHash } from 'node:crypto';

export function textosEspanol(nodo, salida = []) {
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

export function huella(semilla) {
  return createHash('sha256').update(textosEspanol(semilla).join('\n'), 'utf8').digest('hex').slice(0, 12);
}
