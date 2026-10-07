// Cada test parte de la semilla de ejemplo (3.º, semana 7), rompe una regla y comprueba
// que el validador dice archivo, campo y motivo.
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { huella } from '../lib/huella.mjs';
import { validarContenido } from '../validar-contenido.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const EJEMPLO = JSON.parse(readFileSync(join(RAIZ, 'contenido/ciclo-2/matematicas/3/semana-07.json'), 'utf8'));
const temporales = [];

const clonar = () => structuredClone(EJEMPLO);

/** Monta un contenido mínimo con la semilla dada y la valida. */
function validar(semilla, archivo = 'semana-07.json', { cambiarMapa } = {}) {
  const raiz = mkdtempSync(join(tmpdir(), 'germina-'));
  temporales.push(raiz);
  cpSync(join(RAIZ, 'config'), join(raiz, 'config'), { recursive: true });
  cpSync(join(RAIZ, 'src/assets/pictos'), join(raiz, 'src/assets/pictos'), { recursive: true });
  const dirMapa = join(raiz, 'contenido/ciclo-2/matematicas');
  mkdirSync(join(dirMapa, '3'), { recursive: true });
  const mapa = JSON.parse(readFileSync(join(RAIZ, 'contenido/ciclo-2/matematicas/mapa-semanas.json'), 'utf8'));
  cambiarMapa?.(mapa);
  writeFileSync(join(dirMapa, 'mapa-semanas.json'), JSON.stringify(mapa));
  writeFileSync(join(dirMapa, '3', archivo), typeof semilla === 'string' ? semilla : JSON.stringify(semilla));
  return validarContenido({ raiz });
}

/** Re-calcula las huellas para que un cambio en el español no dispare avisos ajenos al test. */
function conHuellas(semilla) {
  const h = huella(semilla);
  for (const i of ['va', 'en', 'fr', 'ar']) semilla.revision.traducciones[i].huella = h;
  return semilla;
}

const unError = (r, parte) => {
  expect(r.errores.length, JSON.stringify(r.errores, null, 1)).toBeGreaterThan(0);
  const e = r.errores.find((x) => `${x.campo} ${x.motivo}`.includes(parte));
  expect(e, `ningún error contiene «${parte}»: ${JSON.stringify(r.errores, null, 1)}`).toBeDefined();
  expect(e.archivo).toBe('contenido/ciclo-2/matematicas/3/semana-07.json');
  return e;
};

afterAll(() => temporales.forEach((t) => rmSync(t, { recursive: true, force: true })));

describe('la semilla de ejemplo', () => {
  it('pasa sin errores ni avisos', () => {
    const r = validar(clonar());
    expect(r.errores).toEqual([]);
    expect(r.avisos).toEqual([]);
    expect(r.semillas).toBe(1);
  });

  it('pasa también en el repositorio real', () => {
    expect(validarContenido().errores).toEqual([]);
  });
});

describe('regla 1: esquema e identidad', () => {
  it('un campo obligatorio ausente', () => {
    const s = clonar();
    delete s.objetivo;
    const e = unError(validar(s), 'objetivo');
    expect(e.motivo).toMatch(/falta/);
  });

  it('un texto sin uno de los idiomas', () => {
    const s = clonar();
    delete s.titulo.fr;
    unError(validar(s), 'titulo');
  });

  it('una propiedad desconocida', () => {
    const s = clonar();
    s.preguntas[0].extra = 1;
    const e = unError(validar(s), 'extra');
    expect(e.campo).toBe('preguntas[0]');
  });

  it('un JSON roto', () => {
    unError(validar('{ "version": 1,'), 'JSON');
  });

  it('el id no coincide con la ruta', () => {
    const s = clonar();
    s.id = '2.matematicas.3.s08';
    const e = unError(validar(s), 'ruta del archivo');
    expect(e.campo).toBe('id');
  });

  it('la semana no coincide con el nombre del archivo', () => {
    const s = clonar();
    s.semana = 8;
    unError(validar(s), 'el archivo es la semana 7');
  });

  it('un nombre de archivo que no es de semilla', () => {
    const r = validar(clonar(), 'semana-7.json');
    expect(r.errores[0].motivo).toMatch(/semana-NN/);
  });
});

