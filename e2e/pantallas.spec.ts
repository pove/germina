import { expect, test, type Page } from '@playwright/test';
import {
  CURSO_3, CURSO_4, LUNES_SEMANA_1_2027, SABADO_SEMANA_7, T, guardado, objetivosTactiles, preparar,
  sinProblemasDeAccesibilidad,
} from './ayudas';

const IDIOMAS = ['es', 'ar'] as const;
const SEMANA_7 = './#/2/matematicas/3/semana/7';

for (const idioma of IDIOMAS) {
  test.describe(`en ${idioma}`, () => {
    test.use({ locale: idioma === 'ar' ? 'ar' : 'es-ES' });

    test('bienvenida → semana actual', async ({ page }) => {
      await preparar(page);
      await page.goto('./');
      await expect(page).toHaveURL(/#\/bienvenida$/);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('bienvenida.titulo', idioma));
      await expect(page.locator('html')).toHaveAttribute('dir', idioma === 'ar' ? 'rtl' : 'ltr');
      await sinProblemasDeAccesibilidad(page);

      const empezar = page.getByRole('button', { name: T('bienvenida.empezar', idioma), exact: true });
      await expect(empezar).toBeDisabled(); // hay que elegir un curso
      await page.getByRole('button', { name: T('curso.3', idioma), exact: true }).click();
      await empezar.click();

      await expect(page).toHaveURL(/#\/2\/matematicas\/3\/semana\/7$/);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(idioma === 'ar' ? 'لا يكفي؟ نفتح عشرة' : 'Cuando no llega: abrir una decena');
      const guardados = await guardado(page);
      expect(guardados).toMatchObject({ v: 1, cursos: [CURSO_3], cursoActivo: CURSO_3, ultimoAnoCurso: 2026 });
    });

    test('marcar una pregunta y el reto y verlos en el jardín', async ({ page }) => {
      await preparar(page, { almacen: { idioma } });
      await page.goto('./');
      await expect(page).toHaveURL(/semana\/7$/);

      // La pregunta de hoy (miércoles = pregunta 3).
      await page.getByRole('link', { name: T('semana.ver_pregunta', idioma) }).click();
      await expect(page).toHaveURL(/semana\/7\/pregunta\/3$/);
      const hablado = page.getByRole('button', { name: T('pregunta.hablado', idioma), exact: true });
      await expect(hablado).toHaveAttribute('aria-pressed', 'false');
      await hablado.click();
      await expect(hablado).toHaveAttribute('aria-pressed', 'true');

      // El reto.
      await page.goto(SEMANA_7);
      await page.getByRole('link', { name: T('semana.ver_reto', idioma) }).click();
      await expect(page).toHaveURL(/semana\/7\/reto$/);
      const jugado = page.getByRole('button', { name: T('reto.jugado', idioma), exact: true });
      await jugado.click();
      await expect(jugado).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByText(T('aviso.instalar', idioma))).toBeVisible(); // el primer reto invita a instalar

      // El jardín: la semana 7 está en flor y las demás son semillas.
      await page.getByRole('navigation').getByRole('link', { name: T('nav.jardin', idioma) }).click();
      await expect(page).toHaveURL(/jardin$/);
      await expect(page.getByRole('link', { name: `${T('semana.titulo', idioma, { n: 7 })}: ${T('jardin.estado.flor', idioma)}` })).toBeVisible();
      await expect(page.getByRole('link', { name: `${T('semana.titulo', idioma, { n: 8 })}: ${T('jardin.estado.semilla', idioma)}` })).toBeVisible();
      await expect(page.getByRole('img', { name: `${T('semana.titulo', idioma, { n: 9 })}: ${T('jardin.estado.en_camino', idioma)}` })).toBeVisible();
      await expect(page.locator('.planta')).toHaveCount(41 + 10);

      // Y queda guardado, también tras recargar.
      await page.reload();
      await expect(page.getByRole('link', { name: `${T('semana.titulo', idioma, { n: 7 })}: ${T('jardin.estado.flor', idioma)}` })).toBeVisible();
      expect(await guardado(page)).toMatchObject({ progreso: { [`2026/${CURSO_3}`]: { s07: { hecho: ['reto', 'p3'] } } } });
    });

    test('un reto con solo una pregunta hablada es un brote', async ({ page }) => {
      await preparar(page, { almacen: { idioma, progreso: { [`2026/${CURSO_3}`]: { s07: { hecho: ['p1'] } } } } });
      await page.goto('./#/2/matematicas/3/jardin');
      await expect(page.getByRole('link', { name: `${T('semana.titulo', idioma, { n: 7 })}: ${T('jardin.estado.brote', idioma)}` })).toBeVisible();
    });

    test('ir a otra semana y volver; las semillas que no existen están «en camino»', async ({ page }) => {
      await preparar(page, { almacen: { idioma } });
      await page.goto(SEMANA_7);
      await expect(page.getByRole('link', { name: T('semana.volver_actual', idioma) })).toHaveCount(0);

      await page.getByRole('link', { name: T('semana.siguiente', idioma) }).click();
      await expect(page).toHaveURL(/semana\/8$/);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(idioma === 'ar' ? 'الباقي' : 'La vuelta');
      await expect(page.getByText(T('semana.en_camino', idioma))).toHaveCount(0);

      await page.getByRole('link', { name: T('semana.siguiente', idioma) }).click();
      await expect(page).toHaveURL(/semana\/9$/);
      await expect(page.getByText(T('semana.en_camino', idioma))).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('De cabeza: de 10 en 10 y de 100 en 100'); // el título del mapa, en español
      // Mientras tanto, lleva a la semilla publicada más cercana.
      await expect(page.getByText(T('semana.mientras_tanto', idioma))).toBeVisible();
      await expect(page.getByRole('link', { name: T('semana.ir_a', idioma, { n: 8 }) })).toHaveAttribute('href', /semana\/8$/);
      await sinProblemasDeAccesibilidad(page);

      await page.getByRole('link', { name: T('semana.anterior', idioma) }).click();
      await page.getByRole('link', { name: T('semana.anterior', idioma) }).click();
      await page.getByRole('link', { name: T('semana.anterior', idioma) }).click();
      await expect(page).toHaveURL(/semana\/6$/);
      await page.getByRole('link', { name: T('semana.volver_actual', idioma) }).click();
      await expect(page).toHaveURL(/semana\/7$/);
    });

    test('fin de semana: no hay pregunta del día y se destaca el reto', async ({ page }) => {
      await preparar(page, { fecha: SABADO_SEMANA_7, almacen: { idioma } });
      await page.goto('./');
      await expect(page).toHaveURL(/semana\/7$/);
      await expect(page.getByText(T('semana.fin_de_semana', idioma))).toBeVisible();
      await expect(page.getByRole('heading', { name: T('semana.pregunta_hoy', idioma) })).toHaveCount(0);
      await expect(page.getByRole('link', { name: T('semana.ver_reto', idioma) })).toHaveClass(/boton-principal/);
    });

    test('la pregunta: pista, respuesta e «invéntala tú»', async ({ page }) => {
      await preparar(page, { almacen: { idioma } });
      await page.goto('./#/2/matematicas/3/semana/7/pregunta/1');
      await expect(page.getByText(idioma === 'ar' ? 'عندنا 32 بسكويتة' : 'Tenemos 32 galletas')).toBeVisible();
      const pista = page.getByRole('button', { name: T('pregunta.pista', idioma), exact: true });
      await expect(pista).toHaveAttribute('aria-expanded', 'false');
      await pista.click();
      await expect(page.getByRole('button', { name: T('pregunta.ocultar_pista', idioma) })).toHaveAttribute('aria-expanded', 'true');
      await page.getByRole('button', { name: T('pregunta.ver_respuesta', idioma) }).click();
      await expect(page.getByText(idioma === 'ar' ? 'بقيت 27 بسكويتة.' : 'Quedan 27 galletas.')).toBeVisible();
      await page.getByRole('button', { name: T('pregunta.inventala', idioma) }).click();
      await expect(page.getByText(idioma === 'ar' ? 'لنخترع مسألة عن البسكويت' : 'Ahora inventa tú una de galletas')).toBeVisible();
      await sinProblemasDeAccesibilidad(page);
      await objetivosTactiles(page);

      // Anterior y siguiente.
      await expect(page.getByRole('link', { name: T('pregunta.anterior', idioma) })).toHaveCount(0);
      await page.getByRole('link', { name: T('pregunta.siguiente', idioma) }).click();
      await expect(page).toHaveURL(/pregunta\/2$/);
      // Al cambiar de pregunta, la pista vuelve a estar oculta.
      await expect(page.getByRole('button', { name: T('pregunta.pista', idioma), exact: true })).toHaveAttribute('aria-expanded', 'false');
    });

    test('la pregunta 5 («explícamelo») es abierta y no tiene «invéntala tú»', async ({ page }) => {
      await preparar(page, { almacen: { idioma } });
      await page.goto('./#/2/matematicas/3/semana/7/pregunta/5');
      await page.getByRole('button', { name: T('pregunta.ver_respuesta', idioma) }).click();
      await expect(page.getByText(T('pregunta.orientacion', idioma))).toBeVisible();
      await expect(page.getByRole('button', { name: T('pregunta.inventala', idioma) })).toHaveCount(0);
      await expect(page.getByRole('link', { name: T('pregunta.siguiente', idioma) })).toHaveCount(0);
    });

    test('el reto: material, pasos con pictograma y operaciones', async ({ page }) => {
      await preparar(page, { almacen: { idioma } });
      await page.goto('./#/2/matematicas/3/semana/7/reto');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(idioma === 'ar' ? 'أكواب العشرة' : 'Vasos de diez');
      await expect(page.locator('.pasos li')).toHaveCount(4);
      await expect(page.locator('.pasos .pictograma svg')).toHaveCount(4);
      await expect(page.locator('bdi[dir="ltr"]', { hasText: '42 − 17 = 25' })).toHaveCount(1);
      await expect(page.getByRole('heading', { name: T('reto.aviso', idioma) })).toBeVisible();
      await sinProblemasDeAccesibilidad(page);
      await objetivosTactiles(page);
    });

    test('jardín, qué aprenden, cómo ayudar y ajustes', async ({ page }) => {
      await preparar(page, { almacen: { idioma } });
      await page.goto('./#/2/matematicas/3/jardin');
      await page.getByRole('button', { name: new RegExp(T('jardin.ayuda', idioma)) }).click();
      await expect(page.getByText(T('explicacion.1', idioma))).toBeVisible();
      await sinProblemasDeAccesibilidad(page);
      await objetivosTactiles(page);

      await page.getByRole('navigation').getByRole('link', { name: T('nav.aprenden', idioma) }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('aprenden.titulo', idioma));
      await expect(page.getByRole('heading', { level: 2 })).toHaveCount(3);
      await expect(page.locator('main li').first()).toBeVisible();
      await sinProblemasDeAccesibilidad(page);
      await objetivosTactiles(page);

      await page.getByRole('navigation').getByRole('link', { name: T('nav.ayuda', idioma) }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('ayuda.titulo', idioma));
      await expect(page.locator('.ideas li')).toHaveCount(7);
      await sinProblemasDeAccesibilidad(page);

      await page.getByRole('navigation').getByRole('link', { name: T('nav.ajustes', idioma) }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('ajustes.titulo', idioma));
      await sinProblemasDeAccesibilidad(page);
      await objetivosTactiles(page);
    });

    test('la semana: axe y objetivos táctiles', async ({ page }) => {
      await preparar(page, { almacen: { idioma } });
      await page.goto(SEMANA_7);
      await expect(page.getByRole('heading', { name: T('semana.pregunta_hoy', idioma) })).toBeVisible();
      await sinProblemasDeAccesibilidad(page);
      await objetivosTactiles(page);
    });

    test('empezar de cero borra lo marcado y lleva a la bienvenida', async ({ page }) => {
      await preparar(page, { almacen: { idioma, progreso: { [`2026/${CURSO_3}`]: { s07: { hecho: ['reto'] } } } } });
      await page.goto('./#/ajustes');
      await page.getByRole('button', { name: T('ajustes.empezar_de_cero', idioma), exact: true }).click();
      await expect(page.getByText(T('ajustes.empezar_de_cero_aviso', idioma))).toBeVisible();
      await page.getByRole('button', { name: T('boton.cancelar', idioma) }).click();
      expect(await guardado(page)).toMatchObject({ progreso: { [`2026/${CURSO_3}`]: { s07: { hecho: ['reto'] } } } });
      await page.getByRole('button', { name: T('ajustes.empezar_de_cero', idioma), exact: true }).click();
      await page.getByRole('button', { name: T('ajustes.empezar_de_cero_si', idioma) }).click();
      await expect(page).toHaveURL(/bienvenida$/);
      expect(await guardado(page)).toMatchObject({ cursos: [], progreso: {} });
    });
  });
}

test('el jardín marca la semana de hoy aunque su semilla esté en camino', async ({ page }) => {
  await preparar(page, { fecha: '2026-11-04T10:00:00', almacen: { idioma: 'es' } }); // miércoles de la semana 9
  await page.goto('./#/2/matematicas/3/jardin');
  const hoy = page.getByRole('img', { name: `${T('semana.titulo', 'es', { n: 9 })}: ${T('jardin.estado.en_camino', 'es')}` });
  await expect(hoy).toHaveAttribute('aria-current', 'date');
  await expect(page.locator('[aria-current="date"]')).toHaveCount(1);
});

test('el nombre de la cabecera lleva a «Esta semana»', async ({ page }) => {
  await preparar(page, { almacen: { idioma: 'es' } });
  await page.goto('./#/ajustes');
  await page.getByRole('banner').getByRole('link', { name: T('app.nombre', 'es') }).click();
  await expect(page).toHaveURL(/semana\/7$/);
});

test('sin ningún reto de verano publicado, «en camino» no ofrece ir a otro', async ({ page }) => {
  await preparar(page, { almacen: { idioma: 'es' } });
  await page.goto('./#/2/matematicas/3/verano/1');
  await expect(page.getByText(T('semana.en_camino', 'es'))).toBeVisible();
  await expect(page.getByText(T('semana.mientras_tanto', 'es'))).toHaveCount(0);
});

test.describe('cursos y cambio de curso', () => {
  test('con dos cursos, un toque cambia de uno a otro', async ({ page }) => {
    await preparar(page, { almacen: { idioma: 'es', cursos: [CURSO_3, CURSO_4] } });
    await page.goto(SEMANA_7);
    await page.getByRole('link', { name: T('semana.cambiar_curso', 'es', { curso: '4.º' }) }).click();
    await expect(page).toHaveURL(/\/2\/matematicas\/4\/semana\/7$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Restas con ceros');
    await page.getByRole('link', { name: T('semana.cambiar_curso', 'es', { curso: '3.º' }) }).click();
    await expect(page).toHaveURL(/\/2\/matematicas\/3\/semana\/7$/);
  });

  test('con un solo curso no sale el cambio', async ({ page }) => {
    await preparar(page, { almacen: { idioma: 'es' } });
    await page.goto(SEMANA_7);
    await expect(page.getByRole('link', { name: /Cambiar a/ })).toHaveCount(0);
  });

  test('septiembre: ¿ha pasado a 4.º? Sí → el curso pasa a 4.º y se conserva lo del año anterior', async ({ page }) => {
    const progreso = { [`2026/${CURSO_3}`]: { s07: { hecho: ['reto'] } } };
    await preparar(page, { fecha: LUNES_SEMANA_1_2027, almacen: { idioma: 'es', progreso } });
    await page.goto('./');
    await expect(page.getByRole('heading', { name: T('cambio_curso.pregunta', 'es', { curso: '4.º' }) })).toBeVisible();
    await sinProblemasDeAccesibilidad(page);
    await page.getByRole('button', { name: T('cambio_curso.si', 'es', { curso: '4.º' }) }).click();
    await page.getByRole('button', { name: T('cambio_curso.seguir', 'es') }).click();
    await expect(page).toHaveURL(/\/2\/matematicas\/4\/semana\/1$/);
    expect(await guardado(page)).toMatchObject({ cursos: [CURSO_4], cursoActivo: CURSO_4, ultimoAnoCurso: 2027, progreso });
    // No vuelve a preguntar.
    await page.reload();
    await expect(page).toHaveURL(/semana\/1$/);
    await expect(page.getByRole('heading', { name: /¿Vuestro hijo o hija/ })).toHaveCount(0);
  });

  test('septiembre: No → sigue en 3.º', async ({ page }) => {
    await preparar(page, { fecha: LUNES_SEMANA_1_2027, almacen: { idioma: 'es' } });
    await page.goto('./');
    await page.getByRole('button', { name: T('cambio_curso.no', 'es') }).click();
    await page.getByRole('button', { name: T('cambio_curso.seguir', 'es') }).click();
    await expect(page).toHaveURL(/\/2\/matematicas\/3\/semana\/1$/);
  });

  test('septiembre: terminar 4.º cierra el ciclo y ofrece los retos de verano', async ({ page }) => {
    await preparar(page, { fecha: LUNES_SEMANA_1_2027, almacen: { idioma: 'es', cursos: [CURSO_4], cursoActivo: CURSO_4 } });
    await page.goto('./');
    await expect(page.getByText(T('cambio_curso.fin_ciclo', 'es'))).toBeVisible();
    await page.getByRole('link', { name: T('cambio_curso.ver_verano', 'es') }).click();
    await expect(page).toHaveURL(/\/2\/matematicas\/4\/verano\/1$/);
    await expect(page.getByText(T('semana.en_camino', 'es'))).toBeVisible();
    expect(await guardado(page)).toMatchObject({ cursos: [], cursoActivo: null, ultimoAnoCurso: 2027 });
  });

  test('en verano, el inicio abre el primer reto de verano', async ({ page }) => {
    await preparar(page, { fecha: '2027-07-15T10:00:00', almacen: { idioma: 'es' } });
    await page.goto('./');
    await expect(page).toHaveURL(/\/2\/matematicas\/3\/verano\/1$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tablas de verano');
    await sinProblemasDeAccesibilidad(page);
  });
});

test.describe('rutas', () => {
  test('una ruta desconocida o un curso que no existe llevan a la semana actual', async ({ page }) => {
    await preparar(page, { almacen: { idioma: 'es' } });
    for (const destino of ['./#/nada/de/nada', './#/2/matematicas/3/semana/99', './#/1/matematicas/1/semana/1', './#/2/lectura/3/jardin']) {
      await page.goto(destino);
      await expect(page).toHaveURL(/#\/2\/matematicas\/3\/semana\/7$/);
    }
  });

  test('sin curso elegido, cualquier cosa lleva a la bienvenida', async ({ page }) => {
    await preparar(page);
    await page.goto('./#/nada');
    await expect(page).toHaveURL(/#\/bienvenida$/);
  });
});

test.describe('cronómetro y récord', () => {
  async function conRapidez(page: Page): Promise<void> {
    await page.route('**/contenido/ciclo-2/matematicas/3/semana-07.json', async (ruta) => {
      const respuesta = await ruta.fetch();
      const semilla = await respuesta.json();
      semilla.reto.rapidez = { segundos: 60, seCuenta: { es: 'aciertos', va: 'encerts', en: 'hits', fr: 'réussites', ar: 'إجابات' } };
      await ruta.fulfill({ response: respuesta, json: semilla });
    });
  }

  test('cuenta atrás, aviso con texto al terminar y récord personal', async ({ page }) => {
    await preparar(page, { almacen: { idioma: 'es' } });
    await conRapidez(page);
    await page.goto('./#/2/matematicas/3/semana/7/reto');
    await expect(page.getByRole('timer')).toHaveAccessibleName(T('cronometro.tiempo', 'es', { tiempo: '1:00' }));
    await sinProblemasDeAccesibilidad(page);

    await page.getByRole('button', { name: T('cronometro.empezar', 'es') }).click();
    await page.clock.fastForward(30_000);
    await expect(page.getByRole('timer')).toHaveAccessibleName(T('cronometro.tiempo', 'es', { tiempo: '0:30' }));
    await expect(page.getByText(T('cronometro.fin', 'es'))).toHaveCount(0);
    await page.clock.fastForward(31_000);
    await expect(page.getByRole('status').filter({ hasText: T('cronometro.fin', 'es') })).toBeVisible();
    await expect(page.getByRole('timer')).toHaveAccessibleName(T('cronometro.tiempo', 'es', { tiempo: '0:00' }));

    // Récord: se guarda el mejor.
    await expect(page.getByText(T('record.sin', 'es'))).toBeVisible();
    await page.getByLabel(T('record.apuntar', 'es')).fill('12');
    await page.getByRole('button', { name: T('record.guardar', 'es') }).click();
    await expect(page.getByText(T('record.nuevo', 'es'))).toBeVisible();
    await expect(page.getByText(T('record.mejor', 'es', { n: 12 }))).toBeVisible();
    await page.getByLabel(T('record.apuntar', 'es')).fill('8');
    await page.getByRole('button', { name: T('record.guardar', 'es') }).click();
    await expect(page.getByText(T('record.hoy', 'es', { n: 8 }))).toBeVisible();
    await expect(page.getByText(T('record.nuevo', 'es'))).toHaveCount(0);
    await expect(page.getByText(T('record.mejor', 'es', { n: 12 }))).toBeVisible();
    expect(await guardado(page)).toMatchObject({ progreso: { [`2026/${CURSO_3}`]: { s07: { record: 12 } } } });

    // Volver a empezar.
    await page.getByRole('button', { name: T('cronometro.reiniciar', 'es') }).click();
    await expect(page.getByRole('timer')).toHaveAccessibleName(T('cronometro.tiempo', 'es', { tiempo: '1:00' }));
  });

  test('un resultado que no es un número no se puede guardar', async ({ page }) => {
    await preparar(page, { almacen: { idioma: 'es' } });
    await conRapidez(page);
    await page.goto('./#/2/matematicas/3/semana/7/reto');
    const guardar = page.getByRole('button', { name: T('record.guardar', 'es') });
    await expect(guardar).toBeDisabled();
    await page.getByLabel(T('record.apuntar', 'es')).fill('abc');
    await expect(guardar).toBeDisabled();
    await page.getByLabel(T('record.apuntar', 'es')).fill('300');
    await expect(guardar).toBeDisabled();
    await page.getByLabel(T('record.apuntar', 'es')).fill('0');
    await expect(guardar).toBeEnabled();
  });
});

test.describe('sin dónde guardar', () => {
  test('la web funciona y avisa una vez', async ({ page }) => {
    await preparar(page);
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get: () => { throw new DOMException('bloqueado', 'SecurityError'); } });
    });
    await page.goto(SEMANA_7);
    await page.getByRole('link', { name: T('semana.ver_reto', 'es') }).click();
    await expect(page.getByText(T('aviso.guardado', 'es'))).toBeVisible();
    await page.getByRole('button', { name: T('reto.jugado', 'es'), exact: true }).click(); // se puede marcar en esta sesión
    await expect(page.getByRole('button', { name: T('reto.jugado', 'es'), exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: T('boton.cerrar', 'es') }).click();
    await expect(page.getByText(T('aviso.guardado', 'es'))).toHaveCount(0);
  });
});

test.describe('ajustes', () => {
  test('cambiar de idioma lo aplica y lo recuerda; siempre queda un curso', async ({ page }) => {
    await preparar(page, { almacen: { idioma: 'es' } });
    await page.goto('./#/ajustes');
    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('ajustes.titulo', 'en'));
    expect(await guardado(page)).toMatchObject({ idioma: 'en' });

    const tercero = page.getByRole('group', { name: T('ajustes.cursos', 'en') }).getByRole('button', { name: T('curso.3', 'en') });
    await tercero.click(); // es el único: no se puede quitar
    await expect(tercero).toHaveAttribute('aria-pressed', 'true');
    const cuarto = page.getByRole('group', { name: T('ajustes.cursos', 'en') }).getByRole('button', { name: T('curso.4', 'en') });
    await cuarto.click();
    expect(await guardado(page)).toMatchObject({ cursos: [CURSO_3, CURSO_4] });
    await tercero.click();
    expect(await guardado(page)).toMatchObject({ cursos: [CURSO_4], cursoActivo: CURSO_4 });
  });
});

test('ninguna petición sale del sitio recorriendo las pantallas', async ({ page, baseURL }) => {
  const origen = new URL(baseURL!).origin;
  const urls: string[] = [];
  page.on('request', (r) => urls.push(r.url()));
  await preparar(page, { almacen: { idioma: 'ar' } });
  for (const destino of [SEMANA_7, './#/2/matematicas/3/semana/7/pregunta/1', './#/2/matematicas/3/semana/7/reto', './#/2/matematicas/3/jardin', './#/2/matematicas/3/aprenden', './#/ayuda', './#/ajustes']) {
    await page.goto(destino);
    await expect(page.locator('main h1')).toBeVisible();
  }
  await page.waitForLoadState('networkidle');
  expect(urls.filter((u) => !u.startsWith(origen) && !u.startsWith('data:') && !u.startsWith('blob:'))).toEqual([]);
  expect(urls.some((u) => u.includes('noto-sans-arabic'))).toBe(true);
});
