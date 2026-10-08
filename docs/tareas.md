# Germina: tareas por etapas

Cada etapa cabe en una sesión de trabajo y termina con su comprobación. No se empieza una etapa hasta que la anterior pasa `npm run check` (desde la etapa 1). La especificación es [especificacion.md](especificacion.md); las reglas, [CLAUDE.md](../CLAUDE.md).

## Etapa 0. Preparación (persona, no agente)

- [x] Crear el repositorio público `pove/germina` en GitHub, con licencia MIT.
- [x] `git init`, primer commit con lo que ya existe (config, contenido, docs, scripts) y subirlo. Nunca subir carpeta Inspiration.
- [x] En Settings → Pages, elegir «GitHub Actions» como origen.

## Etapa 1. Esqueleto y despliegue

**Entrega:** `package.json` (Node 22, npm), Vite + Preact + TypeScript `strict` con `base: '/germina/'`, Vitest, Playwright con un test que abre la página, y `.github/workflows/deploy.yml` que ejecuta `npm ci && npm run check` y publica `dist/` en Pages. Página mínima con el nombre y el lema. `LICENSE` (MIT) y un `README.md` corto.

**Comprobación:** `npm run check` pasa en local y en Actions, y `https://pove.github.io/germina/` muestra la página.

## Etapa 2. Validador de contenido

**Entrega:** `scripts/validar-contenido.mjs` con todas las reglas de la especificación (apartado 11), usando `ajv` con el esquema y `scripts/lib/huella.mjs`. Un evaluador de operaciones propio, sin `eval` ni `Function`. `npm run validar` ejecuta este script y `scripts/mapa-semanas.mjs`. Tests con semillas de prueba en `scripts/__tests__/` que rompen cada regla una a una.

**Comprobación:** la semilla de ejemplo (`3/semana-07.json`) pasa; cada semilla de prueba falla con un mensaje claro que dice archivo, campo y motivo.

## Etapa 3. Núcleo lógico, sin interfaz

**Entrega:** módulos puros en `src/nucleo/` con tests de unidad:
- `calendario.ts`: semana 1, año de curso, semana actual, verano, trimestre y «hoy» (pregunta 1–5 o fin de semana). Tests con fechas límite: el primer lunes de septiembre y el día anterior (con el 1 de septiembre en cada día de la semana), 31 de diciembre, semanas 41 y 42 y cambio de horario de verano.
- `rutas.ts`: interpretar y construir las rutas del apartado 3.
- `almacen.ts`: leer, escribir y migrar el formato del apartado 6.1, tolerando basura y la ausencia de `localStorage`.
- `enlace.ts`: codificar y decodificar el formato binario del apartado 6.3 (Base32 de Crockford y CRC-16/CCITT-FALSE). Tests de ida y vuelta, código dañado, versión desconocida y lectura con O/0 e I/L/1.
- `combinar.ts`: combinación del apartado 6.4.
- `operaciones.ts`: evaluador de `+ - × :` y paréntesis con enteros (compartido con el validador si es práctico).

**Comprobación:** cobertura de tests de al menos el 90 % en `src/nucleo/`.

## Etapa 4. Idiomas, textos y piezas comunes

**Entrega:**
- `contenido/comun/textos-interfaz.json` con todos los textos de interfaz en los cinco idiomas, siguiendo las «Palabras de Germina».
- `contenido/comun/glosario.json` (al menos 40 términos de clase de 3.º y 4.º), `como-ayudar.json` y `objetivos.json`.
- Un mecanismo de idioma: señal del idioma, `lang` y `dir` en `<html>`, y vuelta al español con aviso si falta un texto.
- El componente que pinta `{{…}}` como `<bdi dir="ltr">`.
- Las tipografías Atkinson Hyperlegible y Noto Sans Arabic en subconjunto, incluidas en el sitio; la árabe se carga solo con `ar`.
- Los SVG de todos los pictogramas de la lista.
- El validador comprueba también los archivos de `comun/`.

**Comprobación:** `npm run validar` pasa y una página de prueba muestra la semilla de ejemplo en los cinco idiomas, con el árabe de derecha a izquierda y las operaciones bien ordenadas.

## Etapa 5. Pantallas

**Entrega:** bienvenida, esta semana, pregunta del día, reto (con cronómetro y récord), jardín, qué aprenden, cómo ayudar y ajustes (sin «Llevar el jardín»), según el apartado 3. Incluye la pantalla «Esta semilla está en camino», el cambio de curso con un toque, la pregunta de septiembre sobre el paso a 4.º y el fin de semana.

**Comprobación:** tests de extremo a extremo de los flujos del apartado 12 que no dependen de la etapa 6, en `es` y `ar`, a 375 × 812, y axe sin infracciones serias ni críticas.

## Etapa 6. Llevar el jardín a otro móvil

**Entrega:** `#/ajustes/pasar` (enlace, botón de compartir con `navigator.share` si existe, QR y texto en grupos de 4), `#/recibir/{codigo}` con confirmación y combinación, y `#/imprimir/records`.

**Comprobación:** test de extremo a extremo que marca cosas en un contexto del navegador, abre el enlace en otro contexto distinto y comprueba el jardín combinado. También un código dañado a mano.

## Etapa 7. Sin conexión, actualizaciones y peso

**Entrega:** `vite-plugin-pwa` con precarga de aplicación y contenido, manifiesto, iconos, aviso «Hay novedades», `navigator.storage.persist()`, instrucciones de instalación para iPhone y Android, y `scripts/peso.mjs` (presupuestos del apartado 7) en `npm run check`.

**Comprobación:** test de extremo a extremo que carga la web, corta la red y navega a otra semana; `npm run peso` dentro de presupuesto.

## Etapa 8. Páginas legales y revisión final de calidad

**Entrega:** `#/privacidad` y `#/accesibilidad` en los cinco idiomas (apartado 9). Un test de extremo a extremo que falla si hay peticiones a otro dominio. Una revisión con el lector de pantalla del sistema en las pantallas principales, anotando lo que se haya corregido.

**Comprobación:** todo el apartado 12 de la especificación se cumple.

## Etapa 9. Contenido, por tandas

Una tanda por sesión, siempre imitando la semilla de ejemplo y respetando el mapa (`mapa-semanas.json`):

1. Semanas 1 a 8 de 3.º y 4.º (la 7 de 3.º ya existe). **Hecha.**
2. Semanas 9 a 15. **Hecha.**
3. Semanas 16 a 22. **Hecha.**
4. Semanas 23 a 28. **Hecha.**
5. Semanas 29 a 35. **Hecha.**
6. Semanas 36 a 41.
7. Retos de verano 1 a 10 de 3.º y 4.º.

**En cada tanda:** `npm run validar` pasa; todas las traducciones quedan como `automatica` con su huella; `revision.docente.revisada` en `false`. Al final, un resumen para la persona revisora: tres semillas al azar para leer enteras y cualquier decisión dudosa tomada.

## Fuera de la primera versión

Audio, otras áreas y ciclos (la estructura sí está preparada), notificaciones, cuentas o sincronización automática, y cualquier juego en pantalla aparte del cronómetro.