describe('regla 2: currículo', () => {
  it('un saber que no existe', () => {
    const s = clonar();
    s.saberes[0] = 'matematicas.numeros.no-existe';
    const e = unError(validar(s), 'no existe en el currículo');
    expect(e.campo).toBe('saberes[0]');
  });

  it('un saber de otro ciclo', () => {
    const s = clonar();
    s.saberes[0] = 'matematicas.numeros.recuento'; // solo del 1.er ciclo
    unError(validar(s), 'no es del 2.º ciclo');
  });

  it('un criterio de otro ciclo', () => {
    const s = clonar();
    s.criterios[0] = 'matematicas.c1.1.1';
    unError(validar(s), 'criterio');
  });

  it('un tipo de problema desconocido', () => {
    const s = clonar();
    s.preguntas[0].tipoProblema = 'inventado';
    const e = unError(validar(s), 'inventado');
    expect(e.campo).toBe('preguntas[0].tipoProblema');
  });
});

describe('regla 3: coincide con el mapa', () => {
  it('el título en español distinto', () => {
    const s = clonar();
    s.titulo.es = 'Otro título';
    unError(validar(conHuellas(s)), 'título del mapa');
  });

  it('el tipo distinto', () => {
    const s = clonar();
    s.tipo = 'recordar';
    unError(validar(s), 'tipo del mapa');
  });

  it('saberes de más y de menos', () => {
    const s = clonar();
    s.saberes = [s.saberes[0], 'matematicas.numeros.millar'];
    const r = validar(s);
    unError(r, 'faltan los del mapa');
    unError(r, 'sobran respecto al mapa');
  });

  it('criterios distintos', () => {
    const s = clonar();
    s.criterios = ['matematicas.c2.5.1'];
    unError(validar(s), 'faltan los del mapa');
  });

  it('el mapa marca rapidez y la semilla no la tiene', () => {
    const r = validar(clonar(), 'semana-07.json', { cambiarMapa: (m) => { m.cursos['3'][6].rapidez = true; } });
    unError(r, 'juego de rapidez');
  });

  it('la semilla tiene cronómetro y el mapa no', () => {
    const s = clonar();
    s.reto.rapidez = { segundos: 60, seCuenta: { es: 'aciertos', va: 'encerts', en: 'hits', fr: 'réussites', ar: 'إجابات' } };
    unError(validar(s), 'cronómetro');
  });
});

describe('regla 4: operaciones', () => {
  it('una operación que no da su resultado', () => {
    const s = clonar();
    s.preguntas[0].respuesta.resultado = 28;
    const e = unError(validar(s), 'da 27, no 28');
    expect(e.campo).toBe('preguntas[0].respuesta.resultado');
  });

  it('una operación mal escrita', () => {
    const s = clonar();
    s.preguntas[1].respuesta.operacion = '41 - (26';
    unError(validar(s), 'no se puede calcular');
  });

  it('una división no exacta', () => {
    const s = clonar();
    s.preguntas[1].respuesta.operacion = '41 : 2';
    s.preguntas[1].respuesta.resultado = 20;
    unError(validar(s), 'no exacta');
  });

  it('una igualdad de «{{…}}» que no cuadra', () => {
    const s = clonar();
    for (const i of ['es', 'va', 'en', 'fr', 'ar']) {
      s.reto.pasos[3].texto[i] = s.reto.pasos[3].texto[i].replace('42 − 17 = 25', '42 − 17 = 26');
    }
    const e = unError(validar(s), 'no cuadra');
    expect(e.campo).toBe('reto.pasos[3].texto.es');
  });

  it('un «{{…}}» sin cerrar', () => {
    const s = clonar();
    s.reto.masFacil.es = 'Empezad con {{23 − 8.';
    unError(validar(s), 'sin cerrar');
  });

  it('un «}}» de más', () => {
    const s = clonar();
    s.reto.masFacil.es = 'Empezad con 23 − 8}}.';
    unError(validar(s), 'sin su «{{»');
  });
});

