// «Qué aprenden este curso»: entrada, frases por trimestre, bloques del ciclo y fuentes.
import { cargarObjetivos, useCarga } from '../contenido';
import { situacionHoy } from '../estado';
import { t, tDinamico } from '../idioma';
import { claveCurso, type Curso } from '../nucleo/tipos';
import { Cargando } from '../piezas/Carga';
import { Contenido } from '../piezas/Contenido';
import { Fuentes } from '../piezas/Fuentes';

export function Aprenden({ curso }: { curso: Curso }) {
  const carga = useCarga(() => cargarObjetivos(curso), [claveCurso(curso)]);
  const sit = situacionHoy.value;
  const trimestreActual = sit.tipo === 'curso' ? sit.trimestre : null;
  return (
    <>
      <h1 tabIndex={-1}>{t('aprenden.titulo')}</h1>
      <Cargando
        carga={carga}
        hijo={({ entrada, cursos, bloques, fuentes }) => {
          const delCurso = cursos[String(curso.curso)] ?? {};
          return (
            <>
              {entrada.map((parrafo, i) => (
                <p key={i}>
                  <Contenido texto={parrafo} />
                </p>
              ))}
              {Object.keys(delCurso)
                .sort()
                .map((trimestre) => (
                  <section key={trimestre} class={Number(trimestre) === trimestreActual ? 'tarjeta destacada' : 'tarjeta'} aria-labelledby={`trimestre-${trimestre}`}>
                    <h2 id={`trimestre-${trimestre}`}>{t('aprenden.trimestre', { n: trimestre })}</h2>
                    {Number(trimestre) === trimestreActual && (
                      <p class="chips">
                        <span class="chip chip-hoy">{t('aprenden.ahora')}</span>
                      </p>
                    )}
                    <ul>
                      {(delCurso[trimestre] ?? []).map((frase, i) => (
                        <li key={i}>
                          <Contenido texto={frase} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              <section class="tarjeta" aria-labelledby="ciclo">
                <h2 id="ciclo">{tDinamico(`aprenden.ciclo_titulo.${curso.ciclo}`)}</h2>
                <ul>
                  {bloques.map((bloque, i) => (
                    <li key={i}>
                      <Contenido texto={bloque} />
                    </li>
                  ))}
                </ul>
              </section>
              <Fuentes fuentes={fuentes} />
            </>
          );
        }}
      />
    </>
  );
}
