import { describe, expect, it } from 'vitest';
import { rutaSemilla, rutasDeCursos } from './semillas';

describe('rutaSemilla', () => {
  it('semana y verano, con la huella como versión', () => {
    expect(rutaSemilla('2/matematicas/3/s07', 'a1b2c3d4e5')).toBe('contenido/ciclo-2/matematicas/3/semana-07.json?v=a1b2c3d4e5');
    expect(rutaSemilla('1/matematicas/2/v10', 'ff00')).toBe('contenido/ciclo-1/matematicas/2/verano-10.json?v=ff00');
  });

  it('una clave que no es de semilla', () => {
    expect(rutaSemilla('2/matematicas/3', 'x')).toBeNull();
    expect(rutaSemilla('2/matematicas/3/s7', 'x')).toBeNull();
    expect(rutaSemilla('../2/matematicas/3/s07', 'x')).toBeNull();
  });
});

describe('rutasDeCursos', () => {
  const indice = {
    '1/matematicas/1/s01': 'a',
    '1/matematicas/1/v01': 'b',
    '1/matematicas/2/s01': 'c',
    '2/matematicas/3/s07': 'd',
    'basura': 'e',
  };

  it('solo las de los cursos pedidos', () => {
    expect(rutasDeCursos(indice, ['1/matematicas/1'])).toEqual([
      'contenido/ciclo-1/matematicas/1/semana-01.json?v=a',
      'contenido/ciclo-1/matematicas/1/verano-01.json?v=b',
    ]);
    expect(rutasDeCursos(indice, ['2/matematicas/3', '1/matematicas/2'])).toEqual([
      'contenido/ciclo-1/matematicas/2/semana-01.json?v=c',
      'contenido/ciclo-2/matematicas/3/semana-07.json?v=d',
    ]);
  });

  it('«1/matematicas/1» no se confunde con «1/matematicas/10»', () => {
    expect(rutasDeCursos({ '1/matematicas/1/s01': 'a' }, ['1/matematicas/10'])).toEqual([]);
  });

  it('sin cursos, nada', () => {
    expect(rutasDeCursos(indice, [])).toEqual([]);
  });
});
