// «Qué aprenden este curso», por trimestre.
import { cargarObjetivos, useCarga } from '../contenido';
import { situacionHoy } from '../estado';
import { t } from '../idioma';
import { claveCurso, type Curso } from '../nucleo/tipos';
import { Cargando } from '../piezas/Carga';
import { Contenido } from '../piezas/Contenido';
import { contexto } from '../piezas/Layout';

export function Aprenden({ curso }: { curso: Curso }) {
  const carga = useCarga(() => cargarObjetivos(curso), [claveCurso(curso)]);
  const sit = situacionHoy.value;
  const trimestreActual = sit.tipo === 'curso' ? sit.trimestre : null;
  return (
    <>
      <p class="contexto">{contexto(curso)}</p>
      <h1 tabIndex={-1}>{t('aprenden.titulo')}</h1>
      <Cargando
        carga={carga}
        hijo={(objetivos) => {
          const delCurso = objetivos[String(curso.curso)] ?? {};
          return (
            <>
              {Object.keys(delCurso)
                .sort()
                .map((trimestre) => (
                  <section key={trimestre} class={Number(trimestre) === trimestreActual ? 'tarjeta destacada' : 'tarjeta'} aria-labelledby={`trimestre-${trimestre}`}>
                    <h2 id={`trimestre-${trimestre}`}>{t('aprenden.trimestre', { n: trimestre })}</h2>
                    <ul>
                      {(delCurso[trimestre] ?? []).map((frase, i) => (
                        <li key={i}>
                          <Contenido texto={frase} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
            </>
          );
        }}
      />
    </>
  );
}
