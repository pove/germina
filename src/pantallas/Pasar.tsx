// «Llevar el jardín a otro móvil»: enlace, botón de compartir, QR y código de texto en grupos de 4.
import { useMemo, useRef, useState } from 'preact/hooks';
import { irA } from '../enrutador';
import { anoCursoHoy, datos } from '../estado';
import { t } from '../idioma';
import { agruparCodigo, codigoDeDatos, codigoDeTexto, decodificar, enlaceDe, normalizarCodigo } from '../nucleo/enlace';
import { qrSvg } from '../nucleo/qr';

/** Copia al portapapeles; si el navegador no deja, selecciona el campo para que se copie a mano. */
async function copiar(texto: string, campo: HTMLInputElement | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    campo?.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    }
  }
}

export function Pasar() {
  const d = datos.value;
  const hayAlgo = d.cursos.length > 0 || Object.keys(d.progreso).length > 0;
  const base = new URL(import.meta.env.BASE_URL, window.location.href).href;
  const codigo = useMemo(() => (hayAlgo ? codigoDeDatos(d, anoCursoHoy.value) : ''), [d, hayAlgo]);
  const enlace = hayAlgo ? enlaceDe(codigo, base) : '';
  const grupos = agruparCodigo(codigo);
  const qr = useMemo(() => {
    try {
      return hayAlgo ? qrSvg(enlace) : null;
    } catch {
      return null;
    }
  }, [enlace, hayAlgo]);

  const campoEnlace = useRef<HTMLInputElement>(null);
  const [copiado, setCopiado] = useState<'enlace' | 'codigo' | null>(null);
  const [pegado, setPegado] = useState('');
  const [errorPegado, setErrorPegado] = useState(false);
  const puedeCompartir = typeof navigator.share === 'function';

  const copiarTexto = async (que: 'enlace' | 'codigo'): Promise<void> => {
    setCopiado((await copiar(que === 'enlace' ? enlace : grupos, que === 'enlace' ? campoEnlace.current : null)) ? que : null);
  };

  const compartir = async (): Promise<void> => {
    try {
      await navigator.share({ title: t('app.nombre'), text: t('app.lema'), url: enlace });
    } catch {
      // la persona cerró el menú de compartir: no pasa nada
    }
  };

  const abrirCodigo = (): void => {
    const limpio = normalizarCodigo(codigoDeTexto(pegado));
    if (limpio === '' || !decodificar(limpio).ok) {
      setErrorPegado(true);
      return;
    }
    setErrorPegado(false);
    irA({ tipo: 'recibir', codigo: limpio });
  };

  return (
    <>
      <h1 tabIndex={-1}>{t('pasar.titulo')}</h1>

      {!hayAlgo ? (
        <p>{t('pasar.vacio')}</p>
      ) : (
        <>
          <p>{t('pasar.explicacion')}</p>

          <section aria-labelledby="enlace">
            <h2 id="enlace">{t('pasar.enlace')}</h2>
            <input class="campo-codigo" type="text" readOnly dir="ltr" value={enlace} ref={campoEnlace} aria-labelledby="enlace" onFocus={(e) => (e.target as HTMLInputElement).select()} />
            <div class="acciones">
              <button type="button" class="boton boton-principal" onClick={() => void copiarTexto('enlace')}>
                {t('pasar.copiar_enlace')}
              </button>
              {puedeCompartir && (
                <button type="button" class="boton" onClick={() => void compartir()}>
                  {t('pasar.compartir')}
                </button>
              )}
            </div>
            <div role="status">{copiado && <p class="estado-marcado">✓ {t('pasar.copiado')}</p>}</div>
          </section>

          <section aria-labelledby="qr">
            <h2 id="qr">{t('pasar.qr')}</h2>
            {qr ? (
              <figure class="figura-qr">
                <div class="qr" role="img" aria-label={t('pasar.qr')} dangerouslySetInnerHTML={{ __html: qr }} />
                <figcaption>{t('pasar.qr_ayuda')}</figcaption>
              </figure>
            ) : (
              <p>{t('pasar.error_qr')}</p>
            )}
          </section>

          <section aria-labelledby="texto">
            <h2 id="texto">{t('pasar.texto')}</h2>
            <p>{t('pasar.texto_ayuda')}</p>
            <p class="codigo" dir="ltr" lang="und">
              <code>{grupos}</code>
            </p>
            <button type="button" class="boton" onClick={() => void copiarTexto('codigo')}>
              {t('pasar.copiar_codigo')}
            </button>
          </section>
        </>
      )}

      <section aria-labelledby="recibir">
        <h2 id="recibir">{t('pasar.tengo_codigo')}</h2>
        <form
          class="formulario-record"
          onSubmit={(e) => {
            e.preventDefault();
            abrirCodigo();
          }}
        >
          <label for="pegado">{t('pasar.pegar')}</label>
          <input id="pegado" class="campo-codigo" type="text" dir="ltr" autoComplete="off" autoCapitalize="off" spellcheck={false} value={pegado} onInput={(e) => setPegado((e.target as HTMLInputElement).value)} />
          <button type="submit" class="boton" disabled={pegado.trim() === ''}>
            {t('pasar.continuar')}
          </button>
        </form>
        <div role="alert">{errorPegado && <p>{t('recibir.error')}</p>}</div>
      </section>
    </>
  );
}
