// «Pregunta del día»: texto, pista, respuesta, «invéntala tú» y «¡Lo hemos hablado!».
import { cargarSemilla, useCarga } from '../contenido';
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
  const enlace = (q: number, texto: string, rel: 'prev' | 'next') => (
    <a class="boton" href={construir({ tipo: 'pregunta', ...curso, n, p: q })} rel={rel}>
      {texto}
    </a>
  );

  return (
    <>
      <p class="contexto">{contexto(curso)}</p>
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
          return (
            <>
              <h1 tabIndex={-1}>
                {tDinamico(`dia.${p}`)} · {t('pregunta.titulo', { n: p })}
              </h1>
              <p class="subtitulo">
                {t('semana.titulo', { n })}: <Contenido texto={c.semilla.titulo} />
              </p>
              <TarjetaPregunta key={`${n}-${p}`} curso={curso} claveSemilla={claveSemana(n)} pregunta={pregunta} numero={p} />
              <nav class="acciones-pie" aria-label={t('semana.preguntas')}>
                {p > 1 && enlace(p - 1, t('pregunta.anterior'), 'prev')}
                {p < 5 && enlace(p + 1, t('pregunta.siguiente'), 'next')}
              </nav>
            </>
          );
        }}
      />
      <div class="acciones-pie">
        <a class="boton" href={construir(semana)}>
          {t('reto.ver_semana')}
        </a>
      </div>
    </>
  );
}
