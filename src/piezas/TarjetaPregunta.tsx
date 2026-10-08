import { alternarElemento, marcadoDe } from '../estado';
import { t, tDinamico } from '../idioma';
import type { Pregunta } from '../nucleo/contenido';
import type { Curso } from '../nucleo/tipos';
import { Contenido } from './Contenido';
import { Plegable } from './Plegable';

interface Props {
  curso: Curso;
  claveSemilla: string;
  pregunta: Pregunta;
  /** Nivel del encabezado «Pregunta n»; sin él, la tarjeta no lo muestra (la pantalla ya tiene su título). */
  encabezado?: 'h2' | 'h3';
  numero: number;
}

/** Una pregunta del día: texto, pista, respuesta, «invéntala tú» y «¡Lo hemos hablado!». */
export function TarjetaPregunta({ curso, claveSemilla, pregunta, encabezado, numero }: Props) {
  const hablada = marcadoDe(curso, claveSemilla)?.hecho.includes(pregunta.id) ?? false;
  const Titulo = encabezado;
  return (
    <article class="tarjeta tarjeta-pregunta">
      {Titulo && (
        <Titulo>
          {tDinamico(`dia.${numero}`)} · {t('pregunta.titulo', { n: numero })}
        </Titulo>
      )}
      <p class="texto-pregunta">
        <Contenido texto={pregunta.texto} />
      </p>
      <div class="acciones">
        <Plegable clase="boton-plegable" etiqueta={t('pregunta.pista')} etiquetaAbierto={t('pregunta.ocultar_pista')}>
          <p>
            <Contenido texto={pregunta.pista} />
          </p>
        </Plegable>
        <Plegable clase="boton-plegable" etiqueta={t('pregunta.ver_respuesta')} etiquetaAbierto={t('pregunta.ocultar_respuesta')}>
          {pregunta.respuesta.tipo === 'calculo' ? (
            <p>
              <Contenido texto={pregunta.respuesta.texto} />
            </p>
          ) : (
            <>
              <p class="etiqueta">{t('pregunta.orientacion')}</p>
              <p>
                <Contenido texto={pregunta.respuesta.orientacion} />
              </p>
            </>
          )}
        </Plegable>
        {pregunta.inventala && (
          <Plegable clase="boton-plegable" etiqueta={t('pregunta.inventala')}>
            <p>
              <Contenido texto={pregunta.inventala} />
            </p>
          </Plegable>
        )}
      </div>
      <div class="marcar">
        <button type="button" class="boton boton-principal" aria-pressed={hablada} onClick={() => alternarElemento(curso, claveSemilla, pregunta.id)}>
          {t('pregunta.hablado')}
        </button>
        {hablada && <span class="estado-marcado">✓ {t('pregunta.hablado_marcado')}</span>}
      </div>
    </article>
  );
}
