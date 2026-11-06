## Why

La Fase 3 lleva el catálogo de 6 a unas 70 categorías. Con la lista plana actual del inicio, eso son unas 70 filas, inmanejables sin el buscador.

Además, desde la 2.10 la extensión se activa al terminar el arranque de VS Code. Como el catálogo va dentro de `dist/extension.js`, se carga entero, con sus 11 idiomas, en cada arranque, aunque el usuario no abra el panel. Hoy son unos 300 KB, y con la Fase 3 llegarán a unos 3 MB.

Fase del roadmap: **Fase 3 (v1.x)**, change 3.1. Es requisito previo de los lotes de contenido 3.3 a 3.14.

## What Changes

- **Secciones del catálogo.**
  - Cada categoría declara un campo obligatorio `section`, con un valor de una lista fija: `languages`, `vcs`, `frameworks`, `databases`, `infra`, `cloud`, `servers`, `quality`, `gamedev` o `tools`.
  - Las categorías actuales se reparten así: Git en `vcs`; npm, pnpm y Node.js en `languages`; Docker en `infra`; Terminal en `tools`.
  - Las categorías propias del usuario van a una sección aparte, "Mis comandos".
- **Inicio con secciones plegables.**
  - El orden es: Favoritos, Recientes, "En este proyecto" y después cada sección con contenido, en un orden fijo.
  - Cada encabezado muestra ▸/▾ y su número de categorías, y se despliega o se pliega con clic, Enter, Espacio o las flechas → y ←.
  - "En este proyecto" empieza desplegada y las demás plegadas. El estado se recuerda igual que la navegación.
  - Las secciones vacías no se muestran.
  - **BREAKING (visual):** desaparece el encabezado "Todas". Las categorías no detectadas aparecen en su sección.
- **Carga bajo demanda.**
  - Los JSON del catálogo salen del bundle: el build los copia a `dist/catalog/`.
  - La extensión los lee la primera vez que necesita el catálogo (al abrir el panel o el buscador de la paleta), nunca durante la activación.
- **Tamaño.** El empaquetado falla si el `.vsix` supera los 2 MB, que es la puerta de la Fase 3.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `category-view`: "Lista de categorías", "Teclado" y "Accesibilidad" pasan a secciones plegables.
- `command-catalog`:
  - el schema exige `section`;
  - el requisito "Catálogo empaquetado sin acceso a disco ni red" se sustituye por la carga bajo demanda de los archivos del paquete.
- `custom-commands`: "Integración con el catálogo" coloca las categorías propias en la sección "Mis comandos".

## Impact

- **Catálogo:** `catalog/schema.json`, los 6 `catalog/*.json` (campo `section`) y `catalog/README.md`.
- **Carga:**
  - `src/catalog/index.ts` se sustituye por un cargador de archivos;
  - cambian `src/catalog/types.ts`, `CatalogService.ts` (carga perezosa y `section` en `CategorySummary`) y `src/catalog/custom.ts`;
  - `esbuild.js` copia los JSON del catálogo a `dist/catalog/`;
  - `src/extension.ts` conecta el cargador.
- **Webview:** `navigation.ts` (agrupación y estado de secciones), `CategoryList.tsx`, `index.css` y los 11 diccionarios (11 títulos de sección, más los textos de plegar y desplegar).
- **Mensajes webview↔extensión:** `catalog` lleva el campo nuevo `section` en cada categoría. No hay mensajes nuevos.
- **Empaquetado:** `scripts/release-package.mjs` y `release-check.mjs` comprueban el límite de 2 MB y que `dist/catalog/*.json` va en el `.vsix`.
- **Tests:** catálogo (schema, carga y registro), navegación, empaquetado e integración.
- **Dependencias:** ninguna nueva.
