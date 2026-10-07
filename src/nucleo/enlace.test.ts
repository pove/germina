import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { datosVacios } from './almacen';
import {
  CODIGOS_AREA, agruparCodigo, base32Codificar, base32Decodificar, codificar, codigoDeDatos, codigoDeTexto, crc16, decodificar,
  decodificarBytes, enlaceDe, normalizarCodigo,
} from './enlace';
import type { Datos } from './tipos';

const ejemplo: Datos = {
  v: 1,
  idioma: 'es',
  cursos: ['2/matematicas/3', '2/matematicas/4'],
  cursoActivo: '2/matematicas/3',
  ultimoAnoCurso: 2026,
  progreso: {
    '2026/2/matematicas/3': {
      s01: { hecho: ['reto'] },
      s07: { hecho: ['reto', 'p1', 'p2'], record: 14 },
      s41: { hecho: ['p5'] },
      v03: { hecho: ['reto'], record: 9 },
      v10: { hecho: ['p1', 'p2', 'p3', 'p4', 'p5', 'reto'] },
    },
    '2025/2/matematicas/3': { s02: { hecho: ['p3'] } },
  },
};

const conCrc = (bytes: number[]): Uint8Array => {
  const crc = crc16(Uint8Array.from(bytes));
  return Uint8Array.from([...bytes, crc >> 8, crc & 255]);
};

describe('CRC-16/CCITT-FALSE', () => {
  it('valor de comprobación estándar', () => {
    expect(crc16(new TextEncoder().encode('123456789'))).toBe(0x29b1);
  });
  it('vacío = valor inicial', () => {
    expect(crc16(new Uint8Array())).toBe(0xffff);
  });
});

describe('Base32 de Crockford', () => {
  it('vectores conocidos', () => {
    const t = (s: string): Uint8Array => new TextEncoder().encode(s);
    expect(base32Codificar(t('f'))).toBe('CR');
    expect(base32Codificar(t('fo'))).toBe('CSQG');
    expect(base32Codificar(t('foo'))).toBe('CSQPY');
    expect(base32Codificar(t('foobar'))).toBe('CSQPYRK1E8');
    expect(base32Codificar(new Uint8Array())).toBe('');
  });

  it('ida y vuelta con todos los largos y valores', () => {
    for (let largo = 0; largo < 40; largo++) {
      const bytes = Uint8Array.from({ length: largo }, (_, i) => (i * 37 + largo * 11) & 255);
      expect(base32Decodificar(base32Codificar(bytes))).toEqual(bytes);
    }
    const todos = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect(base32Decodificar(base32Codificar(todos))).toEqual(todos);
  });

  it('lee sin distinguir mayúsculas, espacios ni guiones', () => {
    const bytes = new TextEncoder().encode('foobar');
    expect(base32Decodificar('csqp-yrk1 e8')).toEqual(bytes);
  });

  it('lee O como 0 e I y L como 1', () => {
    const bytes = new TextEncoder().encode('foobar');
    expect(base32Decodificar('CSQPYRKIE8')).toEqual(bytes); // 1 → I
    expect(base32Decodificar('CSQPYRKlE8')).toEqual(bytes); // 1 → l minúscula
    expect(base32Decodificar('CSQPYRK1E8')).toEqual(bytes);
    expect(base32Decodificar('0O')).toEqual(base32Decodificar('00'));
    expect(normalizarCodigo('o0iIlL1')).toBe('0011111');
  });

  it('rechaza lo que no es Crockford (U, ñ, símbolos) y el relleno que no es cero', () => {
    expect(base32Decodificar('CSQPU')).toBeNull();
    expect(base32Decodificar('CSQPÑ')).toBeNull();
    expect(base32Decodificar('CSQ+Y')).toBeNull();
    expect(base32Decodificar('CS')).toBeNull(); // relleno ≠ 0
    expect(base32Decodificar('CR0')).toBeNull(); // un carácter entero de relleno
  });
});