describe('regla 5: recupera', () => {
  it('recupera la misma semana', () => {
    const s = clonar();
    s.preguntas[3].recupera = 7;
    const e = unError(validar(s), 'no es una semana anterior');
    expect(e.campo).toBe('preguntas[3].recupera');
  });

  it('recupera 0 fuera de la semana 1', () => {
    const s = clonar();
    s.preguntas[3].recupera = 0;
    unError(validar(s), 'no es una semana anterior');
  });
});

describe('regla 6: palabras de Germina', () => {
  it.each([
    ['es', 'Esto no es un ejercicio.'],
    ['va', 'Això no és una tasca.'],
    ['en', 'This is not homework.'],
    ['fr', 'Ce ne sont pas des devoirs.'],
    ['ar', 'هذا ليس واجب.'],
  ])('en %s', (idioma, frase) => {
    const s = clonar();
    s.objetivo[idioma] = frase;
    const e = unError(validar(s), 'que Germina no usa');
    expect(e.campo).toBe(`objetivo.${idioma}`);
  });

  it('no distingue mayúsculas ni se confunde con palabras que la contienen', () => {
    const s = clonar();
    s.comoAyudar.es = 'EXAMEN.';
    unError(validar(s), 'examen');
    const t = clonar();
    t.comoAyudar.es = 'Probad a notar cómo suena.';
    expect(validar(t).errores.filter((x) => x.motivo.includes('Germina'))).toEqual([]);
  });
});

describe('regla 7: huellas', () => {
  it('una traducción revisada con huella vieja es un aviso, no un error', () => {
    const s = clonar();
    s.revision.traducciones.fr = { estado: 'revisada', huella: '000000000000' };
    const r = validar(s);
    expect(r.errores).toEqual([]);
    const a = r.avisos.find((x) => x.campo === 'revision.traducciones.fr.huella');
    expect(a.motivo).toMatch(/cuenta como automática/);
  });

  it('el español cambia y las traducciones se quedan con la huella vieja', () => {
    const s = clonar();
    s.objetivo.es += ' Más texto.';
    const r = validar(s);
    expect(r.errores).toEqual([]);
    expect(r.avisos).toHaveLength(4);
  });

  it('una fecha de revisión docente que no es fecha', () => {
    const s = clonar();
    s.revision.docente.fecha = '31/12/2026';
    unError(validar(s), 'AAAA-MM-DD');
  });
});

describe('regla 8: idiomas y marcado', () => {
  it('un texto vacío en un idioma', () => {
    const s = clonar();
    s.reto.titulo.en = '';
    unError(validar(s), 'reto.titulo.en');
  });

  it('operaciones distintas entre idiomas', () => {
    const s = clonar();
    s.reto.masFacil.fr = s.reto.masFacil.fr.replace('23 − 8', '23 − 9');
    const e = unError(validar(s), 'no son idénticas');
    expect(e.campo).toBe('reto.masFacil.fr');
  });

  it('una operación que falta en un idioma', () => {
    const s = clonar();
    s.reto.masFacil.ar = 'ابدؤوا بعمليات طرح سهلة.';
    unError(validar(s), 'no son idénticas');
  });
});

describe('regla 9: pictogramas', () => {
  it('un pictograma sin su SVG', () => {
    const s = clonar();
    s.reto.pasos[0].pictograma = 'brujula'; // está en el esquema, pero aún no hay SVG
    const e = unError(validar(s), 'falta el SVG');
    expect(e.campo).toBe('reto.pasos[0].pictograma');
  });

  it('un pictograma fuera de la lista cerrada', () => {
    const s = clonar();
    s.reto.pasos[0].pictograma = 'dragon';
    unError(validar(s), 'pictograma');
  });
});
