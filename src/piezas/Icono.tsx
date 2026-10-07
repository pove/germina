// Iconos de la interfaz (semilla, brote, flor…), en línea para que hereden `currentColor`.
const svgs = import.meta.glob<string>('../assets/ui/*.svg', { query: '?raw', import: 'default', eager: true });

const porNombre = new Map(Object.entries(svgs).map(([ruta, svg]) => [ruta.replace(/^.*\/(.+)\.svg$/, '$1'), svg]));

export type NombreIcono = 'semilla' | 'brote' | 'flor' | 'jardin' | 'espera' | 'ayuda';

/** Solo adorno: el texto de al lado dice lo mismo. */
export function Icono({ nombre, clase = '' }: { nombre: NombreIcono; clase?: string }) {
  const svg = porNombre.get(nombre);
  if (!svg) return null;
  return <span class={`icono ${clase}`.trim()} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}