describe('agrupar y enlazar', () => {
  it('grupos de 4', () => {
    expect(agruparCodigo('ABCDEFGHJ')).toBe('ABCD-EFGH-J');
    expect(agruparCodigo('abcd')).toBe('ABCD');
    expect(agruparCodigo('')).toBe('');
  });
  it('el enlace va detrás de la almohadilla', () => {
    expect(enlaceDe('ab-cd')).toBe('https://pove.github.io/germina/#/recibir/AB0CD'.replace('AB0CD', 'ABCD'));
    expect(enlaceDe('ABCD', 'http://localhost/')).toBe('http://localhost/#/recibir/ABCD');
  });
  it('saca el código de un enlace o de un texto pegado', () => {
    expect(codigoDeTexto('Mira: https://pove.github.io/germina/#/recibir/ABCD1234 gracias')).toBe('ABCD1234');
    expect(codigoDeTexto('https://pove.github.io/germina/#/recibir/ABCD1234?x=1')).toBe('ABCD1234');
    expect(codigoDeTexto('https://pove.github.io/germina/#/recibir/')).toBe('');
    expect(codigoDeTexto('ABCD-1234')).toBe('ABCD-1234');
  });
});

describe('formato binario (6.3)', () => {
  it('cabecera, bloque y CRC a mano', () => {
    const datos: Datos = {
      ...datosVacios(),
      progreso: { '2026/2/matematicas/3': { s01: { hecho: ['reto'] }, s09: { hecho: ['p1', 'p5'], record: 7 }, v10: { hecho: ['p3'] } } },
    };
    const esperado = conCrc([
      1, 1, // versión, bloques
      26, 2, 1, 3, // año − 2000, ciclo, área, curso
      0b10000000, 0b10000000, 0, 0, 0, 0, // semanas 1 y 9
      0b100000, 0b010001, // s01: reto; s09: p1 y p5
      0, 0b01000000, // veranos: el 10
      0b000100, // v10: p3
      1, 9, 7, // un récord: semana 9, valor 7
    ]);
    expect(codificar(datos)).toEqual(esperado);
    expect(esperado).toHaveLength(22);
  });

  it('sin nada: versión, cero bloques y CRC', () => {
    expect([...codificar(datosVacios())].slice(0, 2)).toEqual([1, 0]);
    expect(codificar(datosVacios())).toHaveLength(4);
  });

  it('ida y vuelta', () => {
    const r = decodificar(codigoDeDatos(ejemplo));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.recibido.cursos).toEqual(['2/matematicas/3', '2/matematicas/4']);
    expect(r.recibido.progreso['2026/2/matematicas/3']).toEqual({
      s01: { hecho: ['reto'] },
      s07: { hecho: ['reto', 'p1', 'p2'], record: 14 },
      s41: { hecho: ['p5'] },
      v03: { hecho: ['reto'], record: 9 },
      v10: { hecho: ['reto', 'p1', 'p2', 'p3', 'p4', 'p5'] },
    });
    expect(r.recibido.progreso['2025/2/matematicas/3']).toEqual({ s02: { hecho: ['p3'] } });
    // El curso sin nada marcado viaja como bloque vacío del último año de curso.
    expect(r.recibido.progreso['2026/2/matematicas/4']).toBeUndefined();
  });

  it('el código se puede escribir en grupos y en minúsculas', () => {
    const codigo = codigoDeDatos(ejemplo);
    expect(decodificar(agruparCodigo(codigo).toLowerCase())).toEqual(decodificar(codigo));
  });

  it('un récord sin casillas marcadas viaja igual', () => {
    const d: Datos = { ...datosVacios(), progreso: { '2026/2/matematicas/3': { s05: { hecho: [], record: 0 }, v02: { hecho: [], record: 255 } } } };
    const r = decodificar(codigoDeDatos(d));
    expect(r.ok && r.recibido.progreso['2026/2/matematicas/3']).toEqual({ s05: { hecho: [], record: 0 }, v02: { hecho: [], record: 255 } });
  });

  it('varios cursos y áreas, en orden estable', () => {
    const d: Datos = {
      ...datosVacios(),
      progreso: {
        '2026/2/matematicas/4': { s01: { hecho: ['reto'] } },
        '2026/2/lectura/3': { s01: { hecho: ['p1'] } },
        '2026/1/matematicas/2': { s01: { hecho: ['p2'] } },
        '2025/2/matematicas/3': { s01: { hecho: ['p3'] } },
      },
    };
    const bytes = codificar(d);
    expect(bytes[1]).toBe(4);
    expect(codigoDeDatos(d)).toBe(codigoDeDatos({ ...d, progreso: Object.fromEntries(Object.entries(d.progreso).reverse()) }));
    const r = decodificar(codigoDeDatos(d));
    expect(r.ok && Object.keys(r.recibido.progreso)).toHaveLength(4);
    expect(r.ok && r.recibido.cursos).toEqual(['2/matematicas/3', '1/matematicas/2', '2/matematicas/4', '2/lectura/3']);
  });

  it('todos los cursos viajan, aunque no tengan nada marcado', () => {
    const d: Datos = { ...datosVacios(), cursos: ['2/matematicas/3', '2/matematicas/4'], cursoActivo: '2/matematicas/3', ultimoAnoCurso: 2026 };
    const r = decodificar(codigoDeDatos(d));
    expect(r.ok && r.recibido.cursos).toEqual(['2/matematicas/3', '2/matematicas/4']);
    expect(r.ok && r.recibido.progreso).toEqual({});
  });

  it('sin último año de curso se usa el que pasa quien llama; sin ninguno no se puede', () => {
    const d: Datos = { ...datosVacios(), cursos: ['2/matematicas/3'], ultimoAnoCurso: null };
    const con = decodificar(codigoDeDatos(d, 2026));
    expect(con.ok && con.recibido.cursos).toEqual(['2/matematicas/3']);
    expect(codificar(d, 2026)[2]).toBe(26);
    const sin = decodificar(codigoDeDatos(d));
    expect(sin.ok && sin.recibido.cursos).toEqual([]);
    const raro = decodificar(codigoDeDatos(d, 1999));
    expect(raro.ok && raro.recibido.cursos).toEqual([]);
  });

  it('un curso con progreso no se repite como bloque vacío', () => {
    const d: Datos = { ...ejemplo, cursos: ['2/matematicas/3'] };
    expect(codificar(d)[1]).toBe(2); // 2025 y 2026, ninguno más
  });

  it('los cursos de un área sin código y las claves raras no se codifican', () => {
    const d: Datos = {
      ...datosVacios(),
      cursos: ['2/robotica/3', '2/matematicas/3', 'x'],
      ultimoAnoCurso: 2026,
      progreso: { '2026/2/robotica/3': { s01: { hecho: ['reto'] } }, basura: { s01: { hecho: ['reto'] } }, '2026/2/matematicas/3': { s99: { hecho: ['reto'] } } },
    };
    const r = decodificar(codigoDeDatos(d));
    expect(r.ok && r.recibido.cursos).toEqual(['2/matematicas/3']);
  });

  it('demasiados bloques', () => {
    const progreso: Datos['progreso'] = {};
    for (let ano = 2000; ano < 2256; ano++) progreso[`${ano}/2/matematicas/3`] = { s01: { hecho: ['reto'] } };
    expect(() => codificar({ ...datosVacios(), progreso })).toThrow(RangeError);
  });

  it('los códigos de área son los de config/catalogo.json', () => {
    const catalogo = JSON.parse(readFileSync('config/catalogo.json', 'utf8')) as { areas: { id: string; codigo: number }[] };
    expect(CODIGOS_AREA).toEqual(Object.fromEntries(catalogo.areas.map((a) => [a.id, a.codigo])));
  });

  it('cabe en un tamaño razonable con todo marcado', () => {
    const semillas: Datos['progreso'][string] = {};
    for (let n = 1; n <= 41; n++) semillas[`s${String(n).padStart(2, '0')}`] = { hecho: ['reto', 'p1', 'p2', 'p3', 'p4', 'p5'], record: n };
    const bytes = codificar({ ...datosVacios(), progreso: { '2026/2/matematicas/3': semillas } });
    expect(bytes.length).toBeLessThan(200);
  });
});

