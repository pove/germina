import { useState } from 'preact/hooks';

/** Un botón que muestra u oculta un trozo (pistas, respuestas…), con `aria-expanded`. */
export function Plegable({
  abierto: abiertoAlInicio = false,
  etiqueta,
  etiquetaAbierto,
  clase = '',
  children,
}: {
  abierto?: boolean;
  etiqueta: string;
  etiquetaAbierto?: string;
  clase?: string;
  children: preact.ComponentChildren;
}) {
  const [abierto, setAbierto] = useState(abiertoAlInicio);
  return (
    <div class="plegable">
      <button type="button" class={`boton ${clase}`.trim()} aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
        {abierto ? (etiquetaAbierto ?? etiqueta) : etiqueta}
      </button>
      {abierto && <div class="plegable-contenido">{children}</div>}
    </div>
  );
}
