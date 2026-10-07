// «Esta semana» (inicio) y los retos de verano: objetivo, pregunta de hoy, reto y selector de semana.
import { cargarIndice, cargarMapa, cargarSemilla, claveEnIndice, useCarga } from '../contenido';
import { datos, hoyFecha, marcadoDe, situacionHoy } from '../estado';
import { idioma, t, tDinamico } from '../idioma';
import { hoy as hoyDe } from '../nucleo/calendario';
import { semillaCercana } from '../nucleo/jardin';
import { rutaDeSituacion } from '../nucleo/inicio';
import { construir, type Ruta } from '../nucleo/rutas';
import { SEMANAS, VERANOS, claveCurso, claveSemana, claveVerano, esElemento, type Curso } from '../nucleo/tipos';
import { traduccionAutomatica, type SemillaContenido } from '../nucleo/contenido';
import { Cargando } from '../piezas/Carga';
import { Contenido } from '../piezas/Contenido';
import { Icono } from '../piezas/Icono';
import { contexto } from '../piezas/Layout';
import { TarjetaPregunta } from '../piezas/TarjetaPregunta';

interface Props {
  curso: Curso;
  n: number;
  verano: boolean;
}

const rutaDe = (curso: Curso, verano: boolean, n: number): Ruta => ({ tipo: verano ? 'verano' : 'semana', ...curso, n });

function Selector({ curso, verano, n }: Props) {
  const maximo = verano ? VERANOS : SEMANAS;
  const etiqueta = verano ? t('verano.titulo', { n }) : t('semana.titulo', { n });
  const flecha = (m: number, texto: string, simbolo: string) =>
    m >= 1 && m <= maximo ? (
      <a class="flecha" href={construir(rutaDe(curso, verano, m))} rel={m < n ? 'prev' : 'next'}>
        <span aria-hidden="true">{simbolo}</span>
        <span class="solo-lectores">{texto}</span>
      </a>
    ) : (
      <span class="flecha inactiva" aria-hidden="true">
        {simbolo}
      </span>
    );
  return (
    <div class="selector-semana" role="group" aria-label={etiqueta}>
      {flecha(n - 1, verano ? t('verano.anterior') : t('semana.anterior'), '◀')}
      <p class="semana-actual">{etiqueta}</p>
      {flecha(n + 1, verano ? t('verano.siguiente') : t('semana.siguiente'), '▶')}
    </div>
  );
}

function EnCamino({ curso, verano, n }: Props) {
  const mapa = useCarga(() => cargarMapa(curso), [claveCurso(curso)]);
  const indice = useCarga(cargarIndice, []);
  const entrada = mapa.estado === 'listo' ? (verano ? mapa.valor.verano : mapa.valor.cursos)[String(curso.curso)]?.[n - 1] : undefined;
  const cercana =
    indice.estado === 'listo' ? semillaCercana((m) => indice.valor.has(claveEnIndice(curso, verano, m)), n, verano ? VERANOS : SEMANAS) : null;
  return (
    <>
      {/* El título del mapa va en español: <bdi> lo aísla para que no se desordene en árabe. */}
      <h1 tabIndex={-1}>
        {entrada ? <bdi lang="es">{entrada.titulo}</bdi> : verano ? t('verano.titulo', { n }) : t('semana.titulo', { n })}
      </h1>
      <section class="tarjeta en-camino">
        <Icono nombre="espera" clase="icono-grande" />
        <div>
          <p class="en-camino-titulo">{t('semana.en_camino')}</p>
          {cercana !== null && (
            <>
              <p>{t('semana.mientras_tanto')}</p>
              <a class="boton boton-principal" href={construir(rutaDe(curso, verano, cercana))}>
                {verano ? t('verano.ir_a', { n: cercana }) : t('semana.ir_a', { n: cercana })}
              </a>
            </>
          )}
        </div>
      </section>
    </>
  );
}

