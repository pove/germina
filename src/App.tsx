import { signal } from '@preact/signals';
import { t } from './idioma';
import { PruebaIdiomas } from './pantallas/PruebaIdiomas';

const hash = signal(window.location.hash);
window.addEventListener('hashchange', () => (hash.value = window.location.hash));

export function App() {
  // `#/prueba` es la página temporal de la etapa 4; la etapa 5 trae el enrutador real.
  if (hash.value === '#/prueba') return <PruebaIdiomas />;
  return (
    <main>
      <h1>{t('app.nombre')}</h1>
      <p>{t('app.lema')}</p>
    </main>
  );
}
