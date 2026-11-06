# Tasks

## 1. Secciones en el catálogo

- [x] 1.1 Añadir `section` (obligatorio, `enum` de 10 valores) a `catalog/schema.json` y `SectionId` y `SECTION_ORDER` a `src/catalog/types.ts`.
  - Asignar la sección a las 6 categorías: `git` → `vcs`; `npm`, `pnpm` y `node` → `languages`; `docker` → `infra`; `terminal` → `tools`.
  - Documentar el campo en `catalog/README.md`.

  Verificar con `test/unit/catalog/schema.test.ts` (o el test Ajv existente), con casos nuevos: sin `section` y con `"section": "misc"` → error.
- [x] 1.2 En `src/catalog/custom.ts`, asignar `section: 'custom'` a las categorías propias. Verificar con un caso en los tests de `custom.ts`.

## 2. Carga bajo demanda

- [x] 2.1 Crear `src/catalog/load.ts` con `loadCatalogDir(dir)`: los `*.json` salvo `schema.json`, en orden alfabético, con un error que nombra el archivo si falla. Verificar con `test/unit/catalog/load.test.ts`: lee `catalog/`, ignora `schema.json`, y con un JSON roto en una carpeta temporal falla nombrando el archivo.
- [x] 2.2 Hacer perezoso a `CatalogService`: acepta `Catalog | (() => Catalog)`, carga en la primera consulta una sola vez y `setCustomCategories` no fuerza la carga. Eliminar `src/catalog/index.ts` y pasar los tests a `loadCatalogDir('catalog')`. Verificar con tests:
  - el cargador no se llama al construir ni al fijar categorías propias;
  - se llama una sola vez al consultar;
  - el orden y la combinación con las propias no cambian.
- [x] 2.3 En `esbuild.js`, vaciar y copiar `catalog/*.json` (salvo `schema.json`) a `dist/catalog/` en cada build y en cada `onEnd` del modo watch. En `src/extension.ts`, pasar el cargador con `context.extensionPath`. Verificar con `pnpm run compile`: `dist/catalog/` contiene los 6 archivos y `dist/extension.js` ya no contiene el texto de los comandos (por ejemplo, `"git status"`).
- [x] 2.4 En `scripts/release-check.mjs`, permitir `dist/catalog/*.json` en el `.vsix` y añadir `missingCatalogFiles(paths, catalogIds)`. En `release-package.mjs`, fallar si falta alguno. Verificar con casos en `test/unit/scripts/release-check.test.ts`.
- [x] 2.5 Medir: un test unitario que carga el catálogo real con `loadCatalogDir` y comprueba que tarda menos de 200 ms; y un test de integración que comprueba que, tras la activación y sin abrir la vista, el catálogo no se ha cargado (contador expuesto en la API de pruebas). Verificar con `pnpm run test:unit` y `pnpm test`.

## 3. Protocolo y resumen

- [x] 3.1 Añadir `section` a `CategorySummary` (`buildCategorySummaries`) y exportar `SECTION_ORDER` y `SectionId` desde `src/messaging/protocol.ts`. Verificar con `CatalogService.test.ts`: cada resumen lleva la sección de su categoría y las propias llevan `custom`.

## 4. Webview: secciones plegables

- [x] 4.1 En `navigation.ts`:
  - `homeSections()` agrupa por sección en el orden de `SECTION_ORDER`, sin vacías y sin las detectadas;
  - nuevo estado guardado `{ view, expanded }`, con `parseSavedState()` compatible con el formato anterior y valor inicial `['project']`.

  Verificar con `test/unit/webview/navigation.test.ts`: agrupación, orden, vacías, detectadas, migración del estado antiguo e ids desconocidos.
- [x] 4.2 En los 11 diccionarios, añadir los 12 nombres de sección y `categoryCount` con plurales, y quitar `allCategories`. Verificar con `test/unit/i18n/webview-dictionaries.test.ts` en verde.
- [x] 4.3 En `CategoryList.tsx`, poner los encabezados plegables en la lista itinerante, con `aria-expanded`, chevrons decorativos, → y ← según el tipo de entrada, y el foco en el encabezado al plegar. En `App.tsx`, guardar y restaurar `expanded`. En `index.css`, estilos del encabezado con los colores del tema. Verificar con `pnpm run lint:webview`, `pnpm run build:webview` y los tests de navegación.

## 5. Documentación

- [x] 5.1 Actualizar:
  - el README: las secciones del panel y que "En este proyecto" va primero y desplegada;
  - el CHANGELOG, bajo `[Unreleased]`: `Added` (secciones plegables) y `Changed` (carga bajo demanda y desaparición de "Todas");
  - el ROADMAP: marcar la fila 3.1 con ✅.

  Verificar con `pnpm run verify` en verde.

## 6. Prueba manual (F5)

- [x] 6.1 Dar al autor la lista de comprobación en F5:
  - el orden de las secciones;
  - "En este proyecto" desplegada y el resto plegadas;
  - desplegar y plegar con ratón y teclado (→, ←, Enter);
  - el estado al volver de una categoría y al ocultar y mostrar la vista;
  - la búsqueda con todo plegado;
  - "Mis comandos" con una categoría propia;
  - el lector de pantalla (Narrador, `Ctrl+Win+Enter`) en un encabezado;
  - temas claro, oscuro y de alto contraste.

  Resultado (2026-11-06): el autor confirmó en F5 que todos los puntos funcionan. Pidió más separación vertical entre las tarjetas (Favoritos, Recientes) y las secciones, y entre una sección y la siguiente; se aplicaron 14 px y 10 px y lo aprobó.