function Detalle({ curso, verano, n, semilla, huellaActual }: Props & { semilla: SemillaContenido; huellaActual: string | null }) {
  const clave = verano ? claveVerano(n) : claveSemana(n);
  const sit = situacionHoy.value;
  const esActual = verano ? sit.tipo === 'verano' : sit.tipo === 'curso' && sit.semana === n;
  const dia = hoyDe(hoyFecha.value);
  const preguntaHoy = !verano && esActual && dia.tipo === 'pregunta' ? semilla.preguntas[dia.n - 1] : undefined;
  const marcado = marcadoDe(curso, clave);
  const jugado = marcado?.hecho.includes('reto') ?? false;
  const rutaReto: Ruta = { tipo: verano ? 'veranoReto' : 'reto', ...curso, n };
  const hechas = new Set((marcado?.hecho ?? []).filter(esElemento));

  return (
    <>
      <h1 tabIndex={-1}>
        <Contenido texto={semilla.titulo} />
      </h1>
      <div class="insignias">
        {semilla.tipo === 'recordar' && <span class="insignia">{t('semana.de_recordar')}</span>}
        {traduccionAutomatica(semilla, idioma.value, huellaActual) && <span class="insignia aviso">{t('aviso.traduccion_automatica')}</span>}
      </div>

      <section aria-labelledby="objetivo">
        <h2 id="objetivo">{t('semana.objetivo')}</h2>
        <p>
          <Contenido texto={semilla.objetivo} />
        </p>
      </section>

      {preguntaHoy && (
        <section class="tarjeta destacada" aria-labelledby="hoy">
          <h2 id="hoy">{t('semana.pregunta_hoy')}</h2>
          <p class="texto-pregunta">
            <Contenido texto={preguntaHoy.texto} />
          </p>
          <a class="boton boton-principal" href={construir({ tipo: 'pregunta', ...curso, n, p: dia.tipo === 'pregunta' ? dia.n : 1 })}>
            {t('semana.ver_pregunta')}
          </a>
        </section>
      )}

      {esActual && dia.tipo === 'finde' && !verano && <p class="aviso-fin-de-semana">{t('semana.fin_de_semana')}</p>}

      <section class="tarjeta" aria-labelledby="reto">
        <h2 id="reto">{t('semana.reto')}</h2>
        <p class="titulo-reto">
          <Icono nombre={jugado ? 'flor' : 'semilla'} />
          <Contenido texto={semilla.reto.titulo} />
        </p>
        <p>{t('reto.minutos', { n: semilla.reto.minutos })}</p>
        {jugado && <p class="estado-marcado">✓ {t('reto.jugado_marcado')}</p>}
        <a class={preguntaHoy ? 'boton' : 'boton boton-principal'} href={construir(rutaReto)}>
          {t('semana.ver_reto')}
        </a>
      </section>

      {!verano ? (
        <section aria-labelledby="preguntas">
          <h2 id="preguntas">{t('semana.preguntas')}</h2>
          <ol class="lista-preguntas">
            {semilla.preguntas.map((p, i) => (
              <li key={p.id}>
                <a href={construir({ tipo: 'pregunta', ...curso, n, p: i + 1 })}>
                  {tDinamico(`dia.${i + 1}`)} · {t('pregunta.titulo', { n: i + 1 })}
                </a>
                {hechas.has(p.id) && <span class="estado-marcado"> ✓ {t('pregunta.hablado_marcado')}</span>}
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <section aria-labelledby="preguntas">
          <h2 id="preguntas">{t('semana.preguntas')}</h2>
          {semilla.preguntas.map((p, i) => (
            <TarjetaPregunta key={p.id} curso={curso} claveSemilla={clave} pregunta={p} numero={i + 1} encabezado="h3" />
          ))}
        </section>
      )}

      <section class="tarjeta" aria-labelledby="ayudar">
        <h2 id="ayudar">{t('nav.ayuda')}</h2>
        <p>
          <Contenido texto={semilla.comoAyudar} />
        </p>
      </section>
    </>
  );
}

export function Semana({ curso, n, verano }: Props) {
  const clave = claveCurso(curso);
  const carga = useCarga(() => cargarSemilla(curso, verano, n), [clave, n, verano]);
  const sit = situacionHoy.value;
  const actual = rutaDeSituacion(curso, sit);
  const esActual = actual.tipo === (verano ? 'verano' : 'semana') && 'n' in actual && (verano || actual.n === n);
  const otro = datos.value.cursos.filter((c) => c !== clave);
  const otroCurso = otro.length > 0 ? otro[0] : null;
  const cambiar = otroCurso ? otroCurso.split('/') : null;

  return (
    <>
      <p class="contexto">{contexto(curso)}</p>
      <Selector curso={curso} verano={verano} n={n} />
      <Cargando
        carga={carga}
        hijo={(c) =>
          c ? (
            <Detalle curso={curso} verano={verano} n={n} semilla={c.semilla} huellaActual={c.huella} />
          ) : (
            <EnCamino curso={curso} verano={verano} n={n} />
          )
        }
      />
      <div class="acciones-pie">
        {!esActual && (
          <a class="boton" href={construir(actual)}>
            {t('semana.volver_actual')}
          </a>
        )}
        {cambiar && (
          <a
            class="boton"
            href={construir(rutaDe({ ciclo: Number(cambiar[0]), area: cambiar[1]!, curso: Number(cambiar[2]) }, verano, n))}
          >
            {t('semana.cambiar_curso', { curso: tDinamico(`curso.${cambiar[2]}`) })}
          </a>
        )}
      </div>
    </>
  );
}


