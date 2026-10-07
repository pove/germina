// Cambio de curso en septiembre: «¿Vuestro hijo o hija ha pasado a 4.º?» por cada curso guardado.
import catalogoJson from '../../config/catalogo.json';
import { useState } from 'preact/hooks';
import { irA } from '../enrutador';
import { anoCursoHoy, datos, guardar } from '../estado';
import { t, tDinamico } from '../idioma';
import { aplicarCambio, pendientes } from '../nucleo/cambio-de-curso';
import type { Catalogo } from '../nucleo/catalogo';
import { construir, type Ruta } from '../nucleo/rutas';
import { claveCurso } from '../nucleo/tipos';
import { Icono } from '../piezas/Icono';

const catalogo = catalogoJson as Catalogo;

export function CambioDeCurso() {
  const [lista] = useState(() => pendientes(datos.value, catalogo));
  const [pasaron, setPasaron] = useState<ReadonlySet<string>>(new Set());
  const marcar = (clave: string, pasa: boolean): void =>
    setPasaron((antes) => {
      const nuevo = new Set(antes);
      if (pasa) nuevo.add(clave);
      else nuevo.delete(clave);
      return nuevo;
    });

  const seguir = (destino: Ruta = { tipo: 'inicio' }): void => {
    guardar(aplicarCambio(datos.value, lista, pasaron, anoCursoHoy.value));
    irA(destino, true);
  };

  return (
    <>
      <h1 tabIndex={-1}>{t('app.nombre')}</h1>
      {lista.map(({ curso, siguiente }) => {
        const clave = claveCurso(curso);
        if (!siguiente) {
          return (
            <section key={clave} class="tarjeta" aria-labelledby={`fin-${clave}`}>
              <Icono nombre="flor" />
              <h2 id={`fin-${clave}`}>{tDinamico(`curso.${curso.curso}`)}</h2>
              <p>{t('cambio_curso.fin_ciclo')}</p>
              <a
                class="boton"
                href={construir({ tipo: 'verano', ...curso, n: 1 })}
                onClick={(e) => {
                  e.preventDefault();
                  seguir({ tipo: 'verano', ...curso, n: 1 });
                }}
              >
                {t('cambio_curso.ver_verano')}
              </a>
            </section>
          );
        }
        const pasa = pasaron.has(clave);
        const nombre = tDinamico(`curso.${siguiente.curso}`);
        return (
          <section key={clave} class="tarjeta" aria-labelledby={`pregunta-${clave}`}>
            <h2 id={`pregunta-${clave}`}>{t('cambio_curso.pregunta', { curso: nombre })}</h2>
            <div class="selector-idioma" role="group" aria-labelledby={`pregunta-${clave}`}>
              <button type="button" aria-pressed={pasa} onClick={() => marcar(clave, true)}>
                {t('cambio_curso.si', { curso: nombre })}
              </button>
              <button type="button" aria-pressed={!pasa} onClick={() => marcar(clave, false)}>
                {t('cambio_curso.no')}
              </button>
            </div>
          </section>
        );
      })}
      <button type="button" class="boton boton-principal" onClick={() => seguir()}>
        {t('cambio_curso.seguir')}
      </button>
    </>
  );
}
