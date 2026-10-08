# Germina

Web estática (PWA) para que las familias de 3.º y 4.º de Primaria acompañen las Matemáticas en casa: cada semana, una **semilla** con un reto sin pantalla y una pregunta diaria; lo jugado forma su **jardín**. Cinco idiomas (es, va, en, fr, ar). Sin datos personales.

- **Qué construir:** [docs/especificacion.md](docs/especificacion.md). Manda sobre todo lo demás.
- **En qué orden:** [docs/tareas.md](docs/tareas.md). Trabaja una etapa cada vez y marca sus casillas al terminar.
- **Modelo de contenido:** [contenido/ciclo-2/matematicas/3/semana-07.json](contenido/ciclo-2/matematicas/3/semana-07.json). Toda semilla nueva lo imita.

## Reglas que no se rompen

1. **Ninguna petición a otro dominio.** Nada de CDN, Google Fonts, analítica, APIs de traducción ni servicios externos, tampoco en tiempo de construcción para el contenido. Tipografías, iconos y QR van dentro del sitio.
2. **Ningún dato personal.** Solo `localStorage` con el formato de la especificación (6.1). Nada de cookies, formularios ni cuentas.
3. **Palabras de Germina** (especificación, 5.4). En la interfaz y el contenido, en los cinco idiomas, nunca: deberes, tarea, ficha, ejercicio, repaso, examen, prueba, nota, corregir, solución, obligatorio, guerra, batalla, progreso… Ni siquiera para negarlas. Se dice semilla, reto, pregunta, jardín, «¡Lo hemos jugado!», «¡Lo hemos hablado!», semana de recordar, respuesta.
4. **Números como en el cuaderno, en los cinco idiomas:** cifras 0–9 (también en árabe: `numberingSystem: 'latn'`), coma decimal, `×` y `:`, hora `20:15`. Las operaciones van en `{{…}}` y se pintan como `<bdi dir="ltr">`.
5. **Árabe de derecha a izquierda:** `dir="rtl"` en `<html>`, CSS con propiedades lógicas, nunca `left`/`right` para maquetar.
6. **Sin castigo:** sin rachas, rankings, puntos ni notificaciones. El jardín no tiene plantas secas.
7. **Identificadores del currículo completos:** `matematicas.numeros.sistema-decimal`, `matematicas.c2.5.1`. Una semilla solo cita saberes y criterios de su ciclo.
8. **El contenido manda en el mapa:** cada semilla coincide con su semana en `contenido/ciclo-2/matematicas/mapa-semanas.json` (título en español, tipo, saberes, criterios). Si crees que el mapa está mal, dilo; no lo cambies por tu cuenta.
9. **Dependencias:** solo las de la especificación (apartado 10). Para añadir otra, hay que justificarla, con licencia compatible con MIT y sin peticiones de red.
10. **Accesibilidad:** WCAG 2.1 AA, objetivos táctiles de 44 px o más y botones con texto.

## Contenido

- Se escribe en español y Claude genera las otras cuatro versiones en el mismo archivo. Al crear o cambiar el español, todas las traducciones quedan `automatica` con la huella nueva (`scripts/lib/huella.mjs`). Nunca marques una traducción como `revisada`: eso lo hace una persona.
- A la familia, en plural («Meted», «preguntad»); al niño o niña, de tú. En árabe, formas en plural («لنـ») para no marcar género.
- Lenguaje inclusivo (especificación, 5.3) y ejemplos con familias diversas.
- Cada `operacion` da su `resultado`, y cada `{{a − b = c}}` cuadra. Lo comprueba el validador, pero piénsalo antes.
- Nunca marques `revision.docente.revisada: true`.

## Comandos

- `npm run check`: todo. Tiene que pasar antes de dar por terminada cualquier tarea.
- `npm run validar`: contenido y mapa. `node scripts/mapa-semanas.mjs` regenera `docs/mapa-semanas.md` (no se edita a mano).
- `npm test` / `npm run test:e2e`: tests de unidad / de extremo a extremo.

## Lo que no está en el repositorio

`inspiration/` (en `.gitignore`) tiene el plan original para el centro, las normas y datos internos del centro. Puede no existir en tu copia. **Nunca copies al repositorio datos del centro** (resultados, memorias, nombres): el repositorio es público.

## Estilo de código

TypeScript `strict`, módulos pequeños, lógica pura en `src/nucleo/` con tests, componentes Preact en `src/pantallas/` y `src/piezas/`. Nombres y comentarios en español, como el resto del proyecto.

## Commits y pull requests

Sin atribución a Claude: ni `Co-Authored-By: Claude…`, ni `Claude-Session: …`, ni «Generated with Claude Code» en commits, pull requests, comentarios ni archivos. El mensaje termina en el texto del cambio.
