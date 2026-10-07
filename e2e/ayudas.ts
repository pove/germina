// Ayudas comunes de los tests de extremo a extremo: fecha, almacenamiento inicial y textos de la interfaz.
import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type Idioma = 'es' | 'va' | 'en' | 'fr' | 'ar';
const textos = JSON.parse(readFileSync('contenido/comun/textos-interfaz.json', 'utf8')) as Record<string, Record<Idioma, string>>;

/** El texto de la interfaz en un idioma, con sus huecos rellenos. */
export function T(clave: string, idioma: Idioma, valores: Record<string, string | number> = {}): string {
  const texto = textos[clave]?.[idioma];
  if (texto === undefined) throw new Error(`Falta el texto «${clave}» en ${idioma}`);
  return texto.replace(/\{([a-z_]+)\}/g, (c, n: string) => (n in valores ? String(valores[n]) : c));
}

export const CURSO_3 = '2/matematicas/3';
export const CURSO_4 = '2/matematicas/4';

/** Miércoles de la semana 7 de 2026 (pregunta 3). */
export const MIERCOLES_SEMANA_7 = '2026-10-21T10:00:00';
export const SABADO_SEMANA_7 = '2026-10-24T10:00:00';
/** Lunes de la semana 1 de 2027. */
export const LUNES_SEMANA_1_2027 = '2027-09-06T10:00:00';

export interface Almacen {
  idioma?: Idioma | null;
  cursos?: string[];
  cursoActivo?: string | null;
  ultimoAnoCurso?: number | null;
  progreso?: Record<string, Record<string, { hecho: string[]; record?: number }>>;
}

/**
 * Fija la fecha de hoy (el tiempo sigue corriendo y se puede adelantar con `page.clock`) y, si se pide,
 * deja guardado un estado inicial antes de abrir la web. Solo la primera carga de la pestaña.
 */
export async function preparar(page: Page, opciones: { fecha?: string; almacen?: Almacen | null; sinReloj?: boolean } = {}): Promise<void> {
  if (!opciones.sinReloj) await page.clock.install({ time: new Date(opciones.fecha ?? MIERCOLES_SEMANA_7) });
  const { almacen } = opciones;
  if (almacen) {
    const datos = { v: 1, idioma: null, cursos: [CURSO_3], cursoActivo: CURSO_3, ultimoAnoCurso: 2026, progreso: {}, ...almacen };
    await page.addInitScript((texto) => {
      if (sessionStorage.getItem('sembrado')) return;
      sessionStorage.setItem('sembrado', '1');
      localStorage.setItem('germina', texto);
    }, JSON.stringify(datos));
  }
}

export async function guardado(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('germina') ?? '{}'));
}

/** axe sin infracciones serias ni críticas, y sin desbordamiento horizontal a 375 px. */
export async function sinProblemasDeAccesibilidad(page: Page): Promise<void> {
  await expect(page.locator('main h1')).toBeVisible();
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const graves = resultado.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves, JSON.stringify(graves.map((v) => ({ id: v.id, nodos: v.nodes.map((n) => n.html) })), null, 1)).toEqual([]);
  const desborda = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(desborda, 'hay desplazamiento horizontal').toBe(false);
}

/** Todo lo que se puede pulsar mide 44 px o más. */
export async function objetivosTactiles(page: Page): Promise<void> {
  const pequenos = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('a[href], button, input, summary')]
      .filter((e) => e.offsetParent !== null && !e.classList.contains('saltar') && !(e.tagName === 'A' && e.closest('p')))
      .map((e) => ({ texto: (e.textContent ?? e.getAttribute('aria-label') ?? '').trim().slice(0, 30), r: e.getBoundingClientRect() }))
      .filter((x) => x.r.width > 0 && (x.r.height < 43.5 || x.r.width < 43.5))
      .map((x) => `${x.texto} (${Math.round(x.r.width)}×${Math.round(x.r.height)})`),
  );
  expect(pequenos, 'objetivos táctiles de menos de 44 px').toEqual([]);
}
