// Páginas legales: privacidad y accesibilidad (especificación, 9). Solo texto, en el idioma elegido.
import { t, type ClaveTexto } from '../idioma';

interface Seccion {
  titulo: ClaveTexto;
  /** Párrafos. */
  parrafos?: ClaveTexto[];
  /** Elementos de una lista. */
  lista?: ClaveTexto[];
}

function Pagina({ titulo, entrada, secciones }: { titulo: ClaveTexto; entrada: ClaveTexto; secciones: Seccion[] }) {
  return (
    <>
      <h1 tabIndex={-1}>{t(titulo)}</h1>
      <p class="texto-pregunta">{t(entrada)}</p>
      {secciones.map((s) => (
        <section key={s.titulo} aria-labelledby={s.titulo}>
          <h2 id={s.titulo}>{t(s.titulo)}</h2>
          {s.parrafos?.map((p) => (
            <p key={p}>{t(p)}</p>
          ))}
          {s.lista && (
            <ul>
              {s.lista.map((p) => (
                <li key={p}>{t(p)}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}

export function Privacidad() {
  return (
    <Pagina
      titulo="privacidad.titulo"
      entrada="privacidad.resumen"
      secciones={[
        { titulo: 'privacidad.sin_titulo', lista: ['privacidad.sin_1', 'privacidad.sin_2', 'privacidad.sin_3'] },
        { titulo: 'privacidad.guardado_titulo', parrafos: ['privacidad.guardado'] },
        { titulo: 'privacidad.borrar_titulo', parrafos: ['privacidad.borrar'] },
        { titulo: 'privacidad.alojamiento_titulo', parrafos: ['privacidad.alojamiento'] },
      ]}
    />
  );
}

export function Accesibilidad() {
  return (
    <Pagina
      titulo="accesibilidad.titulo"
      entrada="accesibilidad.objetivo"
      secciones={[
        {
          titulo: 'accesibilidad.cuidado_titulo',
          lista: ['accesibilidad.cuidado_1', 'accesibilidad.cuidado_2', 'accesibilidad.cuidado_3', 'accesibilidad.cuidado_4', 'accesibilidad.cuidado_5', 'accesibilidad.cuidado_6'],
        },
        { titulo: 'accesibilidad.limites_titulo', lista: ['accesibilidad.limites_1', 'accesibilidad.limites_2'] },
        { titulo: 'accesibilidad.avisar_titulo', parrafos: ['accesibilidad.avisar'] },
      ]}
    />
  );
}
