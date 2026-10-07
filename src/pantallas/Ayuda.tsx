// «Cómo ayudar»: pocas ideas, siempre las mismas.
import { cargarComoAyudar, useCarga } from '../contenido';
import { t } from '../idioma';
import { Cargando } from '../piezas/Carga';
import { Contenido } from '../piezas/Contenido';

export function Ayuda() {
  const carga = useCarga(cargarComoAyudar, []);
  return (
    <>
      <h1 tabIndex={-1}>{t('ayuda.titulo')}</h1>
      <Cargando
        carga={carga}
        hijo={(ideas) => (
          <ul class="ideas">
            {ideas.map((idea, i) => (
              <li key={i} class="tarjeta">
                <Contenido texto={idea} />
              </li>
            ))}
          </ul>
        )}
      />
    </>
  );
}
