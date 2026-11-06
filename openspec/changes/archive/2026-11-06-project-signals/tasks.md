# Tasks

## 1. Campo `detect` en el catálogo

- [x] 1.1 Añadir a `catalog/schema.json` la propiedad opcional `detect`: array con `minItems: 1`, `uniqueItems: true` y el patrón de la decisión 1 del design. Añadir `detect?` a `Category` en `src/catalog/types.ts`.

  Verificar con fixtures nuevas en `test/unit/fixtures/invalid-schema/`, registradas en `schema.test.ts`:
  - `detect` vacío;
  - patrón repetido;
  - `**/*.tf`;
  - `src/*.cs`;
  - `/go.mod`.
- [x] 1.2 En `checkCatalogRules` (`src/catalog/validate.ts`), rechazar los segmentos `.` y `..`, con un error que nombre la categoría y el patrón. Verificar con casos en `validate.test.ts`.
- [x] 1.3 Declarar `detect` en `git`, `node`, `pnpm`, `npm` y `docker`, según la decisión 6 del design.
  - Añadir a `content.test.ts` que `terminal` no declara `detect`.
  - Documentar el campo y la advertencia sobre patrones genéricos en `catalog/README.md`.

## 2. Detección por patrones

- [x] 2.1 Reescribir `src/project/detect.ts`:
  - `signalsFromCatalog`;
  - `compileSignals`, que distingue los patrones de la raíz (`RegExp` con flag `i` y `*` como `[^/]*`) de las rutas `dir/name`;
  - `detectCategories(roots, signals, list)`;
  - `watchGlob(signals)`.

  Quitar `PROJECT_SIGNALS` y `SIGNAL_GLOB`. Reescribir `test/unit/project/detect.test.ts` con los escenarios de la spec:
  - cada señal real detecta su categoría (a partir de `signalsFromCatalog(bundledCatalog)`);
  - pnpm y Docker, multi-root, sin carpetas, solo en subcarpetas;
  - comodín, comodín solo en la raíz, ruta de un nivel con y sin el archivo;
  - `dockerfile` en minúsculas;
  - las señales nuevas;
  - un `list` que falla;
  - el glob: `*` sin rutas, y `{*,prisma/*}` con una ruta.
- [x] 2.2 En `ProjectDetector`, sustituir `exists` por `list(folder, dir?)` en `ProjectWorkspace`, recibir las señales en el constructor y vigilar con `watchGlob`. En `vscodeProject.ts`, implementar `list` con `workspace.fs.readDirectory`. Adaptar `ProjectDetector.test.ts`.
- [x] 2.3 En `esbuild.js`, añadir el plugin `virtual:project-signals` con `watchFiles` (decisión 2), y declarar el módulo en `src/virtual-modules.d.ts`. En `src/extension.ts`, importar el módulo y pasárselo a `createProjectDetector`.

  Verificar:
  - `pnpm run compile` compila sin errores;
  - `dist/extension.js` contiene `pnpm-workspace.yaml` y no contiene descripciones de comandos.

## 3. Integración

- [x] 3.1 En `src/test/extension.test.ts`:
  - comprobar que, tras `detectProject()`, `isCatalogLoaded()` sigue siendo `false` si la vista no se ha abierto;
  - añadir un caso en vivo: crear y borrar `Containerfile` en la carpeta de prueba actualiza `detected` con `docker`.

## 4. Documentación y verificación

- [x] 4.1 Actualizar:
  - la tabla de señales del README, que debe explicar también los comodines y las rutas de un nivel;
  - el CHANGELOG, en `[Unreleased]`;
  - el ROADMAP: la 3.2 con ✅ y una nota en los lotes 3.3–3.14 de que cada categoría declara su `detect`.

  Ejecutar `pnpm run verify` y `openspec validate project-signals --strict`.

## 5. Prueba manual

- [x] 5.1 Dar al autor la lista de comprobación en F5:
  - "En este proyecto" con node y pnpm en este repo;
  - crear y borrar `.nvmrc` o `Containerfile` en la raíz y ver el cambio en vivo;
  - `dockerfile` en minúsculas;
  - un `Dockerfile` solo en una subcarpeta no detecta Docker;
  - desactivar `devcommands.detectProject`.

  Resultado (2026-11-06): el autor confirmó en F5 que todos los puntos funcionan.
