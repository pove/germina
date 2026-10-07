// «El jardín»: las 41 semanas y los 10 retos de verano como plantas; tocar una lleva a su semana.
import { cargarIndice, claveEnIndice, useCarga } from '../contenido';
import { anoCursoHoy, datos, situacionHoy } from '../estado';
import { t, tDinamico } from '../idioma';
import { claveProgreso } from '../nucleo/almacen';
import { estadoPlanta, type EstadoPlanta } from '../nucleo/jardin';
import { construir } from '../nucleo/rutas';
import { SEMANAS, VERANOS, claveSemana, claveVerano, type Curso } from '../nucleo/tipos';
import { Cargando } from '../piezas/Carga';
import { Icono } from '../piezas/Icono';
import { contexto } from '../piezas/Layout';
import { Plegable } from '../piezas/Plegable';

export function Explicacion() {
  return (
    <ol class="explicacion">
      <li>
        <Icono nombre="semilla" />
        <span>{t('explicacion.1')}</span>
      </li>
      <li>
        <Icono nombre="brote" />
        <span>{t('explicacion.2')}</span>
      </li>
      <li>
        <Icono nombre="espera" />
        <span>{t('explicacion.3')}</span>
      </li>
    </ol>
  );
}

function Planta({ curso, verano, n, existe, actual, estado }: { curso: Curso; verano: boolean; n: number; existe: boolean; actual: boolean; estado: EstadoPlanta }) {
  const nombre = verano ? t('verano.titulo', { n }) : t('semana.titulo', { n });
  const texto = existe ? tDinamico(`jardin.estado.${estado}`) : t('jardin.estado.en_camino');
  // La semana de hoy se marca aunque su semilla aún esté en camino.
  const clase = `planta ${existe ? `planta-${estado}` : 'planta-sin-semilla'}${actual ? ' planta-hoy' : ''}`;
  const contenido = (
    <>
      <Icono nombre={estado} />
      <span class="numero">{n}</span>
    </>
  );
  return existe ? (
    <a class={clase} href={construir({ tipo: verano ? 'verano' : 'semana', ...curso, n })} aria-current={actual ? 'date' : undefined} aria-label={`${nombre}: ${texto}`}>
      {contenido}
    </a>
  ) : (
    <span class={clase} role="img" aria-current={actual ? 'date' : undefined} aria-label={`${nombre}: ${texto}`}>
      {contenido}
    </span>
  );
}

export function Jardin({ curso }: { curso: Curso }) {
  const indice = useCarga(cargarIndice, []);
  const progreso = datos.value.progreso[claveProgreso(anoCursoHoy.value, curso)] ?? {};
  const sit = situacionHoy.value;
  // El icono es solo un adorno: el lector de pantalla lee «Qué es el jardín».
  const ayuda = (
    <>
      <Icono nombre="ayuda" clase="icono-boton icono-ayuda" />
      {t('jardin.ayuda')}
    </>
  );

  return (
    <>
      <p class="contexto">{contexto(curso)}</p>
      <h1 tabIndex={-1}>{t('jardin.titulo')}</h1>
      <Plegable etiqueta={ayuda} clase="boton-ayuda">
        <Explicacion />
      </Plegable>
      <Cargando
        carga={indice}
        hijo={(existentes) => (
          <>
            <section aria-labelledby="semanas">
              <h2 id="semanas">{t('jardin.semanas')}</h2>
              <ol class="jardin">
                {Array.from({ length: SEMANAS }, (_, i) => i + 1).map((n) => (
                  <li key={n}>
                    <Planta
                      curso={curso}
                      verano={false}
                      n={n}
                      existe={existentes.has(claveEnIndice(curso, false, n))}
                      actual={sit.tipo === 'curso' && sit.semana === n}
                      estado={estadoPlanta(progreso[claveSemana(n)])}
                    />
                  </li>
                ))}
              </ol>
            </section>
            <section aria-labelledby="veranos">
              <h2 id="veranos">{t('jardin.veranos')}</h2>
              <ol class="jardin">
                {Array.from({ length: VERANOS }, (_, i) => i + 1).map((n) => (
                  <li key={n}>
                    <Planta
                      curso={curso}
                      verano={true}
                      n={n}
                      existe={existentes.has(claveEnIndice(curso, true, n))}
                      actual={false}
                      estado={estadoPlanta(progreso[claveVerano(n)])}
                    />
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
      />
    </>
  );
}
