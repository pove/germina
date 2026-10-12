// Banda del curso, bajo el menú: «Matemáticas · [3.º ▾]». El curso es un desplegable del sistema,
// que sirve igual con dos cursos que con seis. Arriba, los cursos que sigue la familia; debajo, los demás.
// Elegir uno de los suyos solo cambia de curso; elegir otro lo pone en lugar del que se está viendo.
import catalogoJson from '../../config/catalogo.json';
import { irA } from '../enrutador';
import { datos, guardar } from '../estado';
import { idioma, t, tDinamico } from '../idioma';
import { cursosActivos, nombreDeArea, type Catalogo } from '../nucleo/catalogo';
import type { Ruta } from '../nucleo/rutas';
import { claveCurso, leerClaveCurso, type Curso } from '../nucleo/tipos';

const catalogo = catalogoJson as Catalogo;

type RutaDeCurso = Extract<Ruta, Curso>;

/** La misma pantalla en otro curso (la semana 7 de 3.º → la semana 7 de 4.º). */
const enOtroCurso = (ruta: RutaDeCurso, c: Curso): Ruta => ({ ...ruta, ciclo: c.ciclo, area: c.area, curso: c.curso });

export function BandaCurso({ ruta }: { ruta: RutaDeCurso }) {
  const actual = claveCurso(ruta);
  const todos = cursosActivos(catalogo);
  const suyos = todos.filter((c) => datos.value.cursos.includes(claveCurso(c)));
  const otros = todos.filter((c) => !datos.value.cursos.includes(claveCurso(c)));
  const opcion = (c: Curso) => (
    <option key={claveCurso(c)} value={claveCurso(c)}>
      {tDinamico(`curso.${c.curso}`)}
    </option>
  );

  const elegir = (clave: string): void => {
    const c = leerClaveCurso(clave);
    if (!c || clave === actual) return;
    const d = datos.value;
    const cursos = d.cursos.includes(clave) ? d.cursos : [...d.cursos.filter((k) => k !== actual), clave].sort();
    guardar({ ...d, cursos, cursoActivo: clave });
    irA(enOtroCurso(ruta, c));
  };

  return (
    <div class="banda-curso">
      <div class="banda-curso-dentro">
        <label class="banda-area" for="selector-curso">
          {nombreDeArea(ruta.area, idioma.value, catalogo)}
          <span class="solo-lectores"> · {t('curso.etiqueta')}</span>
        </label>
        <span class="selector-curso">
          <select id="selector-curso" value={actual} onChange={(e) => elegir(e.currentTarget.value)}>
            {suyos.length > 0 && otros.length > 0 ? (
              <>
                <optgroup label={t('banda.vuestros')}>{suyos.map(opcion)}</optgroup>
                <optgroup label={t('banda.otros')}>{otros.map(opcion)}</optgroup>
              </>
            ) : (
              todos.map(opcion)
            )}
          </select>
        </span>
      </div>
    </div>
  );
}
