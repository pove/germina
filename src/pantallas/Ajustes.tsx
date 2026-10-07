// «Ajustes»: idioma, cursos, explicación de la semilla y el jardín, cómo instalar y empezar de cero.
// Con enlaces a «Llevar el jardín a otro móvil», la hoja de récords, la privacidad y la accesibilidad.
import catalogoJson from '../../config/catalogo.json';
import { useState } from 'preact/hooks';
import { anoCursoHoy, datos, guardar, almacen } from '../estado';
import { t, tDinamico } from '../idioma';
import { borrar, datosVacios } from '../nucleo/almacen';
import { cursosActivos, type Catalogo } from '../nucleo/catalogo';
import { irA } from '../enrutador';
import { construir } from '../nucleo/rutas';
import { claveCurso } from '../nucleo/tipos';
import { SelectorIdioma } from '../piezas/SelectorIdioma';
import { Explicacion } from './Jardin';

const catalogo = catalogoJson as Catalogo;

export function Ajustes() {
  const [confirmando, setConfirmando] = useState(false);
  const elegidos = datos.value.cursos;

  const alternarCurso = (clave: string): void => {
    const d = datos.value;
    const cursos = d.cursos.includes(clave) ? d.cursos.filter((c) => c !== clave) : [...d.cursos, clave].sort();
    if (cursos.length === 0) return; // siempre queda al menos un curso
    guardar({
      ...d,
      cursos,
      cursoActivo: d.cursoActivo && cursos.includes(d.cursoActivo) ? d.cursoActivo : cursos[0]!,
      ultimoAnoCurso: d.ultimoAnoCurso ?? anoCursoHoy.value,
    });
  };

  const empezarDeCero = (): void => {
    borrar(almacen);
    guardar({ ...datosVacios(), idioma: datos.value.idioma });
    setConfirmando(false);
    irA({ tipo: 'bienvenida' });
  };

  return (
    <>
      <h1 tabIndex={-1}>{t('ajustes.titulo')}</h1>

      <section class="tarjeta" aria-labelledby="idioma">
        <h2 id="idioma">{t('ajustes.idioma')}</h2>
        <SelectorIdioma />
      </section>

      <section class="tarjeta" aria-labelledby="cursos">
        <h2 id="cursos">{t('ajustes.cursos')}</h2>
        <div class="selector-idioma" role="group" aria-label={t('ajustes.cursos')}>
          {cursosActivos(catalogo).map((c) => {
            const clave = claveCurso(c);
            return (
              <button key={clave} type="button" aria-pressed={elegidos.includes(clave)} onClick={() => alternarCurso(clave)}>
                {tDinamico(`curso.${c.curso}`)}
              </button>
            );
          })}
        </div>
        <p>{t('bienvenida.curso_ayuda')}</p>
      </section>

      <section class="tarjeta" aria-labelledby="llevar">
        <h2 id="llevar">{t('ajustes.pasar')}</h2>
        <div class="acciones">
          <a class="boton" href={construir({ tipo: 'pasar' })}>
            {t('ajustes.pasar')}
          </a>
          <a class="boton" href={construir({ tipo: 'imprimirRecords' })}>
            {t('ajustes.records')}
          </a>
        </div>
      </section>

      <section class="tarjeta" aria-labelledby="explicacion">
        <h2 id="explicacion">{t('explicacion.titulo')}</h2>
        <Explicacion />
      </section>

      <section class="tarjeta" aria-labelledby="instalar">
        <h2 id="instalar">{t('ajustes.instalar')}</h2>
        <p>{t('instalar.por_que')}</p>
        <h3>{t('instalar.iphone')}</h3>
        <p>{t('instalar.iphone_pasos')}</p>
        <h3>{t('instalar.android')}</h3>
        <p>{t('instalar.android_pasos')}</p>
      </section>

      <section class="tarjeta" aria-labelledby="legal">
        <h2 id="legal">{t('ajustes.legal')}</h2>
        <div class="acciones">
          <a class="boton" href={construir({ tipo: 'privacidad' })}>
            {t('ajustes.privacidad')}
          </a>
          <a class="boton" href={construir({ tipo: 'accesibilidad' })}>
            {t('ajustes.accesibilidad')}
          </a>
        </div>
      </section>

      <section class="tarjeta" aria-labelledby="cero">
        <h2 id="cero">{t('ajustes.empezar_de_cero')}</h2>
        {confirmando ? (
          <div class="aviso-confirmar" role="alertdialog" aria-labelledby="aviso-cero">
            <p id="aviso-cero">{t('ajustes.empezar_de_cero_aviso')}</p>
            <div class="acciones">
              <button type="button" class="boton" onClick={empezarDeCero}>
                {t('ajustes.empezar_de_cero_si')}
              </button>
              <button type="button" class="boton" onClick={() => setConfirmando(false)}>
                {t('boton.cancelar')}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" class="boton" onClick={() => setConfirmando(true)}>
            {t('ajustes.empezar_de_cero')}
          </button>
        )}
      </section>
    </>
  );
}


