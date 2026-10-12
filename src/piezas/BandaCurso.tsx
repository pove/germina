// Banda del curso, bajo el menú: qué curso se está viendo y cómo cambiar de curso.
// Con dos cursos guardados, un toque cambia de uno a otro; con uno solo, «Cambiar» abre la lista de cursos.
import { useState } from 'preact/hooks';
import catalogoJson from '../../config/catalogo.json';
import { datos, guardar } from '../estado';
import { idioma, t, tDinamico } from '../idioma';
import { cursosActivos, esCursoActivo, nombreDeArea, type Catalogo } from '../nucleo/catalogo';
import { construir, type Ruta } from '../nucleo/rutas';
import { claveCurso, leerClaveCurso, type Curso } from '../nucleo/tipos';

const catalogo = catalogoJson as Catalogo;

type RutaDeCurso = Extract<Ruta, Curso>;

/** La misma pantalla en otro curso (la semana 7 de 3.º → la semana 7 de 4.º). */
const enOtroCurso = (ruta: RutaDeCurso, c: Curso): Ruta => ({ ...ruta, ciclo: c.ciclo, area: c.area, curso: c.curso });

export function BandaCurso({ ruta }: { ruta: RutaDeCurso }) {
  const [abierto, setAbierto] = useState(false);
  const actual = claveCurso(ruta);
  const guardados = datos.value.cursos.map(leerClaveCurso).filter((c): c is Curso => c !== null && esCursoActivo(c, catalogo));
  const area = nombreDeArea(ruta.area, idioma.value, catalogo);
  const rotulo = (c: Curso): string => tDinamico(`curso.${c.curso}`);

  /** Pasa a mirar otro curso; con `solo`, ese curso sustituye al que había. */
  const elegir = (c: Curso, solo: boolean): void => {
    const clave = claveCurso(c);
    const d = datos.value;
    guardar({ ...d, cursos: solo ? [clave] : d.cursos, cursoActivo: clave });
    setAbierto(false);
  };

  if (guardados.length >= 2) {
    return (
      <nav class="banda-curso" aria-label={t('curso.etiqueta')}>
        <div class="banda-curso-dentro">
          <span class="banda-area">{area}</span>
          <ul class="interruptor-curso">
            {guardados.map((c) => {
              const clave = claveCurso(c);
              return (
                <li key={clave}>
                  <a href={construir(enOtroCurso(ruta, c))} aria-current={clave === actual ? 'true' : undefined} onClick={() => elegir(c, false)}>
                    {rotulo(c)}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    );
  }

  return (
    <nav class="banda-curso" aria-label={t('curso.etiqueta')}>
      <div class="banda-curso-dentro">
        <span class="banda-area">
          {area} · <strong>{rotulo(ruta)}</strong>
        </span>
        <button type="button" class="boton boton-plegable boton-banda" aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
          {t('banda.cambiar')}
        </button>
      </div>
      {abierto && (
        <div class="banda-curso-panel">
          <ul class="interruptor-curso">
            {cursosActivos(catalogo).map((c) => {
              const clave = claveCurso(c);
              return (
                <li key={clave}>
                  <a href={construir(enOtroCurso(ruta, c))} aria-current={clave === actual ? 'true' : undefined} onClick={() => elegir(c, true)}>
                    {rotulo(c)}
                  </a>
                </li>
              );
            })}
          </ul>
          <p>
            {t('banda.dos_cursos')} <a href={construir({ tipo: 'ajustes' })}>{t('nav.ajustes')}</a>
          </p>
        </div>
      )}
    </nav>
  );
}
