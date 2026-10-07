// Hoja de récords para imprimir: los juegos de rapidez de cada curso, con el mejor resultado y un hueco para anotar.
import { cargarMapa, useCarga } from '../contenido';
import { datos } from '../estado';
import { t } from '../idioma';
import { esCursoActivo, type Catalogo } from '../nucleo/catalogo';
import catalogoJson from '../../config/catalogo.json';
import { formatearNumero } from '../nucleo/numeros';
import { recordsDe } from '../nucleo/recibir';
import { claveSemana, claveVerano, leerClaveCurso, type Curso } from '../nucleo/tipos';
import { Cargando } from '../piezas/Carga';
import { contexto } from '../piezas/Layout';

const catalogo = catalogoJson as Catalogo;

function Hoja({ curso }: { curso: Curso }) {
  const carga = useCarga(() => cargarMapa(curso), [curso.ciclo, curso.area, curso.curso]);
  return (
    <Cargando
      carga={carga}
      hijo={(mapa) => {
        const records = recordsDe(datos.value, curso);
        const semanas = (mapa.cursos[String(curso.curso)] ?? []).filter((e) => e.rapidez);
        const veranos = (mapa.verano[String(curso.curso)] ?? []).filter((e) => e.rapidez);
        const filas = [
          ...semanas.map((e) => ({ id: claveSemana(e.semana ?? 0), nombre: t('semana.titulo', { n: e.semana ?? 0 }), titulo: e.titulo })),
          ...veranos.map((e) => {
            const n = Number(/(\d+)$/.exec(e.id ?? '')?.[1] ?? 0);
            return { id: claveVerano(n), nombre: t('verano.titulo', { n }), titulo: e.titulo };
          }),
        ];
        return (
          <section class="hoja-records">
            <h2>{contexto(curso)}</h2>
            <table class="tabla-records">
              <thead>
                <tr>
                  <th scope="col">{t('imprimir.semana')}</th>
                  <th scope="col">{t('imprimir.juego')}</th>
                  <th scope="col">{t('imprimir.record')}</th>
                  <th scope="col">{t('imprimir.anotar')}</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id}>
                    <th scope="row">{f.nombre}</th>
                    <td lang="es">{f.titulo}</td>
                    <td>{records.has(f.id) ? formatearNumero(records.get(f.id) ?? 0) : ''}</td>
                    <td class="anotar" />
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      }}
    />
  );
}

export function Records() {
  const cursos = datos.value.cursos.flatMap((c) => {
    const curso = leerClaveCurso(c);
    return curso && esCursoActivo(curso, catalogo) ? [curso] : [];
  });
  return (
    <>
      <h1 tabIndex={-1}>{t('imprimir.titulo')}</h1>
      <p class="no-imprimir">{t('imprimir.ayuda')}</p>
      <div class="acciones no-imprimir">
        <button type="button" class="boton boton-principal" onClick={() => window.print()}>
          {t('imprimir.imprimir')}
        </button>
      </div>
      {cursos.length === 0 ? <p>{t('imprimir.sin_cursos')}</p> : cursos.map((c) => <Hoja key={`${c.ciclo}/${c.area}/${c.curso}`} curso={c} />)}
    </>
  );
}
