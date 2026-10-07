// Valida el mapa de semanas contra el currículo y genera docs/mapa-semanas.md.
// Uso: node scripts/mapa-semanas.mjs   (sale con código 1 si hay errores)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (ruta) => JSON.parse(readFileSync(join(raiz, ruta), 'utf8'));

const mapa = leer('contenido/ciclo-2/matematicas/mapa-semanas.json');
const curriculo = leer(`config/curriculo/${mapa.area}.json`);

const SEMANAS = 41;
const TRIMESTRES = [[1, 15], [16, 28], [29, 41]];
const MAX_SIN_RECORDAR = 7;
// Palabras que no deben llegar a las familias (plan, apartado 5: «Palabras de Germina»).
const PROHIBIDAS = ['deberes', 'tarea', 'tareas', 'ficha', 'fichas', 'ejercicio', 'ejercicios', 'repaso', 'repasar',
  'examen', 'prueba', 'corregir', 'solución', 'obligatorio', 'obligatoria', 'guerra', 'batalla'];

const saberes = new Map(curriculo.saberes.map((s) => [s.id, s]));
const criterios = new Map(curriculo.criterios.map((c) => [c.id, c]));
const tipos = new Set(curriculo.tiposProblema.map((t) => t.id));
const errores = [];
const error = (donde, msg) => errores.push(`${donde}: ${msg}`);

function comprobarComun(donde, e) {
  for (const campo of ['tema', 'titulo', 'reto']) {
    if (!e[campo]) error(donde, `falta «${campo}»`);
  }
  if (!e.saberes?.length) error(donde, 'sin saberes');
  if (!e.criterios?.length) error(donde, 'sin criterios');
  for (const s of e.saberes ?? []) {
    if (!saberes.has(s)) error(donde, `saber desconocido «${s}»`);
    else if (!saberes.get(s).ciclos.includes(mapa.ciclo)) error(donde, `el saber «${s}» no es del ${mapa.ciclo}.º ciclo`);
  }
  for (const c of e.criterios ?? []) {
    if (!criterios.has(c)) error(donde, `criterio desconocido «${c}»`);
    else if (criterios.get(c).ciclo !== mapa.ciclo) error(donde, `el criterio «${c}» no es del ${mapa.ciclo}.º ciclo`);
  }
  for (const t of e.tiposProblema ?? []) if (!tipos.has(t)) error(donde, `tipo de problema desconocido «${t}»`);
  for (const campo of ['titulo', 'reto']) {
    const palabras = (e[campo] ?? '').toLowerCase().split(/[^\p{L}]+/u);
    for (const p of PROHIBIDAS) if (palabras.includes(p)) error(donde, `«${p}» en ${campo}`);
  }
}

const usados = new Set();
for (const [curso, semanas] of Object.entries(mapa.cursos)) {
  if (semanas.length !== SEMANAS) error(`${curso}.º`, `tiene ${semanas.length} semanas, no ${SEMANAS}`);
  let ultimaRecordar = 0;
  semanas.forEach((e, i) => {
    const donde = `${curso}.º semana ${e.semana}`;
    if (e.semana !== i + 1) error(donde, `fuera de orden (posición ${i + 1})`);
    const t = TRIMESTRES.findIndex(([a, b]) => e.semana >= a && e.semana <= b) + 1;
    if (e.trimestre !== t) error(donde, `trimestre ${e.trimestre}, debería ser ${t}`);
    if (!['tema', 'recordar'].includes(e.tipo)) error(donde, `tipo «${e.tipo}» no válido`);
    if (e.tipo === 'recordar') {
      if (!e.recupera?.length) error(donde, 'semana de recordar sin «recupera»');
      for (const r of e.recupera ?? []) if (r >= e.semana) error(donde, `recupera la semana ${r}, que no es anterior`);
      ultimaRecordar = e.semana;
    } else if (e.recupera) {
      error(donde, '«recupera» solo va en semanas de recordar');
    }
    if (e.semana - ultimaRecordar > MAX_SIN_RECORDAR) error(donde, `más de ${MAX_SIN_RECORDAR} semanas sin semana de recordar`);
    comprobarComun(donde, e);
    e.saberes?.forEach((s) => usados.add(s));
  });
}
for (const [curso, semillas] of Object.entries(mapa.verano)) {
  semillas.forEach((e, i) => {
    const id = `verano-${String(i + 1).padStart(2, '0')}`;
    if (e.id !== id) error(`${curso}.º ${e.id}`, `debería llamarse ${id}`);
    comprobarComun(`${curso}.º ${e.id}`, e);
    e.saberes?.forEach((s) => usados.add(s));
  });
}

