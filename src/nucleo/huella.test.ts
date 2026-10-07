import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { huella as huellaNode } from '../../scripts/lib/huella.mjs';
import { huella, textosEspanol } from './huella';

const ejemplo = JSON.parse(readFileSync('contenido/ciclo-2/matematicas/3/semana-07.json', 'utf8'));

describe('huella', () => {
  it('da lo mismo que la del validador', async () => {
    expect(await huella(ejemplo)).toBe(huellaNode(ejemplo));
  });

  it('coincide con la guardada en la semilla de ejemplo', async () => {
    expect(await huella(ejemplo)).toBe(ejemplo.revision.traducciones.fr.huella);
  });

  it('cambia si cambia el español y no si cambia otro idioma o la revisión', async () => {
    const base = await huella(ejemplo);
    const otroEs = structuredClone(ejemplo);
    otroEs.objetivo.es += '.';
    expect(await huella(otroEs)).not.toBe(base);
    const otroFr = structuredClone(ejemplo);
    otroFr.objetivo.fr += '.';
    expect(await huella(otroFr)).toBe(base);
    const otraRevision = structuredClone(ejemplo);
    otraRevision.revision.docente.revisada = true;
    expect(await huella(otraRevision)).toBe(base);
  });

  it('recoge solo los textos «es», en orden', () => {
    expect(textosEspanol({ a: { es: 'uno', en: 'one' }, revision: { es: 'no' }, b: [{ es: 'dos' }, { es: 3 }] })).toEqual(['uno', 'dos']);
  });
});
