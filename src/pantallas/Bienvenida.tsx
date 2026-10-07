// Bienvenida: idioma, curso o cursos y las tres frases de semilla y jardín.
import catalogoJson from '../../config/catalogo.json';
import { useState } from 'preact/hooks';
import { irA } from '../enrutador';
import { anoCursoHoy, datos, guardar } from '../estado';
import { t, tDinamico } from '../idioma';
import { cursosActivos, type Catalogo } from '../nucleo/catalogo';
import { claveCurso } from '../nucleo/tipos';
import { SelectorIdioma } from '../piezas/SelectorIdioma';
import { Explicacion } from './Jardin';

const catalogo = catalogoJson as Catalogo;

export function Bienvenida() {
  const [elegidos, setElegidos] = useState<string[]>(datos.value.cursos);

  const alternar = (clave: string): void =>
    setElegidos((actuales) => (actuales.includes(clave) ? actuales.filter((c) => c !== clave) : [...actuales, clave].sort()));

  const empezar = (): void => {
    if (elegidos.length === 0) return;
    guardar({
      ...datos.value,
      cursos: elegidos,
      cursoActivo: elegidos.includes(datos.value.cursoActivo ?? '') ? datos.value.cursoActivo : elegidos[0]!,
      ultimoAnoCurso: anoCursoHoy.value,
    });
    irA({ tipo: 'inicio' }, true);
  };

  return (
    <>
      <h1 tabIndex={-1}>{t('bienvenida.titulo')}</h1>
      <p class="lema">{t('app.lema')}</p>

      <section aria-labelledby="idioma">
        <h2 id="idioma">{t('bienvenida.idioma')}</h2>
        <SelectorIdioma />
      </section>

      <section aria-labelledby="curso">
        <h2 id="curso">{t('bienvenida.curso')}</h2>
        <div class="selector-idioma" role="group" aria-labelledby="curso">
          {cursosActivos(catalogo).map((c) => {
            const clave = claveCurso(c);
            return (
              <button key={clave} type="button" aria-pressed={elegidos.includes(clave)} onClick={() => alternar(clave)}>
                {tDinamico(`curso.${c.curso}`)}
              </button>
            );
          })}
        </div>
        <p>{t('bienvenida.curso_ayuda')}</p>
      </section>

      <section aria-label={t('explicacion.titulo')}>
        <Explicacion />
      </section>

      <button type="button" class="boton boton-principal" disabled={elegidos.length === 0} onClick={empezar}>
        {t('bienvenida.empezar')}
      </button>
    </>
  );
}
