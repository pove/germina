// «Pregunta del día»: texto, pista, respuesta, «invéntala tú» y «¡Lo hemos hablado!».
import { cargarSemilla, useCarga } from '../contenido';
import { marcadoDe } from '../estado';
import { t, tDinamico } from '../idioma';
import { construir } from '../nucleo/rutas';
import { claveCurso, claveSemana, type Curso } from '../nucleo/tipos';
import { Cargando } from '../piezas/Carga';
import { Contenido } from '../piezas/Contenido';
import { contexto } from '../piezas/Layout';
import { TarjetaPregunta } from '../piezas/TarjetaPregunta';

interface Props {
  curso: Curso;
  n: number;
  p: number;
}

export function Pregunta({ curso, n, p }: Props) {
  const carga = useCarga(() => cargarSemilla(curso, false, n), [claveCurso(curso), n]);
  const semana = { tipo: 'semana', ...curso, n } as const;

  return (
    <>
      <p class="contexto">{contexto(curso)}</p>
      <a class="enlace-volver" href={construir(semana)}>
        <span class="flecha-texto" aria-hidden="true">
          ←
        </span>
        {t('semana.titulo', { n })}
      </a>
      <Cargando
        carga={carga}
        hijo={(c) => {
          if (!c) {
            return (
              <>
                <h1 tabIndex={-1}>{t('semana.titulo', { n })}</h1>
                <p>{t('semana.en_camino')}</p>
              </>
            );
          }
          const pregunta = c.semilla.preguntas[p - 1];
          if (!pregunta) return null;
          const hechas = new Set(marcadoDe(curso, claveSemana(n))?.hecho ?? []);
          return (
            <>
              <div class="portada portada-pregunta">
                <h1 tabIndex={-1}>
                  {tDinamico(`dia.${p}`)} · {t('pregunta.titulo', { n: p })}
                </h1>
                <p class="subtitulo">
                  <Contenido texto={c.semilla.titulo} />
                </p>
              </div>
              <TarjetaPregunta key={`${n}-${p}`} curso={curso} claveSemilla={claveSemana(n)} pregunta={pregunta} numero={p} />
              <nav class="pasos-preguntas" aria-label={t('semana.preguntas')}>
                <ol>
                  {c.semilla.preguntas.map((q, i) => {
                    const numero = i + 1;
                    const hablada = hechas.has(q.id);
                    const rel = numero === p - 1 ? 'prev' : numero === p + 1 ? 'next' : undefined;
                    return (
                      <li key={q.id} class={hablada ? 'hablada' : undefined}>
                        <a
                          href={construir({ tipo: 'pregunta', ...curso, n, p: numero })}
                          rel={rel}
                          aria-current={numero === p ? 'page' : undefined}
                        >
                          <span class="numero-pregunta" aria-hidden="true">
                            {hablada ? '✓' : numero}
                          </span>
                          <span class="dia-corto" aria-hidden="true">
                            {tDinamico(`dia_corto.${numero}`)}
                          </span>
                          <span class="solo-lectores">
                            {tDinamico(`dia.${numero}`)} · {t('pregunta.titulo', { n: numero })}
                            {hablada && ` · ${t('pregunta.hablado_marcado')}`}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </>
          );
        }}
      />
    </>
  );
}
