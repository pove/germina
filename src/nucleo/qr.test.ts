import { describe, expect, it } from 'vitest';
import { datosVacios } from './almacen';
import { codigoDeDatos, enlaceDe } from './enlace';
import { qrSvg } from './qr';
import type { Datos } from './tipos';

describe('qrSvg', () => {
  it('es un SVG autónomo, sin referencias externas', () => {
    const svg = qrSvg('https://pove.github.io/germina/#/recibir/ABCD');
    expect(svg.startsWith('<svg ')).toBe(true);
    expect(svg).toContain('viewBox="0 0 ');
    expect(svg).toContain('<path d="M');
    expect(svg.replace('http://www.w3.org/2000/svg', '')).not.toContain('http');
  });

  it('es determinista y cambia con el texto', () => {
    expect(qrSvg('hola')).toBe(qrSvg('hola'));
    expect(qrSvg('hola')).not.toBe(qrSvg('adiós'));
  });

  it('el margen es de 4 módulos a cada lado', () => {
    const [, lado0] = /viewBox="0 0 (\d+) /.exec(qrSvg('hola', 0))!;
    const [, lado4] = /viewBox="0 0 (\d+) /.exec(qrSvg('hola', 4))!;
    expect(Number(lado4) - Number(lado0)).toBe(8);
  });

  it('un enlace de progreso con todo marcado en dos cursos cabe', () => {
    const semillas: Datos['progreso'][string] = {};
    for (let n = 1; n <= 41; n++) semillas[`s${String(n).padStart(2, '0')}`] = { hecho: ['reto', 'p1', 'p2', 'p3', 'p4', 'p5'], record: n };
    for (let n = 1; n <= 10; n++) semillas[`v${String(n).padStart(2, '0')}`] = { hecho: ['reto', 'p1'], record: n };
    const datos: Datos = { ...datosVacios(), progreso: { '2026/2/matematicas/3': semillas, '2026/2/matematicas/4': semillas, '2025/2/matematicas/3': semillas } };
    const enlace = enlaceDe(codigoDeDatos(datos));
    expect(() => qrSvg(enlace)).not.toThrow();
  });

  it('un texto demasiado largo no cabe y lanza un error', () => {
    expect(() => qrSvg('x'.repeat(4000))).toThrow();
  });
});
