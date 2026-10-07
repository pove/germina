# Revisión de accesibilidad (etapa 8)

Qué se ha mirado, qué se ha corregido y qué queda para una persona.

## Cómo se ha revisado

- **Árbol de accesibilidad** (lo que reciben los lectores de pantalla) de la bienvenida, la semana, la pregunta, el reto, el jardín, Ajustes y Privacidad, en español, volcado con Playwright (`ariaSnapshot`).
- **axe** (WCAG 2.0/2.1 A y AA) en cada pantalla, en `es` y `ar`, a 375 × 812 (tests de `e2e/`).
- **Objetivos táctiles** de 44 × 44 px o más en las pantallas principales y en las páginas legales.
- **Orden y foco:** al cambiar de pantalla el foco va al título `h1`; hay un botón «Saltar al contenido».

## Lo que estaba bien

- Una sola `main`, un solo `h1` por pantalla, secciones con su `h2` y nombre.
- Menú con `nav` y nombre; el enlace de la pantalla actual lleva `aria-current`.
- Pistas y respuestas son botones con `aria-expanded`.
- `lang` y `dir` correctos en cada idioma.

## Lo que se ha corregido

- **Jardín:** el botón «Qué es el jardín» llevaba un «?» decorativo dentro de su nombre, y el lector lo leía como parte del nombre. Ahora el signo está oculto (`aria-hidden`) y se lee solo el texto.
- **Menú:** en Privacidad y Accesibilidad sigue marcado «Ajustes».

## Lo que queda para una persona

No se ha podido hacer una pasada con un lector de pantalla real (VoiceOver en iPhone, TalkBack en Android, NVDA). Hay que hacerla, al menos en bienvenida, semana, pregunta, reto, jardín y Ajustes, en `es` y `ar`, y anotar aquí lo que se encuentre. La declaración de Accesibilidad ya dice que no se ha revisado con todos los lectores ni todos los móviles.
