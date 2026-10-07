import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { traduccionAutomatica, type SemillaContenido } from './contenido';

const ejemplo = JSON.parse(readFileSync('contenido/ciclo-2/matematicas/3/semana-07.json', 'utf8')) as SemillaContenido;
const revisada = (huella: string): SemillaContenido => ({
  ...ejemplo,
  revision: { ...ejemplo.revision, traducciones: { ...ejemplo.revision.traducciones, fr: { estado: 'revisada', huella } } },
});

describe('traduccionAutomatica', () => {
  it('en español nunca', () => {
    expect(traduccionAutomatica(ejemplo, 'es', 'x')).toBe(false);
  });

  it('una traducción sin revisar es automática', () => {
    for (const i of ['va', 'en', 'fr', 'ar'] as const) expect(traduccionAutomatica(ejemplo, i, ejemplo.revision.traducciones[i].huella)).toBe(true);
  });

  it('una traducción revisada con la huella al día ya no avisa', () => {
    expect(traduccionAutomatica(revisada('aaaaaaaaaaaa'), 'fr', 'aaaaaaaaaaaa')).toBe(false);
  });

  it('una revisada con la huella vieja cuenta como automática', () => {
    expect(traduccionAutomatica(revisada('aaaaaaaaaaaa'), 'fr', 'bbbbbbbbbbbb')).toBe(true);
  });

  it('una revisada mientras no se conoce la huella actual no avisa', () => {
    expect(traduccionAutomatica(revisada('aaaaaaaaaaaa'), 'fr', null)).toBe(false);
  });
});
