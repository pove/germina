// «¿Añadir este jardín al vuestro?»: lee el código, pregunta y combina (6.4).
import { useMemo, useState } from 'preact/hooks';
import catalogoJson from '../../config/catalogo.json';
import { irA } from '../enrutador';
import { anoCursoHoy, datos, guardar } from '../estado';
import { t } from '../idioma';
import type { Catalogo } from '../nucleo/catalogo';
import { decodificar } from '../nucleo/enlace';
import { aplicarRecibido, estaVacio, soloActivos } from '../nucleo/recibir';
import { construir } from '../nucleo/rutas';
import { leerClaveCurso } from '../nucleo/tipos';
import { rotuloCurso } from '../piezas/Layout';

const catalogo = catalogoJson as Catalogo;

export function Recibir({ codigo }: { codigo: string }) {
  const resultado = useMemo(() => decodificar(codigo), [codigo]);
  const [hecho, setHecho] = useState(false);

  if (!resultado.ok) {
    return (
      <>
        <h1 tabIndex={-1}>{t('recibir.titulo')}</h1>
        <div role="alert" class="tarjeta">
          <p>{t('recibir.error')}</p>
        </div>
        <div class="acciones-pie">
          <a class="boton boton-principal" href={construir({ tipo: 'pasar' })}>
            {t('pasar.titulo')}
          </a>
          <a class="boton" href={construir({ tipo: 'inicio' })}>
            {t('nav.inicio')}
          </a>
        </div>
      </>
    );
  }

  const recibido = soloActivos(resultado.recibido, catalogo);
  const primero = leerClaveCurso(datos.value.cursoActivo ?? datos.value.cursos[0] ?? recibido.cursos[0]);

  if (hecho) {
    return (
      <>
        <h1 tabIndex={-1}>{t('recibir.titulo')}</h1>
        <p role="status" class="tarjeta">
          {t('recibir.hecho')}
        </p>
        <div class="acciones-pie">
          {primero && (
            <a class="boton boton-principal" href={construir({ tipo: 'jardin', ...primero })}>
              {t('recibir.ver_jardin')}
            </a>
          )}
          <a class="boton" href={construir({ tipo: 'inicio' })}>
            {t('nav.inicio')}
          </a>
        </div>
      </>
    );
  }

  if (estaVacio(recibido)) {
    return (
      <>
        <h1 tabIndex={-1}>{t('recibir.titulo')}</h1>
        <p class="tarjeta">{t('recibir.vacio')}</p>
        <div class="acciones-pie">
          <a class="boton" href={construir({ tipo: 'inicio' })}>
            {t('nav.inicio')}
          </a>
        </div>
      </>
    );
  }

  const anadir = (): void => {
    guardar(aplicarRecibido(datos.value, recibido, anoCursoHoy.value));
    setHecho(true);
  };

  return (
    <>
      <h1 tabIndex={-1}>{t('recibir.titulo')}</h1>
      <p>{t('recibir.explicacion')}</p>
      {recibido.cursos.length > 0 && (
        <section aria-labelledby="cursos">
          <h2 id="cursos">{t('recibir.cursos')}</h2>
          <ul class="insignias">
            {recibido.cursos.map((clave) => {
              const curso = leerClaveCurso(clave);
              return curso ? (
                <li key={clave} class="insignia">
                  {rotuloCurso(curso)}
                </li>
              ) : null;
            })}
          </ul>
        </section>
      )}
      <div class="acciones-pie">
        <button type="button" class="boton boton-principal" onClick={anadir}>
          {t('recibir.anadir')}
        </button>
        <button type="button" class="boton" onClick={() => irA({ tipo: 'inicio' }, true)}>
          {t('recibir.no')}
        </button>
      </div>
    </>
  );
}
