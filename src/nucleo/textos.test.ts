import { describe, expect, it } from 'vitest';
import { detectarIdioma } from './idiomas';
import { formatearNumero, formatearTiempo } from './numeros';
import { elegir, faltaAlguno, interpolar } from './textos';

describe('elegir', () => {
  const texto = { es: 'Hola', va: 'Hola!', en: 'Hello', fr: 'Salut', ar: 'مرحبا' };

  it('el idioma pedido', () => {
    expect(elegir(texto, 'en')).toEqual({ texto: 'Hello', deEspanol: false });
    expect(elegir(texto, 'es')).toEqual({ texto: 'Hola', deEspanol: false });
  });

  it('si falta o está vacío, vuelve al español y lo dice', () => {
    expect(elegir({ es: 'Hola' }, 'ar')).toEqual({ texto: 'Hola', deEspanol: true });
    expect(elegir({ es: 'Hola', ar: '' }, 'ar')).toEqual({ texto: 'Hola', deEspanol: true });
  });

  it('si falta hasta el español, texto vacío', () => {
    expect(elegir({}, 'es')).toEqual({ texto: '', deEspanol: false });
    expect(elegir({}, 'fr')).toEqual({ texto: '', deEspanol: true });
  });
});

describe('faltaAlguno', () => {
  it('detecta un texto sin traducir', () => {
    expect(faltaAlguno([{ es: 'a', fr: 'b' }, { es: 'c' }], 'fr')).toBe(true);
    expect(faltaAlguno([{ es: 'a', fr: 'b' }], 'fr')).toBe(false);
    expect(faltaAlguno([], 'fr')).toBe(false);
  });
});

describe('interpolar', () => {
  it('rellena los huecos', () => {
    expect(interpolar('Semana {n} de {total}', { n: 7, total: '41' })).toBe('Semana 7 de 41');
    expect(interpolar('{n}{n}', { n: 1 })).toBe('11');
  });
  it('un hueco sin valor se queda como está', () => {
    expect(interpolar('Semana {n}', {})).toBe('Semana {n}');
    expect(interpolar('Semana {n}')).toBe('Semana {n}');
  });
  it('no toca las operaciones {{…}}', () => {
    expect(interpolar('{{3 × 4}} y {n}', { n: 2 })).toBe('{{3 × 4}} y 2');
  });
});

describe('detectarIdioma', () => {
  it.each([
    [['es-ES'], 'es'],
    [['es'], 'es'],
    [['ca'], 'va'],
    [['ca-ES-valencia'], 'va'],
    [['ca_ES'], 'va'],
    [['va'], 'va'],
    [['en-GB', 'es'], 'en'],
    [['fr-CA'], 'fr'],
    [['AR-EG'], 'ar'],
    [['de-DE', 'fr'], 'fr'],
  ])('%j → %s', (lenguas, esperado) => {
    expect(detectarIdioma(lenguas)).toBe(esperado);
  });

  it('si no hay ninguno de los cinco, null', () => {
    expect(detectarIdioma(['de', 'zh-CN'])).toBeNull();
    expect(detectarIdioma([])).toBeNull();
    expect(detectarIdioma([''])).toBeNull();
  });
});

describe('números como en el cuaderno', () => {
  it('cifras 0–9 y coma decimal', () => {
    expect(formatearNumero(7)).toBe('7');
    expect(formatearNumero(1.25)).toBe('1,25');
    expect(formatearNumero(1234567)).toBe('1234567');
    expect(formatearNumero(0.1 + 0.2)).toBe('0,30000000000000004');
  });

  it('no cambia con el idioma del sistema, ni siquiera con el árabe', () => {
    const arabe = new Intl.NumberFormat('ar-EG').format(25);
    expect(arabe).not.toBe('25'); // con las cifras del árabe habría salido otra cosa
    expect(formatearNumero(25)).toBe('25');
  });

  it('el tiempo como en el reloj', () => {
    expect(formatearTiempo(65)).toBe('1:05');
    expect(formatearTiempo(60)).toBe('1:00');
    expect(formatearTiempo(9.9)).toBe('0:09');
    expect(formatearTiempo(-3)).toBe('0:00');
  });
});
