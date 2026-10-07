import { t } from '../idioma';
import type { Carga } from '../contenido';

/** Mientras carga, si falla (con «Probar otra vez») y, cuando está listo, el contenido. */
export function Cargando<T>({ carga, hijo }: { carga: Carga<T>; hijo: (valor: T) => preact.ComponentChildren }) {
  if (carga.estado === 'cargando') return <p role="status">{t('estado.cargando')}</p>;
  if (carga.estado === 'error') {
    return (
      <div role="alert" class="tarjeta">
        <p>{t('error.cargar')}</p>
        <button type="button" class="boton" onClick={carga.reintentar}>
          {t('boton.reintentar')}
        </button>
      </div>
    );
  }
  return <>{hijo(carga.valor)}</>;
}
