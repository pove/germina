# Germina: especificación técnica

Qué hay que construir y con qué reglas. Este documento manda sobre cualquier otro; si algo no está aquí, se pregunta antes de inventarlo. El orden de trabajo está en [tareas.md](tareas.md) y las reglas para agentes, en [CLAUDE.md](../CLAUDE.md).

## 1. Qué es

Germina es una web estática, sin registro ni datos personales, para las familias del 2.º ciclo de Primaria (3.º y 4.º) de un centro público de la Comunitat Valenciana. Cada semana del curso trae una **semilla**: un reto de unos 10 minutos para jugar en familia, sin pantalla, y una pregunta para cada día de lunes a viernes, para la comida o la cena. Las semillas jugadas forman el **jardín** de la familia.

- Idiomas: español (por defecto), valenciano, inglés, francés y árabe (de derecha a izquierda). En el aula todo se da en español; los otros idiomas sirven para que las familias entiendan.
- Primera versión: solo «2.º ciclo · Matemáticas». La estructura admite otros ciclos y áreas añadiendo archivos de contenido, sin reprogramar.
- Es un recurso voluntario. No hay entregas, notas ni seguimiento por parte del centro.

## 2. Principios que no se negocian

1. **Ningún dato sale del móvil.** Sin cuentas, formularios, cookies, analítica, CDN, fuentes ni scripts externos. Todo (tipografías, iconos, QR) se sirve desde el propio sitio. La única petición de red es al propio sitio.
2. **El móvil informa; la actividad se hace sin pantalla.** Nada de juegos en pantalla. La única herramienta en pantalla es un cronómetro para los juegos de rapidez.
3. **Nada suena a obligación.** Ver «Palabras de Germina» (apartado 5.4).
4. **Positivo y sin castigo.** Sin rachas, rankings, puntos ni notificaciones. El jardín nunca muestra plantas secas.
5. **Accesible y ligero.** WCAG 2.1 AA, móviles modestos y mala conexión.

## 3. Pantallas y rutas

Navegación con almohadilla (GitHub Pages solo sirve archivos estáticos). Sitio publicado en `https://pove.github.io/germina/` (en Vite, `base: '/germina/'`). El idioma no va en la ruta: se guarda en el dispositivo.

| Ruta | Pantalla |
| --- | --- |
| `#/` | Redirige a la semana actual del curso activo, o a `#/bienvenida` si no hay curso elegido |
| `#/bienvenida` | Idioma (preseleccionado el del navegador si es uno de los cinco), curso o cursos (3.º, 4.º o los dos) y las tres frases de semilla y jardín (5.5) |
| `#/{ciclo}/{area}/{curso}/semana/{n}` | **Esta semana** (inicio): título, objetivo, pregunta de hoy, acceso al reto, selector ◀ semana n ▶, «Volver a esta semana» si no es la actual, cambio de curso con un toque si hay dos |
| `#/{ciclo}/{area}/{curso}/semana/{n}/pregunta/{1-5}` | **Pregunta del día**: texto, botón «Pista», botón «Ver la respuesta», «Invéntala tú», «¡Lo hemos hablado!», anterior y siguiente |
| `#/{ciclo}/{area}/{curso}/semana/{n}/reto` | **Reto**: material, minutos, pasos con pictograma, más fácil, más difícil, para qué sirve, aviso, cronómetro y récord si es de rapidez, «¡Lo hemos jugado!» |
| `#/{ciclo}/{area}/{curso}/verano/{n}` y `…/verano/{n}/reto` | Igual que una semana, para los retos de verano |
| `#/{ciclo}/{area}/{curso}/jardin` | **El jardín**: las 41 semanas y los 10 retos de verano; tocar una planta lleva a su semana. Botón «?» con la explicación de semilla y jardín |
| `#/{ciclo}/{area}/{curso}/aprenden` | **Qué aprenden este curso**, por trimestre (`objetivos.json`) |
| `#/ayuda` | **Cómo ayudar** (`contenido/comun/como-ayudar.json`) |
| `#/ajustes` | Idioma, cursos, «Llevar el jardín a otro móvil», empezar de cero, privacidad, accesibilidad, hoja de récords imprimible, cómo instalar |
| `#/ajustes/pasar` | «Llevar el jardín a otro móvil»: enlace, QR y texto (6.3) |
| `#/recibir/{codigo}` | Pregunta «¿Añadir este jardín al vuestro?» y lo combina (6.4) |
| `#/imprimir/records` | Hoja de récords para imprimir |
| `#/privacidad`, `#/accesibilidad` | Páginas legales (9) |

