// Página de prueba de la etapa 4: la semilla de ejemplo en los cinco idiomas. La etapa 5 la sustituye por las pantallas reales.
import { useEffect, useState } from 'preact/hooks';
import { faltanTextos, idioma, t } from '../idioma';
import { elegir, type Texto } from '../nucleo/textos';
import { Marcado } from '../piezas/Marcado';
import { Pictograma } from '../piezas/Pictograma';
import { SelectorIdioma } from '../piezas/SelectorIdioma';

interface SemillaPrueba {
  titulo: Texto;
  objetivo: Texto;
  comoAyudar: Texto;
  reto: {
    titulo: Texto;
    material: Texto[];
    minutos: number;
    pasos: { texto: Texto; pictograma: string }[];
    masFacil: Texto;
    masDificil: Texto;
    aviso?: Texto;
  };
  preguntas: { texto: Texto; pista: Texto; respuesta: { tipo: string; texto?: Texto } }[];
  revision: { traducciones: Record<string, { estado: string }> };
}

const URL_SEMILLA = `${import.meta.env.BASE_URL}contenido/ciclo-2/matematicas/3/semana-07.json`;

export function PruebaIdiomas() {
  const [semilla, setSemilla] = useState<SemillaPrueba | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    fetch(URL_SEMILLA)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((s: SemillaPrueba) => setSemilla(s))
      .catch(() => setFallo(true));
  }, []);

  const id = idioma.value;
  const c = (texto: Texto): string => elegir(texto, id).texto;

  return (
    <main>
      <h1>{t('app.nombre')}</h1>
      <SelectorIdioma />
      {faltanTextos.value && <p role="status">{t('aviso.traduccion_incompleta')}</p>}
      {fallo && <p role="alert">{t('error.cargar')}</p>}
      {!semilla && !fallo && <p>{t('estado.cargando')}</p>}
      {semilla && (
        <article>
          {id !== 'es' && semilla.revision.traducciones[id]?.estado === 'automatica' && <p class="aviso">{t('aviso.traduccion_automatica')}</p>}
          <h2>{t('semana.titulo', { n: 7 })}: <Marcado texto={c(semilla.titulo)} /></h2>
          <h3>{t('semana.objetivo')}</h3>
          <p><Marcado texto={c(semilla.objetivo)} /></p>
          <h3>{t('reto.titulo')}: <Marcado texto={c(semilla.reto.titulo)} /></h3>
          <p>{t('reto.minutos', { n: semilla.reto.minutos })}</p>
          <h4>{t('reto.material')}</h4>
          <ul>
            {semilla.reto.material.map((m, i) => (
              <li key={i}><Marcado texto={c(m)} /></li>
            ))}
          </ul>
          <h4>{t('reto.pasos')}</h4>
          <ol class="pasos">
            {semilla.reto.pasos.map((p, i) => (
              <li key={i}>
                <Pictograma nombre={p.pictograma} />
                <span><Marcado texto={c(p.texto)} /></span>
              </li>
            ))}
          </ol>
          <p><strong>{t('reto.mas_facil')}:</strong> <Marcado texto={c(semilla.reto.masFacil)} /></p>
          <p><strong>{t('reto.mas_dificil')}:</strong> <Marcado texto={c(semilla.reto.masDificil)} /></p>
          {semilla.reto.aviso && <p><strong>{t('reto.aviso')}:</strong> <Marcado texto={c(semilla.reto.aviso)} /></p>}
          <h3>{t('pregunta.titulo', { n: 1 })}</h3>
          <p><Marcado texto={c(semilla.preguntas[0]!.texto)} /></p>
          <p><strong>{t('pregunta.pista')}:</strong> <Marcado texto={c(semilla.preguntas[0]!.pista)} /></p>
        </article>
      )}
    </main>
  );
}