describe('códigos dañados', () => {
  const bueno = codigoDeDatos(ejemplo);

  it('vacío', () => {
    expect(decodificar('')).toEqual({ ok: false, motivo: 'vacio' });
    expect(decodificar(' - ')).toEqual({ ok: false, motivo: 'vacio' });
  });

  it('caracteres que no son del alfabeto', () => {
    expect(decodificar('hola, esto no es un código')).toEqual({ ok: false, motivo: 'caracteres' });
    expect(decodificar(`${bueno}U`)).toEqual({ ok: false, motivo: 'caracteres' });
  });

  it('demasiado corto', () => {
    expect(decodificar('00')).toEqual({ ok: false, motivo: 'formato' });
    expect(decodificarBytes(Uint8Array.from([1, 0, 0]))).toEqual({ ok: false, motivo: 'formato' });
  });

  it('un carácter cambiado a mano: el CRC lo detecta', () => {
    for (let i = 0; i < bueno.length; i++) {
      const otro = bueno[i] === 'A' ? 'B' : 'A';
      const dañado = bueno.slice(0, i) + otro + bueno.slice(i + 1);
      const r = decodificar(dañado);
      expect(r.ok, `posición ${i}`).toBe(false);
    }
  });

  it('un carácter que falta o sobra', () => {
    expect(decodificar(bueno.slice(1)).ok).toBe(false);
    expect(decodificar(bueno.slice(0, -1)).ok).toBe(false);
    expect(decodificar(`${bueno}0`).ok).toBe(false);
  });

  it('dos caracteres intercambiados', () => {
    const [x = '', y = ''] = bueno;
    const dañado = x !== y ? y + x + bueno.slice(2) : bueno;
    expect(decodificar(dañado).ok).toBe(dañado === bueno);
  });

  it('versión desconocida, aunque el CRC sea correcto', () => {
    expect(decodificarBytes(conCrc([2, 0]))).toEqual({ ok: false, motivo: 'version' });
    expect(decodificarBytes(conCrc([0, 0]))).toEqual({ ok: false, motivo: 'version' });
    const bytes = codificar(ejemplo);
    const futuro = conCrc([2, ...bytes.subarray(1, bytes.length - 2)]);
    expect(decodificarBytes(futuro)).toEqual({ ok: false, motivo: 'version' });
  });

  it('CRC incorrecto', () => {
    const bytes = codificar(ejemplo).slice();
    bytes[bytes.length - 1]! ^= 1;
    expect(decodificarBytes(bytes)).toEqual({ ok: false, motivo: 'crc' });
  });

  it.each<[string, number[]]>([
    ['faltan bloques', [1, 1]],
    ['ciclo 0', [1, 1, 26, 0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['ciclo 4', [1, 1, 26, 4, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['curso 0', [1, 1, 26, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['curso 7', [1, 1, 26, 2, 1, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['área desconocida', [1, 1, 26, 2, 99, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['relleno de semanas distinto de cero', [1, 1, 26, 2, 1, 3, 0, 0, 0, 0, 0, 0b01000000, 0, 0, 0, 0]],
    ['relleno de veranos distinto de cero', [1, 1, 26, 2, 1, 3, 0, 0, 0, 0, 0, 0, 0, 1, 0]],
    ['semana marcada sin casillas', [1, 1, 26, 2, 1, 3, 0x80, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['casillas de más de 6 bits', [1, 1, 26, 2, 1, 3, 0x80, 0, 0, 0, 0, 0, 64, 0, 0, 0]],
    ['récord en la semana 0', [1, 1, 26, 2, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5]],
    ['récord en la semana 42', [1, 1, 26, 2, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1, 42, 5]],
    ['récord en el verano 0', [1, 1, 26, 2, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1, 100, 5]],
    ['récord en el verano 11', [1, 1, 26, 2, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1, 111, 5]],
    ['bytes de más', [1, 0, 7]],
    ['récords que no caben', [1, 1, 26, 2, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 5]],
    ['mismo curso y año repetido', [1, 2, 26, 2, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 2, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  ])('%s: formato', (_nombre, bytes) => {
    expect(decodificarBytes(conCrc(bytes))).toEqual({ ok: false, motivo: 'formato' });
  });

  it('el mismo curso en dos años distintos sí vale', () => {
    const bytes = conCrc([1, 2, 25, 2, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 2, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(decodificarBytes(bytes)).toMatchObject({ ok: true, recibido: { cursos: ['2/matematicas/3'] } });
  });
});
