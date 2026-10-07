# Germina

Una semilla de Matemáticas cada semana para que las familias de 3.º y 4.º de Primaria jueguen en casa, sin pantalla. Web estática (PWA), sin cuentas ni datos personales, en español, valenciano, inglés, francés y árabe.

- Qué se construye: [docs/especificacion.md](docs/especificacion.md)
- En qué orden: [docs/tareas.md](docs/tareas.md)
- Reglas para quien colabore: [CLAUDE.md](CLAUDE.md)

## Desarrollo

Requiere Node 22.

```bash
npm ci
npm run dev      # servidor local en http://localhost:5173/germina/
npm run check    # tipos, tests, validación, construcción, peso y extremo a extremo
npm run peso     # presupuestos de peso de dist/ (200 KB la primera carga, 1,5 MB lo precargado)
```

Los tests de extremo a extremo usan Playwright (`npx playwright install chromium`).

## Licencia

[MIT](LICENSE)