Ejemplo: `#/2/matematicas/3/semana/7`. Una ruta desconocida o una semana inexistente lleva a `#/` sin error.

**Semillas que aún no existen.** El contenido se publica por tandas. Si el archivo de una semana no existe todavía, la pantalla muestra el título del mapa y «Esta semilla está en camino. Mientras tanto, podéis volver a cualquier semana anterior.», y el jardín la pinta como semilla sin enlace. Nunca hay un error ni una pantalla vacía.

- **Fin de semana:** sábado y domingo no hay pregunta del día; la pantalla de inicio destaca el reto.
- **Hoy:** lunes = pregunta 1 … viernes = pregunta 5, según la fecha local del dispositivo.
- Un único botón principal por pantalla, letra de 16 px como mínimo, iconos con texto.

## 4. Contenido

### 4.1 Carpetas

```
config/
  catalogo.json            ciclos y áreas; cuáles están activos (v1: solo 2 · matematicas)
  curso.json               regla de la semana 1, inicioCurso opcional, 41 semanas, trimestres
  idiomas.json             es, va, en, fr, ar (dir: rtl)
  curriculo/matematicas.json  saberes de los tres ciclos y criterios por ciclo
  esquemas/semilla.schema.json  esquema JSON de una semilla
contenido/
  ciclo-2/matematicas/
    mapa-semanas.json      tema, saberes y criterios de cada semana (fuente de verdad del orden)
    objetivos.json         qué aprenden, por curso y trimestre
    3/semana-01.json … semana-41.json, verano-01.json … verano-10.json
    4/…
  comun/
    como-ayudar.json       guía para familias
    textos-interfaz.json   textos de botones y menús, en los cinco idiomas
    glosario.json          vocabulario de clase en español y su traducción fija
scripts/                   validadores y utilidades (Node, sin dependencias de la web)
src/                       la aplicación
docs/                      especificación, tareas y documentos generados
```

### 4.2 Calendario

Sin calendario por año, sin festivos ni vacaciones.

- **Semana 1** es la semana (de lunes a domingo) que contiene el **9 de septiembre**. Si `curso.json` trae `inicioCurso` para ese año (`{"2027": "2027-09-08"}`), manda esa fecha: la semana 1 es la que la contiene.
- **Año de curso:** el año del 9 de septiembre más reciente cuya semana 1 ya haya empezado. Del 1 de enero al 6 de septiembre de 2027, el año de curso es 2026.
- **Semanas 1 a 41:** curso. **Desde la 42 hasta la nueva semana 1:** verano (el inicio abre `…/verano/1` y el jardín muestra los 10 retos de verano).
- **Trimestres:** semanas 1–15, 16–28 y 29–41 (solo para «Qué aprenden» y el mapa).
- Fechas locales del dispositivo, calculadas con año, mes y día (sin horas) para evitar los saltos del horario de verano. Funciones puras y con tests.
- **Cambio de curso:** la primera vez que se abre la web en un año de curso nuevo, se pregunta por cada curso guardado «¿Vuestro hijo o hija ha pasado a 4.º?». Si un curso era 4.º, se dice que el ciclo ha terminado y se ofrecen los retos de verano de 4.º. El progreso del año anterior se conserva.

### 4.3 Identificadores del currículo

En `config/curriculo/{area}.json`:

- Saberes: `área.bloque.saber`, p. ej. `matematicas.numeros.sistema-decimal`, con `ciclos: [1, 2]`. Un saber compartido entre ciclos tiene un único identificador.
- Criterios: `área.cN.n.m`, p. ej. `matematicas.c2.5.1`, con `ciclo` y `competencia`.
- Competencias: `área.CEn`.
- Tipos de problema: lista cerrada `tiposProblema` del archivo del área.

Una semilla solo puede citar saberes cuyo `ciclos` incluya su ciclo y criterios de su ciclo. El decreto asigna saberes por ciclo, no por curso: la web nunca dice «esto es de 3.º según la ley».

### 4.4 La semilla

