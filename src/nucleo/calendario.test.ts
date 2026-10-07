import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CURSO_POR_DEFECTO, anoDeCurso, diaDeLaSemana, fechaDeDate, hoy, inicioDelCurso, lunesDe, lunesDeSemana, mismaFecha,
  situacion, trimestreDe, type ConfigCurso, type Fecha,
} from './calendario';

const f = (a: number, m: number, d: number): Fecha => ({ a, m, d });

describe('configuración', () => {
  it('coincide con config/curso.json', () => {
    const json = JSON.parse(readFileSync('config/curso.json', 'utf8'));
    expect(CURSO_POR_DEFECTO.diaReferencia).toEqual(json.diaReferencia);
    expect(CURSO_POR_DEFECTO.inicioCurso).toEqual(json.inicioCurso);
    expect(CURSO_POR_DEFECTO.semanas).toBe(json.semanas);
    expect(CURSO_POR_DEFECTO.trimestres).toEqual(json.trimestres);
  });
});

describe('días de la semana', () => {
  it('lunes = 0 … domingo = 6', () => {
    expect(diaDeLaSemana(f(2026, 9, 7))).toBe(0);
    expect(diaDeLaSemana(f(2026, 9, 9))).toBe(2);
    expect(diaDeLaSemana(f(2026, 9, 13))).toBe(6);
  });

  it('el lunes de una fecha, también al cambiar de mes y de año', () => {
    expect(lunesDe(f(2026, 9, 9))).toEqual(f(2026, 9, 7));
    expect(lunesDe(f(2026, 9, 7))).toEqual(f(2026, 9, 7));
    expect(lunesDe(f(2027, 1, 1))).toEqual(f(2026, 12, 28));
    expect(lunesDe(f(2028, 3, 1))).toEqual(f(2028, 2, 28)); // año bisiesto
  });

  it('mismaFecha', () => {
    expect(mismaFecha(f(2026, 9, 7), f(2026, 9, 7))).toBe(true);
    expect(mismaFecha(f(2026, 9, 7), f(2026, 9, 8))).toBe(false);
  });
});

describe('semana 1 y año de curso: límites de septiembre', () => {
  // 2026: el 9 de septiembre es miércoles, así que la semana 1 empieza el lunes 7.
  it('2026: 6, 7, 8 y 9 de septiembre', () => {
    expect(situacion(f(2026, 9, 6))).toEqual({ tipo: 'verano', anoCurso: 2025 });
    expect(situacion(f(2026, 9, 7))).toEqual({ tipo: 'curso', anoCurso: 2026, semana: 1, trimestre: 1 });
    expect(situacion(f(2026, 9, 8))).toEqual({ tipo: 'curso', anoCurso: 2026, semana: 1, trimestre: 1 });
    expect(situacion(f(2026, 9, 9))).toEqual({ tipo: 'curso', anoCurso: 2026, semana: 1, trimestre: 1 });
    expect(situacion(f(2026, 9, 13))).toMatchObject({ semana: 1 });
    expect(situacion(f(2026, 9, 14))).toMatchObject({ semana: 2 });
  });

  it('el inicio del curso es el lunes de la semana del 9', () => {
    expect(inicioDelCurso(2026)).toEqual(f(2026, 9, 7));
    expect(inicioDelCurso(2027)).toEqual(f(2027, 9, 6)); // jueves
    expect(inicioDelCurso(2028)).toEqual(f(2028, 9, 4)); // sábado
    expect(inicioDelCurso(2024)).toEqual(f(2024, 9, 9)); // lunes
  });

  it('cuando el 9 es lunes, ese día empieza la semana 1 y el domingo anterior es verano', () => {
    expect(situacion(f(2024, 9, 8))).toEqual({ tipo: 'verano', anoCurso: 2023 });
    expect(situacion(f(2024, 9, 9))).toMatchObject({ tipo: 'curso', anoCurso: 2024, semana: 1 });
  });

  it('cuando el 9 es sábado, la semana 1 empieza el lunes 4', () => {
    expect(situacion(f(2028, 9, 3))).toMatchObject({ tipo: 'verano', anoCurso: 2027 });
    expect(situacion(f(2028, 9, 4))).toMatchObject({ tipo: 'curso', anoCurso: 2028, semana: 1 });
  });

  it('el año de curso cambia con el lunes de la semana 1, no con el 1 de enero', () => {
    expect(anoDeCurso(f(2026, 12, 31))).toBe(2026);
    expect(anoDeCurso(f(2027, 1, 1))).toBe(2026);
    expect(anoDeCurso(f(2027, 9, 5))).toBe(2026);
    expect(anoDeCurso(f(2027, 9, 6))).toBe(2027);
  });
});

