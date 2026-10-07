// «Reto»: material, pasos con pictograma, más fácil, más difícil, para qué sirve, aviso, cronómetro y récord.
import { useState } from 'preact/hooks';
import { cargarSemilla, useCarga } from '../contenido';
import { alternarElemento, apuntarRecord, datos, marcadoDe } from '../estado';
import { t } from '../idioma';
import { construir } from '../nucleo/rutas';
import { claveCurso, claveSemana, claveVerano, type Curso } from '../nucleo/tipos';
import { Cargando } from '../piezas/Carga';
import { Contenido } from '../piezas/Contenido';
import { Cronometro } from '../piezas/Cronometro';
import { contexto } from '../piezas/Layout';
import { Pictograma } from '../piezas/Pictograma';
import { formatearNumero } from '../nucleo/numeros';
import type { Reto as RetoContenido } from '../nucleo/contenido';

interface Props {
  curso: Curso;
  n: number;
  verano: boolean;
}

function Record({ curso, clave, reto }: { curso: Curso; clave: string; reto: NonNullable<RetoContenido['rapidez']> }) {
  const [texto, setTexto] = useState('');
  const [ultimo, setUltimo] = useState<{ valor: number; nuevo: boolean } | null>(null);
  const mejor = marcadoDe(curso, clave)?.record;
  const valor = /^\d{1,3}$/.test(texto) ? Number(texto) : null;
  const valido = valor !== null && valor <= 255;

  return (
    <section class="tarjeta" aria-labelledby="titulo-record">
      <h3 id="titulo-record">{t('record.titulo')}</h3>
      <p>
        {t('record.cuenta', { que: '' })}
        <Contenido texto={reto.seCuenta} />
      </p>
      <p>{mejor === undefined ? t('record.sin') : t('record.mejor', { n: formatearNumero(mejor) })}</p>
      <form
        class="formulario-record"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valido) return;
          setUltimo({ valor, nuevo: apuntarRecord(curso, clave, valor) });
          setTexto('');
        }}
      >
        <label for="resultado">{t('record.apuntar')}</label>
        <input id="resultado" type="text" inputMode="numeric" autoComplete="off" value={texto} onInput={(e) => setTexto((e.target as HTMLInputElement).value.trim())} />
        <button type="submit" class="boton" disabled={!valido}>
          {t('record.guardar')}
        </button>
      </form>
      <div role="status">
        {ultimo && (
          <p>
            {t('record.hoy', { n: formatearNumero(ultimo.valor) })}
            {ultimo.nuevo && <strong> · {t('record.nuevo')}</strong>}
          </p>
        )}
      </div>
    </section>
  );
}

export function Reto({ curso, n, verano }: Props) {
  const carga = useCarga(() => cargarSemilla(curso, verano, n), [claveCurso(curso), n, verano]);
  const clave = verano ? claveVerano(n) : claveSemana(n);
  const jugado = marcadoDe(curso, clave)?.hecho.includes('reto') ?? false;
  const totalRetos = Object.values(datos.value.progreso).reduce((s, sem) => s + Object.values(sem).filter((x) => x.hecho.includes('reto')).length, 0);
  const volver = { tipo: verano ? 'verano' : 'semana', ...curso, n } as const;

  return (
    <>
      <p class="contexto">{contexto(curso)}</p>
      <Cargando
        carga={carga}
        hijo={(c) => {
          if (!c) {
            return (
              <>
                <h1 tabIndex={-1}>{t('reto.titulo')}</h1>
                <p>{t('semana.en_camino')}</p>
              </>
            );
          }
          const r = c.semilla.reto;
          return (
            <>
              <div class="portada portada-reto">
                {r.pasos[0] && (
                  <span class="burbuja">
                    <Pictograma nombre={r.pasos[0].pictograma} />
                  </span>
                )}
                <div>
                  <h1 tabIndex={-1}>
                    <Contenido texto={r.titulo} />
                  </h1>
                  <p class="chips">
                    <span class="chip">{t('reto.minutos', { n: r.minutos })}</span>
                  </p>
                </div>
              </div>

              <section aria-labelledby="material">
                <h2 id="material">{t('reto.material')}</h2>
                <ul class="material">
                  {r.material.map((m, i) => (
                    <li key={i}>
                      <Contenido texto={m} />
                    </li>
                  ))}
                </ul>
              </section>

              {r.aviso && (
                <section class="tarjeta aviso-seguridad" aria-labelledby="aviso">
                  <h2 id="aviso">{t('reto.aviso')}</h2>
                  <p>
                    <Contenido texto={r.aviso} />
                  </p>
                </section>
              )}

              <section aria-labelledby="pasos">
                <h2 id="pasos">{t('reto.pasos')}</h2>
                <ol class="pasos">
                  {r.pasos.map((paso, i) => (
                    <li key={i}>
                      <span class="burbuja">
                        <span class="paso-numero" aria-hidden="true">
                          {i + 1}
                        </span>
                        <Pictograma nombre={paso.pictograma} />
                      </span>
                      <span>
                        <Contenido texto={paso.texto} />
                      </span>
                    </li>
                  ))}
                </ol>
              </section>

              {r.rapidez && (
                <>
                  <Cronometro segundos={r.rapidez.segundos} />
                  <Record curso={curso} clave={clave} reto={r.rapidez} />
                </>
              )}

              <section class="dos-columnas" aria-label={`${t('reto.mas_facil')} / ${t('reto.mas_dificil')}`}>
                <div class="tarjeta tarjeta-facil">
                  <h2>{t('reto.mas_facil')}</h2>
                  <p>
                    <Contenido texto={r.masFacil} />
                  </p>
                </div>
                <div class="tarjeta tarjeta-dificil">
                  <h2>{t('reto.mas_dificil')}</h2>
                  <p>
                    <Contenido texto={r.masDificil} />
                  </p>
                </div>
              </section>

              <section aria-labelledby="para-que">
                <h2 id="para-que">{t('reto.para_que_sirve')}</h2>
                <p>
                  <Contenido texto={r.paraQueSirve} />
                </p>
              </section>
            </>
          );
        }}
      />
      {carga.estado === 'listo' && carga.valor && (
        <div class="marcar">
          <button type="button" class="boton boton-principal" aria-pressed={jugado} onClick={() => alternarElemento(curso, clave, 'reto')}>
            {t('reto.jugado')}
          </button>
          {jugado && <span class="estado-marcado">✓ {t('reto.jugado_marcado')}</span>}
        </div>
      )}
      {jugado && totalRetos === 1 && (
        <p class="aviso-instalar">
          {t('aviso.instalar')} <a href={construir({ tipo: 'ajustes' })}>{t('ajustes.instalar')}</a>
        </p>
      )}
      <div class="acciones-pie">
        <a class="boton" href={construir(volver)}>
          <span class="flecha-texto" aria-hidden="true">
            ←
          </span>
          {t('reto.ver_semana')}
        </a>
      </div>
    </>
  );
}
