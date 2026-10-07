// Los pictogramas se incluyen en línea para que hereden `currentColor`.
const svgs = import.meta.glob<string>('../assets/pictos/*.svg', { query: '?raw', import: 'default', eager: true });

const porNombre = new Map(Object.entries(svgs).map(([ruta, svg]) => [ruta.replace(/^.*\/(.+)\.svg$/, '$1'), svg]));

/** Un pictograma de la lista cerrada. Es solo adorno: el texto del paso ya dice lo que muestra. */
export function Pictograma({ nombre }: { nombre: string }) {
  const svg = porNombre.get(nombre);
  if (!svg) return null;
  return <span class="pictograma" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}