// --- Markdown para revisar ---
const celda = (e) => `**${e.titulo}**${e.tipo === 'recordar' ? ' ↺' : ''}${e.rapidez ? ' ⏱' : ''}<br>${e.tema}`;
// En el documento se omite el prefijo de área y ciclo, que es el mismo en todo el mapa.
const corto = (id) => String(id).replace(`${mapa.area}.c${mapa.ciclo}.`, '').replace(`${mapa.area}.`, '');
const lista = (ids) => ids.map(corto).join(', ');
const md = [];
md.push('# Mapa de semanas · Matemáticas · 2.º ciclo', '');
md.push('> Generado por `scripts/mapa-semanas.mjs` a partir de `contenido/ciclo-2/matematicas/mapa-semanas.json`. No editar a mano.', '');
md.push(`**Estado:** ${mapa.estado}. ${mapa.nota}`, '');
md.push(`Leyenda: ↺ semana de recordar · ⏱ juego de rapidez con cronómetro y récord. Saberes y criterios sin el prefijo \`${mapa.area}.\` (criterios: \`${mapa.area}.c${mapa.ciclo}.\`), tal como están en \`config/curriculo/${mapa.area}.json\`.`, '');

TRIMESTRES.forEach(([a, b], i) => {
  md.push(`## ${i + 1}.º trimestre (semanas ${a}–${b})`, '');
  md.push('| Sem. | 3.º | 4.º |', '| :-: | --- | --- |');
  for (let s = a; s <= b; s++) {
    md.push(`| ${s} | ${celda(mapa.cursos['3'][s - 1])} | ${celda(mapa.cursos['4'][s - 1])} |`);
  }
  md.push('');
});

md.push('## Verano', '', '| | 3.º (prepara 4.º) | 4.º (prepara el 3.er ciclo) |', '| :-: | --- | --- |');
mapa.verano['3'].forEach((e, i) => md.push(`| ${i + 1} | ${celda(e)} | ${celda(mapa.verano['4'][i])} |`));
md.push('');

for (const curso of ['3', '4']) {
  md.push(`## Detalle de ${curso}.º`, '', '| Sem. | Saberes | Criterios | Tipos de problema | Idea de reto |', '| :-: | --- | --- | --- | --- |');
  for (const e of mapa.cursos[curso]) {
    const extra = e.recupera ? `<br>Recupera: ${lista(e.recupera)}` : '';
    md.push(`| ${e.semana} | ${lista(e.saberes)} | ${lista(e.criterios)} | ${lista(e.tiposProblema ?? [])}${extra} | ${e.reto} |`);
  }
  for (const e of mapa.verano[curso]) {
    md.push(`| ${e.id} | ${lista(e.saberes)} | ${lista(e.criterios)} | ${lista(e.tiposProblema ?? [])} | ${e.reto} |`);
  }
  md.push('');
}

const delCiclo = curriculo.saberes.filter((s) => s.ciclos.includes(mapa.ciclo));
const sinUsar = delCiclo.filter((s) => !usados.has(s.id));
md.push('## Saberes del ciclo que no aparecen en el mapa', '');
md.push(sinUsar.length
  ? 'Son sobre todo saberes de actitud, historia o herramientas digitales, que encajan mejor en «Cómo ayudar» o en el aula que en un reto en casa.\n'
  : 'Todos los saberes del ciclo aparecen al menos una vez.\n');
for (const s of sinUsar) md.push(`- \`${corto(s.id)}\`: ${s.texto}`);
md.push('');

mkdirSync(join(raiz, 'docs'), { recursive: true });
writeFileSync(join(raiz, 'docs/mapa-semanas.md'), md.join('\n'));

if (errores.length) {
  console.error(`${errores.length} error(es):\n- ${errores.join('\n- ')}`);
  process.exit(1);
}
console.log(`Mapa correcto: ${Object.keys(mapa.cursos).length} cursos × ${SEMANAS} semanas, ${usados.size} de ${delCiclo.length} saberes del ciclo usados. Generado docs/mapa-semanas.md`);