describe('semanas 41 y 42 y el verano', () => {
  it('la semana 41 es la última del curso y la 42 ya es verano', () => {
    expect(situacion(f(2027, 6, 13))).toMatchObject({ tipo: 'curso', semana: 40 });
    expect(situacion(f(2027, 6, 14))).toMatchObject({ tipo: 'curso', semana: 41, trimestre: 3 });
    expect(situacion(f(2027, 6, 20))).toMatchObject({ tipo: 'curso', semana: 41 });
    expect(situacion(f(2027, 6, 21))).toEqual({ tipo: 'verano', anoCurso: 2026 });
  });

  it('todo el verano, hasta el domingo anterior a la nueva semana 1', () => {
    expect(situacion(f(2027, 8, 15))).toEqual({ tipo: 'verano', anoCurso: 2026 });
    expect(situacion(f(2027, 9, 5))).toEqual({ tipo: 'verano', anoCurso: 2026 });
  });

  it('el lunes de cada semana', () => {
    expect(lunesDeSemana(2026, 1)).toEqual(f(2026, 9, 7));
    expect(lunesDeSemana(2026, 41)).toEqual(f(2027, 6, 14));
    expect(lunesDeSemana(2026, 42)).toEqual(f(2027, 6, 21));
  });
});

describe('trimestres', () => {
  it.each([[1, 1], [15, 1], [16, 2], [28, 2], [29, 3], [41, 3]])('semana %i → trimestre %i', (semana, t) => {
    expect(trimestreDe(semana)).toBe(t);
  });
  it('fuera del curso no hay trimestre', () => {
    expect(trimestreDe(0)).toBeNull();
    expect(trimestreDe(42)).toBeNull();
  });
  it('lo dice la situación', () => {
    expect(situacion(f(2026, 12, 21))).toMatchObject({ semana: 16, trimestre: 2 });
  });
});

describe('inicioCurso corrige un año concreto', () => {
  const config: ConfigCurso = { ...CURSO_POR_DEFECTO, inicioCurso: { '2027': '2027-09-13' } };

  it('la semana 1 pasa a ser la que contiene esa fecha', () => {
    expect(inicioDelCurso(2027, config)).toEqual(f(2027, 9, 13));
    expect(situacion(f(2027, 9, 12), config)).toEqual({ tipo: 'verano', anoCurso: 2026 });
    expect(situacion(f(2027, 9, 13), config)).toMatchObject({ tipo: 'curso', anoCurso: 2027, semana: 1 });
  });

  it('no afecta a otros años', () => {
    expect(inicioDelCurso(2026, config)).toEqual(f(2026, 9, 7));
  });

  it('una fecha corregida a mitad de semana vale igual', () => {
    const c: ConfigCurso = { ...CURSO_POR_DEFECTO, inicioCurso: { '2027': '2027-09-08' } };
    expect(inicioDelCurso(2027, c)).toEqual(f(2027, 9, 6));
  });

  it.each(['2027-02-31', 'mañana', '2027-9-8', ''])('ignora una fecha no válida («%s»)', (texto) => {
    const c: ConfigCurso = { ...CURSO_POR_DEFECTO, inicioCurso: { '2027': texto } };
    expect(inicioDelCurso(2027, c)).toEqual(f(2027, 9, 6));
  });
});

describe('hoy', () => {
  it('lunes = pregunta 1 … viernes = pregunta 5', () => {
    expect(hoy(f(2026, 9, 7))).toEqual({ tipo: 'pregunta', n: 1 });
    expect(hoy(f(2026, 9, 8))).toEqual({ tipo: 'pregunta', n: 2 });
    expect(hoy(f(2026, 9, 9))).toEqual({ tipo: 'pregunta', n: 3 });
    expect(hoy(f(2026, 9, 10))).toEqual({ tipo: 'pregunta', n: 4 });
    expect(hoy(f(2026, 9, 11))).toEqual({ tipo: 'pregunta', n: 5 });
  });
  it('sábado y domingo no hay pregunta', () => {
    expect(hoy(f(2026, 9, 12))).toEqual({ tipo: 'finde' });
    expect(hoy(f(2026, 9, 13))).toEqual({ tipo: 'finde' });
  });
});

describe('cambio de horario de verano', () => {
  it('fechaDeDate usa la fecha local, también a las 00:30 y a las 23:30', () => {
    expect(fechaDeDate(new Date(2027, 2, 28, 0, 30))).toEqual(f(2027, 3, 28));
    expect(fechaDeDate(new Date(2027, 2, 28, 23, 30))).toEqual(f(2027, 3, 28));
  });

  it('cada día del año de curso cae en su semana, sea cual sea la hora y el cambio de hora', () => {
    let esperada = 1;
    const dia = new Date(2026, 8, 7, 12);
    while (dia.getFullYear() < 2027 || dia.getMonth() < 6) {
      for (const hora of [0, 0.5, 12, 23.5]) {
        const d = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), Math.floor(hora), (hora % 1) * 60);
        const s = situacion(fechaDeDate(d));
        if (s.tipo === 'curso') expect(s.semana, d.toString()).toBe(esperada);
        else expect(esperada).toBeGreaterThan(41);
      }
      dia.setDate(dia.getDate() + 1);
      if (diaDeLaSemana(fechaDeDate(dia)) === 0) esperada++;
    }
  });
});
