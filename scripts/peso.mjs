// Comprueba el presupuesto de peso de `dist/` (especificación, 7). Uso: node scripts/peso.mjs  (sale con código 1 si se pasa)
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { informe, medir } from './lib/peso.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

try {
  const resultado = medir({ dist: join(raiz, 'dist'), base: '/germina/' });
  console.log(informe(resultado));
  if (!resultado.correcto) {
    console.error('\nLa web pesa más de lo permitido.');
    process.exit(1);
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
