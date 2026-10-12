// Banda del curso, bajo el menú: qué curso se está viendo y cómo cambiar de curso.
// Siempre en una fila. Con dos cursos guardados, un toque cambia de uno a otro; con uno solo, «Cambiar»
// convierte la banda en el mismo interruptor con los cursos del ciclo, y elegir otro sustituye al que había.
import { useEffect, useRef, useState } from 'preact/hooks';
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
  const dos = guardados.length >= 2;
  const interruptor = useRef<HTMLUListElement>(null);

  // Al pulsar «Cambiar», el botón da paso a los cursos: el foco va al curso que se está viendo.
  useEffect(() => {
    if (abierto) interruptor.current?.querySelector<HTMLAnchorElement>('[aria-current]')?.focus();
  }, [abierto]);

  /** Pasa a mirar otro curso; con uno solo guardado, el elegido sustituye al que había. */
  const elegir = (c: Curso): void => {
    const clave = claveCurso(c);
    const d = datos.value;
    guardar({ ...d, cursos: dos ? d.cursos : [clave], cursoActivo: clave });
    setAbierto(false);
  };

  return (
    <nav class="banda-curso" aria-label={t('curso.etiqueta')}>
      <div class="banda-curso-dentro">
        {dos || abierto ? (
          <>
            <span class="banda-area">{area}</span>
            <ul class="interruptor-curso" ref={interruptor}>
              {(dos ? guardados : cursosActivos(catalogo)).map((c) => {
                const clave = claveCurso(c);
                return (
                  <li key={clave}>
                    <a href={construir(enOtroCurso(ruta, c))} aria-current={clave === actual ? 'true' : undefined} onClick={() => elegir(c)}>
                      {tDinamico(`curso_corto.${c.curso}`)}
                    </a>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <>
            <span class="banda-area">
              {area} · <strong>{tDinamico(`curso_corto.${ruta.curso}`)}</strong>
            </span>
            <button type="button" class="boton boton-plegable boton-banda" onClick={() => setAbierto(true)}>
              {t('banda.cambiar')}
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
