// Contraste de colores según WCAG 2.1 (1.4.3 y 1.4.11), para comprobar la paleta de src/estilos.css.

/** Luminancia relativa de un color `#rrggbb`. */
export function luminancia(hex) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`Color no válido: ${hex}`);
  const [r, g, b] = m.slice(1).map((x) => {
    const v = parseInt(x, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Relación de contraste entre dos colores, de 1 a 21. */
export function contraste(a, b) {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Los colores `--nombre: #rrggbb` del primer bloque `:root` de una hoja de estilos. */
export function coloresDeRaiz(css) {
  const raiz = /:root\s*\{([^}]*)\}/.exec(css);
  if (!raiz) return {};
  return Object.fromEntries([...raiz[1].matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map(([, nombre, valor]) => [nombre, valor.toLowerCase()]));
}
