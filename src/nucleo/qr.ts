// Código QR del enlace de progreso, generado en el propio móvil con `qrcode-generator` (MIT).
import qrcode from 'qrcode-generator';

/**
 * Un SVG con el QR de `texto` (módulos negros sobre fondo blanco, con margen de 4 módulos, como pide el estándar).
 * Lanza un error si el texto no cabe en un QR.
 */
export function qrSvg(texto: string, margen = 4): string {
  const qr = qrcode(0, 'M');
  qr.addData(texto, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  const lado = n + 2 * margen;
  let trazo = '';
  for (let fila = 0; fila < n; fila++) {
    let columna = 0;
    while (columna < n) {
      if (!qr.isDark(fila, columna)) {
        columna++;
        continue;
      }
      const inicio = columna;
      while (columna < n && qr.isDark(fila, columna)) columna++;
      trazo += `M${inicio + margen} ${fila + margen}h${columna - inicio}v1h-${columna - inicio}z`;
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" shape-rendering="crispEdges" focusable="false">` +
    `<rect width="${lado}" height="${lado}" fill="#fff"/><path d="${trazo}" fill="#000"/></svg>`
  );
}
