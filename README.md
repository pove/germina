# Germina

Una semilla de Matemáticas cada semana para que las familias de 3.º y 4.º de Primaria jueguen en casa, sin pantalla.

Germina es una web estática (PWA), sin cuentas ni datos personales, en español, valenciano, inglés, francés y árabe. Publicada en <https://pove.github.io/germina/>.

## Qué es

Cada semana del curso trae una **semilla**: un reto de unos 10 minutos para jugar en familia y una pregunta para cada día, de lunes a viernes. Cuando la familia dice «¡Lo hemos jugado!» o «¡Lo hemos hablado!», la semilla brota y pasa a formar parte de su **jardín**.

- **Los adultos la usan; la actividad no lleva pantalla.** Quien acompaña mira la semilla antes y se la propone al niño o a la niña. El móvil solo informa; la única herramienta en pantalla es un cronómetro para los retos de rapidez.
- **Sin obligación ni castigo.** Sin rachas, rankings, puntos ni notificaciones. El jardín no tiene plantas secas, y si una semana no puede ser, la semilla espera.
- **Todo se queda en el móvil.** Lo marcado se guarda en el navegador. Para llevarlo a otro móvil hay un enlace, un QR y un código que lo combinan con lo que ya hubiera allí.
- **Cinco idiomas.** El español es el original; el resto se genera y está marcado como traducción automática hasta que una persona la revise. El árabe se escribe de derecha a izquierda. Las cifras son siempre 0–9, con coma decimal.
- **Accesible y ligera.** Objetivo WCAG 2.1 AA, objetivos táctiles de 44 px o más, tipografías incluidas en el sitio y ninguna petición a otros dominios.

## Pantallas

Bienvenida, esta semana, pregunta del día, reto (con cronómetro y récord), jardín, qué aprenden, cómo ayudar, ajustes, llevar el jardín a otro móvil, hoja de récords para imprimir, privacidad y accesibilidad. Las rutas usan almohadilla (`#/2/matematicas/3/semana/7`), porque GitHub Pages solo sirve archivos estáticos.

## Estado

El trabajo va por etapas, en [docs/tareas.md](docs/tareas.md): esqueleto, validador de contenido, núcleo lógico, idiomas, pantallas, llevar el jardín a otro móvil y páginas legales están hechos. Quedan el funcionamiento sin conexión con su presupuesto de peso (etapa 7) y el contenido, por tandas (etapa 9). Por ahora solo existe la semana 7 de 3.º, que sirve de modelo.

## Documentación

- [docs/especificacion.md](docs/especificacion.md): qué se construye. Manda sobre todo lo demás.
- [docs/tareas.md](docs/tareas.md): en qué orden.
- [docs/mapa-semanas.md](docs/mapa-semanas.md): qué toca cada semana de 3.º y 4.º (se genera, no se edita a mano).
- [docs/revision-accesibilidad.md](docs/revision-accesibilidad.md): qué se ha revisado en accesibilidad y qué falta.
- [CLAUDE.md](CLAUDE.md): reglas para quien colabore, personas o agentes.

## Tecnología

TypeScript `strict`, Preact con `@preact/signals`, Vite, un enrutador propio, `qrcode-generator` para el QR, Vitest para la lógica y Playwright con axe para los flujos y la accesibilidad. Las dependencias son solo las de la especificación (apartado 10). Se despliega en GitHub Pages con GitHub Actions.

## Estructura

```
config/       catálogo de ciclos y áreas, regla del curso, idiomas, currículo y esquemas JSON
contenido/    semillas (ciclo-2/matematicas/{3,4}), mapa de semanas, objetivos y textos comunes
docs/         especificación, tareas y mapa de semanas
e2e/          tests de extremo a extremo (Playwright)
scripts/      validador de contenido, evaluador de operaciones y generador del mapa
src/nucleo/   lógica pura con tests: calendario, rutas, almacén, enlace, combinar, operaciones
src/pantallas/  una pantalla por archivo
src/piezas/   componentes comunes: diseño, cronómetro, pictogramas, marcado de operaciones
src/assets/   tipografías, pictogramas e iconos, todo dentro del sitio
```

## Desarrollo

Requiere Node 22.

```bash
npm ci
npm run dev      # servidor local en http://localhost:5173/germina/
npm run check    # tipos, tests, validación, construcción y extremo a extremo
```

Otros comandos:

| Comando | Qué hace |
| --- | --- |
| `npm run tipos` | Comprueba los tipos |
| `npm test` | Tests de unidad, con umbral de cobertura del 90 % en `src/nucleo/` |
| `npm run validar` | Valida el contenido y el mapa, y regenera `docs/mapa-semanas.md` |
| `npm run test:e2e` | Tests de extremo a extremo (construye antes con `npm run build`) |
| `npm run build` | Tipos y construcción en `dist/` |

Los tests de extremo a extremo usan Playwright (`npx playwright install chromium`). Si en local no hay navegador de Playwright, `PW_CANAL=chrome npm run test:e2e` usa el Chrome instalado.

## Cómo colaborar con contenido

Cada semilla es un JSON que imita [la semana 7 de 3.º](contenido/ciclo-2/matematicas/3/semana-07.json) y coincide con su semana del mapa (`mapa-semanas.json`). Se escribe en español; las otras cuatro versiones van en el mismo archivo como `automatica`, con la huella del texto original. Nunca se marcan como `revisada`: eso lo hace una persona.

`npm run validar` comprueba el esquema, el mapa, que las operaciones cuadren, que los cinco idiomas estén completos y que no aparezca ninguna de las «Palabras de Germina» que suenan a obligación o a evaluación (especificación, 5.4). Hay que ejecutarlo antes de abrir una PR.

## Licencia

[MIT](LICENSE). Las tipografías (Atkinson Hyperlegible y Noto Sans Arabic) conservan su licencia OFL, en `src/assets/fuentes/`.
