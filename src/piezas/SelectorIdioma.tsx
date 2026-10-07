import { IDIOMAS_CONFIG, elegirIdioma, idioma, t } from '../idioma';

/** Los cinco idiomas, cada uno escrito en su propia lengua. */
export function SelectorIdioma() {
  return (
    <div role="group" aria-label={t('ajustes.idioma')} class="selector-idioma">
      {IDIOMAS_CONFIG.map((c) => (
        <button key={c.id} type="button" lang={c.lang} dir={c.dir} aria-pressed={idioma.value === c.id} onClick={() => elegirIdioma(c.id)}>
          {c.nombre}
        </button>
      ))}
    </div>
  );
}
