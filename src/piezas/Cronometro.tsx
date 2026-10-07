import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../idioma';
import { formatearTiempo } from '../nucleo/numeros';

type Estado = 'parado' | 'en-marcha' | 'fin';

/**
 * Cronómetro de cuenta atrás para los juegos de rapidez. El final se anuncia con texto (región `aria-live`),
 * no solo con vibración. El móvil solo mide el tiempo: el juego se hace sin pantalla.
 */
export function Cronometro({ segundos }: { segundos: number }) {
  const [estado, setEstado] = useState<Estado>('parado');
  const [restante, setRestante] = useState(segundos);
  const inicio = useRef(0);

  useEffect(() => {
    setEstado('parado');
    setRestante(segundos);
  }, [segundos]);

  useEffect(() => {
    if (estado !== 'en-marcha') return;
    const id = setInterval(() => {
      const quedan = segundos - (performance.now() - inicio.current) / 1000;
      if (quedan <= 0) {
        clearInterval(id);
        setRestante(0);
        setEstado('fin');
        try {
          navigator.vibrate?.(300);
        } catch {
          // sin vibración: el texto ya lo dice
        }
      } else {
        setRestante(quedan);
      }
    }, 200);
    return () => clearInterval(id);
  }, [estado, segundos]);

  const empezar = (): void => {
    inicio.current = performance.now();
    setRestante(segundos);
    setEstado('en-marcha');
  };
  const reiniciar = (): void => {
    setEstado('parado');
    setRestante(segundos);
  };

  return (
    <section class="tarjeta cronometro" aria-labelledby="titulo-cronometro">
      <h3 id="titulo-cronometro">{t('cronometro.titulo')}</h3>
      <p class="reloj" role="timer" aria-live="off" aria-label={t('cronometro.tiempo', { tiempo: formatearTiempo(Math.ceil(restante)) })}>
        <span aria-hidden="true" dir="ltr">
          {formatearTiempo(Math.ceil(restante))}
        </span>
      </p>
      <div role="status" class="fin-cronometro">
        {estado === 'fin' && t('cronometro.fin')}
      </div>
      {estado === 'parado' && (
        <button type="button" class="boton" onClick={empezar}>
          {t('cronometro.empezar')}
        </button>
      )}
      {estado === 'en-marcha' && (
        <button type="button" class="boton" onClick={reiniciar}>
          {t('cronometro.parar')}
        </button>
      )}
      {estado === 'fin' && (
        <button type="button" class="boton" onClick={reiniciar}>
          {t('cronometro.reiniciar')}
        </button>
      )}
    </section>
  );
}
