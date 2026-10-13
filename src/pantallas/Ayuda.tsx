// «Cómo ayudar»: pocas ideas, siempre las mismas; después, por qué Germina y sus fuentes.
import { cargarComoAyudar, useCarga } from '../contenido';
import { t } from '../idioma';
import { Cargando } from '../piezas/Carga';
import { Contenido } from '../piezas/Contenido';
import { Fuentes } from '../piezas/Fuentes';

export function Ayuda() {
  const carga = useCarga(cargarComoAyudar, []);
  return (
    <>
      <h1 tabIndex={-1}>{t('ayuda.titulo')}</h1>
      <Cargando
        carga={carga}
        hijo={({ ideas, porque, fuentes }) => (
          <>
            <section aria-labelledby="ideas">
              <h2 id="ideas">{t('ayuda.ideas_titulo')}</h2>
              <ul class="ideas">
                {ideas.map((idea, i) => (
                  <li key={i} class="tarjeta idea">
                    <Contenido texto={idea} />
                  </li>
                ))}
              </ul>
            </section>
            <section class="tarjeta" aria-labelledby="porque">
              <h2 id="porque">{t('ayuda.porque_titulo')}</h2>
              {porque.map((parrafo, i) => (
                <p key={i}>
                  <Contenido texto={parrafo} />
                </p>
              ))}
            </section>
            <Fuentes fuentes={fuentes} />
          </>
        )}
      />
    </>
  );
}