Esquema: [config/esquemas/semilla.schema.json](../config/esquemas/semilla.schema.json). Ejemplo de referencia: [contenido/ciclo-2/matematicas/3/semana-07.json](../contenido/ciclo-2/matematicas/3/semana-07.json). Toda semilla nueva imita ese ejemplo en tono, longitud y estructura.

- **Coherencia con el mapa:** `titulo.es`, `tipo`, `saberes` y `criterios` coinciden con la entrada de esa semana en `mapa-semanas.json`. El reto desarrolla la idea de reto del mapa.
- **Cinco preguntas, en este orden:** p1, p2 y p3 del tema de la semana (con «Invéntala tú»); p4 recupera una semana anterior (`recupera` < semana; en la semana 1, `recupera: 0` = curso anterior); p5 es «Explícamelo» (`rol: explicamelo`, respuesta abierta).
- En las semanas de recordar, las cinco preguntas mezclan las semanas de `recupera` del mapa, pero el papel de p4 y p5 no cambia.
- **Respuestas:** las de cálculo llevan `operacion` con enteros y `+ - × :` y paréntesis, y `resultado`. Dinero en céntimos, horas en minutos, longitudes en cm o mm, masas en g y capacidades en ml cuando haga falta para trabajar con enteros. El texto mostrado (`respuesta.texto`) usa la forma de clase (1,20 €, 20:15).
- **Marcado `{{…}}`:** operaciones y expresiones con símbolos van entre `{{` y `}}` (p. ej. `{{42 − 17 = 25}}`). Se muestran aisladas de izquierda a derecha (`<bdi dir="ltr">`). Si dentro hay un `=`, el validador comprueba la igualdad. En el texto mostrado se usa `−` (U+2212) y `×`; en `operacion`, `-`.
- **Signos de clase:** `×` para multiplicar, `:` para dividir, coma decimal, hora con dos puntos. Igual en los cinco idiomas.
- **Un tono:** a la familia, en plural (`vosotros`, «Meted», «preguntad»); al niño o niña, en las preguntas y pistas, de tú. En árabe se prefieren formas en plural («لنـ») para no marcar género.

### 4.5 Reglas de contenido

- Números sencillos cuando la idea es nueva: la dificultad está en la idea, no en el cálculo.
- De lo concreto a lo simbólico: objetos, luego dibujo, luego operación escrita.
- Fracciones y decimales de 4.º, siempre sobre la recta (cinta métrica, metro de costura).
- Cada pregunta lleva su tipo de problema, con el vocabulario de clase del glosario.
- Seguridad: nada de fuego, cuchillos ni salir sin compañía; en la cocina, con una persona adulta; si hay objetos pequeños, `aviso` sobre hermanos o hermanas pequeños.
- Reparto equilibrado de niños y niñas y de familias diversas en los ejemplos (madre, padre, abuelas, una sola persona adulta…). Ver 5.3.
- Juegos de rapidez (`reto.rapidez`): 1 a 3 minutos, sobre contenido ya trabajado, y lo que cuenta es acertar, no solo correr.

### 4.6 Pictogramas

SVG propios en `src/assets/pictos/{nombre}.svg`, de un solo trazo, sin personas, que hereden `currentColor` y lleven `aria-hidden` (el texto del paso ya dice lo que muestran). La lista cerrada está en el esquema (`$defs.pictograma`). Añadir uno significa añadirlo al esquema y crear su SVG.

### 4.7 Otros archivos de contenido

- `textos-interfaz.json`: `{ "clave": { "es": …, "va": …, "en": …, "fr": …, "ar": … } }`. Claves en español sin tildes (`boton.lo_hemos_jugado`).
- `como-ayudar.json`: 5 a 7 ideas cortas (preguntar «¿cómo lo has pensado?», el error es parte de aprender, no resolverlo por el niño o niña, objetos y dibujos cuando se atasca, si no sale se da la pista y se sigue, no hace falta saber enseñar). Mismo formato de texto.
- `objetivos.json`: por curso y trimestre, 3 a 5 frases en lenguaje de familia.
- `glosario.json`: `[{ "es": "llevada", "va": …, "en": …, "fr": …, "ar": …, "nota": … }]`. Es el vocabulario de clase; las traducciones usan estas equivalencias.

## 5. Idiomas, escritura y lenguaje

### 5.1 Idiomas

