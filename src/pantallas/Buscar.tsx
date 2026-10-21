// «Buscar en las semillas»: en qué semanas y cursos sale una palabra (`contenido/busqueda-{idioma}.json`).
import { signal } from '@preact/signals';
import { useState } from 'preact/hooks';
import catalogoJson from '../../config/catalogo.json';
import { cargarBusqueda, useCarga } from '../contenido';
import { datos } from '../estado';
import { idioma, t } from '../idioma';
import { buscar, porCurso, type Coincidencia, type Resultado } from '../nucleo/buscar';
import { esCursoActivo, type Catalogo } from '../nucleo/catalogo';
import { construir } from '../nucleo/rutas';
import { leerClaveCurso, leerClaveSemilla, type Curso } from '../nucleo/tipos';
import { Cargando } from '../piezas/Carga';
import { contexto } from '../piezas/Layout';
import { Marcado } from '../piezas/Marcado';

const catalogo = catalogoJson as Catalogo;

/** Lo último buscado: al volver de una semilla, la búsqueda sigue ahí. */
const buscado = signal('');

function etiqueta(c: Coincidencia): string {
  switch (c.lugar.tipo) {
    case 'objetivo': return t('semana.objetivo');
    case 'reto': return t('reto.titulo');
    case 'pregunta': return t('pregunta.titulo', { n: c.lugar.p });
    case 'tema': return t('buscar.tema');
    default: return t('buscar.saber');
  }
}

function Semilla({ curso, resultado }: { curso: Curso; resultado: Resultado }) {
  const semilla = leerClaveSemilla(resultado.clave.split('/')[3]);
  if (!semilla) return null;
  const { verano, n } = semilla;
  const nombre = verano ? t('verano.titulo', { n }) : t('semana.titulo', { n });
  return (
    <li>
      <a href={construir({ tipo: verano ? 'verano' : 'semana', ...curso, n })}>
        {nombre} · <Marcado texto={resultado.titulo} />
      </a>
      {resultado.coincidencias.length > 0 && (
        <ul class="coincidencias">
          {resultado.coincidencias.map((c, i) => (
            <li key={i}>
              <span class="etiqueta">{etiqueta(c)}: </span>
              {/* Lo que solo sale en español va aislado de izquierda a derecha, para que en árabe no se desordene. */}
              {c.deEspanol ? (
                <bdi lang="es" dir="ltr">
                  <Marcado texto={c.texto} />
                </bdi>
              ) : (
                <Marcado texto={c.texto} />
              )}
              {c.deEspanol && <span class="chip">{t('buscar.en_espanol')}</span>}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function Buscar() {
  const [escrito, setEscrito] = useState(buscado.value);
  const carga = useCarga(() => cargarBusqueda(idioma.value), [idioma.value]);
  const consulta = buscado.value.trim();
  const grupos =
    carga.estado === 'listo' && consulta !== ''
      ? porCurso(buscar(consulta, carga.valor.indice, carga.valor.espanol), datos.value.cursos).flatMap((g) => {
          const curso = leerClaveCurso(g.curso);
          return curso && esCursoActivo(curso, catalogo) ? [{ curso, resultados: g.resultados }] : [];
        })
      : null;
  const total = grupos?.reduce((suma, g) => suma + g.resultados.length, 0) ?? 0;

  return (
    <>
      <h1 tabIndex={-1}>{t('buscar.titulo')}</h1>
      <form
        role="search"
        class="formulario-campo"
        onSubmit={(e) => {
          e.preventDefault();
          buscado.value = escrito;
        }}
      >
        <label for="consulta">{t('buscar.etiqueta')}</label>
        <input
          id="consulta"
          class="campo-codigo"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          aria-describedby="consulta-ejemplo"
          value={escrito}
          onInput={(e) => setEscrito((e.target as HTMLInputElement).value)}
        />
        <button type="submit" class="boton boton-principal" disabled={escrito.trim() === ''}>
          {t('buscar.boton')}
        </button>
        <p id="consulta-ejemplo" class="ayuda-campo">
          {t('buscar.ejemplo')}
        </p>
      </form>
      <div role="status">
        {grupos && <p class="etiqueta">{total > 0 ? t('buscar.encontradas', { n: total }) : t('buscar.nada', { texto: consulta })}</p>}
      </div>
      {consulta !== '' && carga.estado !== 'listo' && <Cargando carga={carga} hijo={() => null} />}
      {grupos?.map(({ curso, resultados }) => {
        const id = `curso-${curso.ciclo}-${curso.area}-${curso.curso}`;
        return (
          <section key={id} class="tarjeta" aria-labelledby={id}>
            <h2 id={id}>{contexto(curso)}</h2>
            <ul class="resultados">
              {resultados.map((r) => (
                <Semilla key={r.clave} curso={curso} resultado={r} />
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
