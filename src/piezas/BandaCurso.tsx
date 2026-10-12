// Banda del curso, bajo el menú: «Matemáticas · [3.º ▾]». El botón abre una lista propia de cursos
// (igual en el móvil y en el escritorio, con dos cursos o con seis): arriba los que sigue la familia,
// debajo los demás. La banda solo sirve para mirar: los cursos de la familia se eligen en Ajustes.
import { useEffect, useRef, useState } from 'preact/hooks';
import catalogoJson from '../../config/catalogo.json';
import { datos, guardar } from '../estado';
import { idioma, t, tDinamico } from '../idioma';
import { cursosActivos, nombreDeArea, type Catalogo } from '../nucleo/catalogo';
import { construir, type Ruta } from '../nucleo/rutas';
import { claveCurso, type Curso } from '../nucleo/tipos';

const catalogo = catalogoJson as Catalogo;

type RutaDeCurso = Extract<Ruta, Curso>;

/** La misma pantalla en otro curso (la semana 7 de 3.º → la semana 7 de 4.º). */
const enOtroCurso = (ruta: RutaDeCurso, c: Curso): Ruta => ({ ...ruta, ciclo: c.ciclo, area: c.area, curso: c.curso });

export function BandaCurso({ ruta }: { ruta: RutaDeCurso }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const actual = claveCurso(ruta);
  const todos = cursosActivos(catalogo);
  const suyos = todos.filter((c) => datos.value.cursos.includes(claveCurso(c)));
  const otros = todos.filter((c) => !datos.value.cursos.includes(claveCurso(c)));
  const grupos = suyos.length > 0 && otros.length > 0 ? [{ titulo: t('banda.vuestros'), cursos: suyos }, { titulo: t('banda.otros'), cursos: otros }] : [{ titulo: null, cursos: todos }];

  // Se cierra al tocar fuera o al llevar el foco fuera (tabulador), y con Escape (el foco vuelve al botón).
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: Event): void => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('focusin', fuera);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('focusin', fuera);
    };
  }, [abierto]);

  const tecla = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape' || !abierto) return;
    setAbierto(false);
    boton.current?.focus();
  };

  /** Uno de los vuestros pasa a ser el curso activo; otro curso solo se mira: lo elegido en Ajustes no cambia. */
  const elegir = (c: Curso): void => {
    const clave = claveCurso(c);
    const d = datos.value;
    if (d.cursos.includes(clave) && d.cursoActivo !== clave) guardar({ ...d, cursoActivo: clave });
    setAbierto(false);
  };

  return (
    <nav class="banda-curso" aria-label={t('curso.etiqueta')}>
      <div class="banda-curso-dentro">
        <span class="banda-area">{nombreDeArea(ruta.area, idioma.value, catalogo)}</span>
        <div class="selector-curso" ref={caja} onKeyDown={tecla}>
          <button
            type="button"
            ref={boton}
            class="boton boton-plegable boton-curso"
            aria-expanded={abierto}
            aria-controls="lista-cursos"
            onClick={() => setAbierto(!abierto)}
          >
            <span class="solo-lectores">{t('curso.etiqueta')}: </span>
            {tDinamico(`curso.${ruta.curso}`)}
          </button>
          {abierto && (
            <div id="lista-cursos" class="lista-cursos">
              {grupos.map((g) => (
                <div key={g.titulo ?? 'todos'}>
                  {g.titulo && <p class="lista-cursos-titulo">{g.titulo}</p>}
                  <ul>
                    {g.cursos.map((c) => {
                      const clave = claveCurso(c);
                      return (
                        <li key={clave}>
                          <a href={construir(enOtroCurso(ruta, c))} aria-current={clave === actual ? 'true' : undefined} onClick={() => elegir(c)}>
                            {tDinamico(`curso.${c.curso}`)}
                            {clave === actual && <span aria-hidden="true">✓</span>}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
