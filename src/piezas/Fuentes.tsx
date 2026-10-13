// Fuentes citadas al pie de «Cómo ayudar» y «Qué aprenden».
import { t } from '../idioma';
import type { Fuente } from '../nucleo/contenido';
import { Contenido } from './Contenido';

/**
 * La cita va tal cual, en su idioma (y de izquierda a derecha también en árabe); lo que respalda, en el idioma elegido.
 * Los enlaces van dentro de un párrafo y sin `Referer`: es la persona quien decide salir de Germina.
 */
export function Fuentes({ fuentes }: { fuentes: Fuente[] }) {
  return (
    <section class="tarjeta fuentes" aria-labelledby="fuentes">
      <h2 id="fuentes">{t('fuentes.titulo')}</h2>
      <p>{t('fuentes.aviso')}</p>
      <ul>
        {fuentes.map((f) => (
          <li key={f.url + f.cita}>
            <p class="fuente-cita" lang={f.idioma} dir={f.idioma === 'ar' ? undefined : 'ltr'}>
              <a href={f.url} rel="noreferrer">
                {f.cita}
              </a>
            </p>
            <p>
              <Contenido texto={f.apoya} />
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
