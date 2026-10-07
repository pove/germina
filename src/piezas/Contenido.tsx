import { idioma } from '../idioma';
import { elegir, type Texto } from '../nucleo/textos';
import { Marcado } from './Marcado';

/** Un texto de contenido en el idioma elegido. Si falta, sale en español y se marca con `lang="es"`. */
export function Contenido({ texto }: { texto: Texto }) {
  const e = elegir(texto, idioma.value);
  return (
    <span lang={e.deEspanol ? 'es' : undefined}>
      <Marcado texto={e.texto} />
    </span>
  );
}

/** Como `Contenido`, pero devuelve el texto plano (para títulos y atributos). */
export function textoPlano(texto: Texto): string {
  return elegir(texto, idioma.value).texto;
}
