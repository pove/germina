// Un botón que abre una lista flotante (el curso de la banda, el menú): se cierra al tocar fuera,
// al llevar el foco fuera con el tabulador y con Escape, que devuelve el foco al botón.
import { useEffect, useRef, useState } from 'preact/hooks';

export function useDesplegable() {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

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

  const alPulsarTecla = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape' || !abierto) return;
    setAbierto(false);
    boton.current?.focus();
  };

  return { abierto, setAbierto, caja, boton, alPulsarTecla };
}