- Todo texto existe en `es`, `va`, `en`, `fr` y `ar`. Si falta uno en tiempo de ejecución, se muestra el español con el aviso de traducción.
- Las traducciones las genera Claude al escribir el contenido y quedan en los JSON. La web no traduce nada ni llama a ningún servicio.
- `revision.traducciones.{idioma}`: `estado` (`automatica` | `revisada`) y `huella` del español cuando se tradujo ([scripts/lib/huella.mjs](../scripts/lib/huella.mjs)). Si `estado` es `revisada` pero la huella no coincide con la actual, cuenta como automática.
- Aviso discreto «Traducción automática» en la semilla cuando cuente como automática para el idioma elegido.
- **Palabras de clase:** en `va`, `en`, `fr` y `ar`, el término de clase va seguido del español entre paréntesis la primera vez que sale en cada semilla («une dizaine (decena)»).

### 5.2 Árabe y escritura de derecha a izquierda

- Al elegir `ar`: `<html lang="ar" dir="rtl">`. CSS con propiedades lógicas (`margin-inline-start`, `inset-inline-end`…), nunca `left`/`right` para la maquetación. Las flechas del selector de semana y de anterior y siguiente se reflejan.
- Cifras 0–9 siempre. Cualquier número que pinte la interfaz usa `Intl.NumberFormat(locale, { numberingSystem: 'latn' })` o directamente `String(n)`.
- El marcado `{{…}}` se pinta como `<bdi dir="ltr">` para que las operaciones no se desordenen.
- Tipografía árabe propia (Noto Sans Arabic, OFL, solo los glifos necesarios), cargada solo cuando el idioma es `ar`.

### 5.3 Lenguaje inclusivo

