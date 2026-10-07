import { signal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import catalogoJson from '../../config/catalogo.json';
import { hash } from '../enrutador';
import { datos, hayAlmacen } from '../estado';
import { idioma, t, tDinamico } from '../idioma';
import { esCursoActivo, nombreDeArea, type Catalogo } from '../nucleo/catalogo';
import { construir, type Ruta } from '../nucleo/rutas';
import { leerClaveCurso, type Curso } from '../nucleo/tipos';

const catalogo = catalogoJson as Catalogo;
const avisoGuardadoVisto = signal(false);

export const rotuloCurso = (c: Curso): string => tDinamico(`curso.${c.curso}`);

/** «2.º ciclo · Matemáticas · 3.º» */
export const contexto = (c: Curso): string => `${tDinamico(`ciclo.${c.ciclo}`)} · ${nombreDeArea(c.area, idioma.value, catalogo)} · ${rotuloCurso(c)}`;

/** El curso de la ruta si es uno activo; si no, el curso activo guardado; si no, ninguno. */
export function cursoParaMenu(ruta: Ruta): Curso | null {
  if ('ciclo' in ruta && esCursoActivo(ruta, catalogo)) return { ciclo: ruta.ciclo, area: ruta.area, curso: ruta.curso };
  const guardado = leerClaveCurso(datos.value.cursoActivo ?? datos.value.cursos[0]);
  return guardado && esCursoActivo(guardado, catalogo) ? guardado : null;
}

interface Props {
  ruta: Ruta;
  children: preact.ComponentChildren;
  /** Sin menú (bienvenida y cambio de curso). */
  sinMenu?: boolean;
}

export function Layout({ ruta, children, sinMenu = false }: Props) {
  const principal = useRef<HTMLElement>(null);
  const hashAnterior = useRef<string | null>(null);
  const curso = cursoParaMenu(ruta);

  // Al cambiar de pantalla: el foco va al título (también cuando aparece tras cargar) y se actualiza el título de la pestaña.
  useEffect(() => {
    const main = principal.current;
    if (!main) return;
    let pendiente = hashAnterior.current !== null && hashAnterior.current !== hash.value;
    hashAnterior.current = hash.value;
    const revisar = (): void => {
      const h1 = main.querySelector('h1');
      if (!h1) return;
      document.title = `${h1.textContent ?? ''} · ${t('app.nombre')}`;
      if (pendiente) {
        pendiente = false;
        h1.focus();
      }
    };
    revisar();
    const observador = new MutationObserver(revisar);
    observador.observe(main, { childList: true, subtree: true, characterData: true });
    return () => observador.disconnect();
  }, [hash.value, idioma.value]);

  const enlaces: { ruta: Ruta | null; texto: string; activo: boolean }[] = [
    { ruta: { tipo: 'inicio' }, texto: t('nav.inicio'), activo: ['semana', 'pregunta', 'reto', 'verano', 'veranoReto'].includes(ruta.tipo) },
    { ruta: curso && { tipo: 'jardin', ...curso }, texto: t('nav.jardin'), activo: ruta.tipo === 'jardin' },
    { ruta: curso && { tipo: 'aprenden', ...curso }, texto: t('nav.aprenden'), activo: ruta.tipo === 'aprenden' },
    { ruta: { tipo: 'ayuda' }, texto: t('nav.ayuda'), activo: ruta.tipo === 'ayuda' },
    { ruta: { tipo: 'ajustes' }, texto: t('nav.ajustes'), activo: ['ajustes', 'pasar', 'recibir', 'imprimirRecords', 'privacidad', 'accesibilidad'].includes(ruta.tipo) },
  ];

  return (
    <>
      <button type="button" class="saltar" onClick={() => principal.current?.focus()}>
        {t('a11y.contenido')}
      </button>
      <header class="cabecera">
        <p class="marca">{t('app.nombre')}</p>
        {!sinMenu && (
          <nav aria-label={t('a11y.menu')}>
            <ul>
              {enlaces.map((e) =>
                e.ruta ? (
                  <li key={e.texto}>
                    <a href={construir(e.ruta)} aria-current={e.activo ? 'page' : undefined}>
                      {e.texto}
                    </a>
                  </li>
                ) : null,
              )}
            </ul>
          </nav>
        )}
      </header>
      {!hayAlmacen && !avisoGuardadoVisto.value && (
        <div role="status" class="aviso-global">
          <p>{t('aviso.guardado')}</p>
          <button type="button" class="boton" onClick={() => (avisoGuardadoVisto.value = true)}>
            {t('boton.cerrar')}
          </button>
        </div>
      )}
      <main id="contenido" tabIndex={-1} ref={principal}>
        {children}
      </main>
    </>
  );
}