- Español: forma neutra cuando existe («vuestro hijo o hija», «quien juega», «la familia»); si no, barra («el niño/a», «cada jugador/a»).
- Valenciano: igual («el xiquet/a», «el vostre fill o filla»).
- Inglés: «your child», «they».
- Francés: «votre enfant»; si hay que concordar, doble forma («s'il ou elle»).
- Árabe: formas en plural cuando se puede; si no, se nombran los dos («ابنكم أو ابنتكم»). Una persona revisora fijará la fórmula final.

### 5.4 Palabras de Germina

Nada de lo que lee la familia suena a colegio de antes ni a obligación. Estas palabras no aparecen en la interfaz ni en el contenido, ni siquiera para negarlas:

| En vez de… | Germina dice… |
| --- | --- |
| deberes, tarea, ficha, ejercicio | semilla, reto, pregunta, juego |
| repaso, repasar | semana de recordar, volver a… |
| examen, prueba, nota, evaluar | jugar, probar, ver qué sale |
| corregir, está mal | «¿cómo lo has pensado?», «probemos otra vez», «casi» |
| solución | respuesta |
| marcar como hecho, completar | «¡Lo hemos jugado!», «¡Lo hemos hablado!» |
| obligatorio, hay que, debes | «si os apetece», «cuando os venga bien», «podéis» |
| progreso, rendimiento, nivel | el jardín, lo que va brotando |
| guerra, batalla | carrera, duelo amistoso, juego |

Equivalentes que tampoco se usan: *homework, worksheet, test, exercise* · *devoirs, fiche, exercice, contrôle* · *deures, fitxa, tasca, exercici* · *واجب, تمرين, امتحان*. El vocabulario matemático de clase («llevada», «tabla del 7», «repartir») sí se usa.

### 5.5 Explicación de semilla y jardín

En la bienvenida, con un pictograma cada una y sin más texto:

1. «Cada semana os llega una **semilla**: una pregunta para cada día y un reto para jugar en familia, unos 10 minutos.»
2. «Cuando la jugáis, la semilla brota. Todas juntas forman vuestro **jardín**.»
3. «Sin prisa: si una semana no puede ser, la semilla espera.»

La misma explicación está en el botón «?» del jardín y en Ajustes.

## 6. Progreso

### 6.1 Qué se guarda

Solo en el dispositivo, en `localStorage`, clave `germina`, con este formato (versión 1):

```json
{
  "v": 1,
  "idioma": "es",
  "cursos": ["2/matematicas/3", "2/matematicas/4"],
  "cursoActivo": "2/matematicas/3",
  "ultimoAnoCurso": 2026,
  "progreso": {
    "2026/2/matematicas/3": {
      "s07": { "hecho": ["reto", "p1", "p2"], "record": 14 },
      "v03": { "hecho": ["reto"] }
    }
  }
}
```

- Claves de semana `sNN` y de verano `vNN`. Elementos posibles: `reto`, `p1` … `p5`. Son posiciones fijas: corregir el texto de una semilla no borra lo marcado.
- `record`: el mejor número apuntado en el juego de rapidez de esa semilla (entero de 0 a 255).
- Al leer, cualquier cosa que no encaje con el formato se ignora sin romper la web. Una versión futura del formato convierte la anterior (`v`).
- Si `localStorage` no está disponible (navegación privada), la web funciona igual y avisa una vez de que no se guardará lo marcado.
- Al marcar algo por primera vez, se llama a `navigator.storage.persist()` si existe.
- **Riesgo de Safari:** en iPhone, los datos de una web que no se abre en 7 días se borran salvo que esté en la pantalla de inicio. Ajustes y el primer «¡Lo hemos jugado!» invitan a instalarla, con instrucciones para iPhone y Android.

### 6.2 El jardín

Una planta por semana, en tres estados: semilla (nada marcado), brote (alguna pregunta hablada) y planta en flor (el reto jugado). Lo que se ve depende solo de lo marcado. Ningún estado se pierde con el tiempo: no hay plantas secas.

### 6.3 Enlace de progreso

Lleva todos los cursos y años guardados. Formato binario, versión 1:

```
byte  versión (1)
byte  número de bloques
por bloque:
  byte  año de curso − 2000
  byte  ciclo
  byte  área (código fijo: 1 = matematicas; los siguientes se añaden al final, nunca se reordenan)
  byte  curso
  6 bytes  semanas 1–41 marcadas (bit a 1 si hay algo; 41 bits y 7 de relleno a 0)
  por cada semana marcada, en orden: 1 byte con 6 bits (reto, p1…p5, de mayor a menor peso)
  10 bits en 2 bytes  veranos 1–10 marcados, y 1 byte por verano marcado como arriba
  byte  número de récords
  por récord: byte posición (1–41 semanas, 101–110 veranos), byte valor
2 bytes  CRC-16/CCITT-FALSE de todo lo anterior
```

- Se codifica en **Base32 de Crockford** (sin I, L, O ni U; mayúsculas y minúsculas valen lo mismo; al leer, O = 0 e I/L = 1).
- Enlace: `https://pove.github.io/germina/#/recibir/{codigo}`. Va detrás de `#`, así que el navegador no lo envía a ningún servidor.
- Como texto para copiar a mano: el mismo código en grupos de 4 separados por guiones.
- QR del enlace generado en el propio móvil (`qrcode-generator`, MIT, incluido en el paquete).
- Si la versión no se conoce o el CRC no cuadra: «Este código no se ha copiado bien. ¿Probáis a enviarlo otra vez?».

### 6.4 Combinar al recibir

- Las casillas marcadas se **suman** (unión). De cada récord se queda el mayor.
- Los cursos que no existían en este móvil se añaden a `cursos`.
- Lo que se desmarcó en un móvil no se desmarca en el otro.
- El idioma y el curso activo del móvil que recibe no cambian.

## 7. Funcionamiento sin conexión y rendimiento

- PWA instalable (`vite-plugin-pwa`, Workbox `generateSW`), con manifiesto en los cinco idiomas (nombre «Germina», el lema como descripción) e iconos propios.
- **Precarga:** la aplicación y todo el contenido activo (semillas, textos, configuración). Funciona sin conexión desde la primera visita completa.
- **Actualizaciones:** modo `prompt`. Si hay versión nueva, aviso discreto «Hay novedades · Ver ahora»; si no se pulsa, se aplica la próxima vez que se abra la web.
- **Presupuesto:** la primera carga de la página de inicio pesa como mucho 200 KB comprimidos (JS + CSS + HTML + fuente latina), y el conjunto precargado, 1,5 MB comprimidos como mucho. Lo comprueba un script en la integración continua.
- Navegadores: Safari iOS 16.4 o superior y Chrome Android de los últimos tres años.

## 8. Accesibilidad

- WCAG 2.1 AA: contraste, foco visible, orden lógico, todo usable con teclado y lector de pantalla, objetivos táctiles de 44 × 44 px o más, respeto a `prefers-reduced-motion`.
- Letra de 16 px como mínimo (Atkinson Hyperlegible, OFL, incluida en el sitio) y textos que aguantan el zoom al 200 %.
- `lang` y `dir` correctos en cada cambio de idioma.
- Botones con texto, no solo iconos. Respuestas y pistas en `<details>` o botones con `aria-expanded`.
- El cronómetro anuncia el final con texto (región `aria-live`) y no solo con sonido.
- Hoja de récords imprimible con una hoja de estilos `@media print` sencilla.

## 9. Privacidad y páginas legales

- **Privacidad**, en los cinco idiomas: la web no recoge ningún dato; no hay formularios, cuentas, cookies ni analítica; lo marcado se queda en el móvil y se borra con «Empezar de cero» o al borrar los datos del navegador. Por transparencia, se dice que GitHub, el alojamiento, registra la dirección IP de las visitas por motivos de seguridad.
- **Accesibilidad**: declaración breve (objetivo WCAG 2.1 AA, limitaciones conocidas y cómo comunicarlas al centro).
- No hay aviso de cookies porque no hay cookies.

## 10. Tecnología

| Pieza | Elección |
| --- | --- |
| Lenguaje | TypeScript en modo `strict` |
| Construcción | Vite, `base: '/germina/'` |
| Interfaz | Preact y `@preact/signals` |
| Rutas | Un enrutador propio de almohadilla, pequeño y con tests (sin dependencia) |
| PWA | `vite-plugin-pwa` |
| QR | `qrcode-generator` |
| Tests | Vitest (unidad) y Playwright con `@axe-core/playwright` (extremo a extremo y accesibilidad) |
| Validación de contenido | Node con `ajv` (esquema JSON 2020-12) |
| Paquetes | npm, Node 22 |
| Despliegue | GitHub Actions → GitHub Pages en cada cambio en `main` que pase `npm run check` |

No se añaden otras dependencias de ejecución sin justificarlo; cada una debe tener licencia compatible con MIT y no hacer peticiones de red.

**Scripts de npm:** `dev`, `build`, `preview`, `test`, `test:e2e`, `validar` (mapa + contenido), `peso` (presupuesto del apartado 7) y `check` (todo lo anterior salvo `dev` y `preview`).

**Carga del contenido:** el paso de construcción valida el contenido y lo copia a `dist/contenido/…`. La aplicación lo pide con `fetch` relativo a la base, y el service worker lo tiene precargado.

## 11. Validación del contenido

`npm run validar` falla si:

1. Una semilla no cumple el esquema o su `id` no coincide con su ruta.
2. Cita un saber, criterio o tipo de problema que no existe o que no es de su ciclo.
3. No coincide con su semana del mapa (título en español, tipo, saberes, criterios).
4. Una `operacion` no da su `resultado`, o una igualdad dentro de `{{…}}` no cuadra.
5. `recupera` no es una semana anterior.
6. Aparece una palabra de la lista de 5.4 en cualquier idioma (sin distinguir mayúsculas, por palabra completa).
7. Una traducción `revisada` tiene una huella que no coincide (en este caso es un **aviso**, no un error).
8. Falta algún texto en algún idioma, o algún `{{…}}` está desequilibrado o difiere entre idiomas (las operaciones deben ser idénticas en los cinco).
9. Un pictograma no tiene su SVG.

También se ejecuta `node scripts/mapa-semanas.mjs`, que valida el mapa y genera `docs/mapa-semanas.md`.

## 12. Cuándo está terminado

Una tarea está terminada cuando:

- `npm run check` pasa: tipos, tests de unidad, validación, construcción, presupuesto de peso y tests de extremo a extremo.
- Las funciones con lógica tienen tests de unidad: cálculo de la semana y del año de curso (incluido el cambio de año y los límites 41/42), «hoy» y fin de semana, rutas, lectura y escritura del almacenamiento, codificación y decodificación del enlace (ida y vuelta, código dañado, versión desconocida), combinación de progresos y evaluación de operaciones.
- Los tests de extremo a extremo cubren, en móvil (375 × 812) y en `es` y `ar`: bienvenida → semana actual; marcar una pregunta y el reto y verlos en el jardín; ir a otra semana y volver; enviar el progreso y recibirlo en otro contexto del navegador; funcionar sin conexión tras la primera visita; y axe sin infracciones serias ni críticas en cada pantalla.
- No hay peticiones a otros dominios (lo comprueba un test de extremo a extremo).
- Ningún texto nuevo de interfaz falta en ningún idioma.
