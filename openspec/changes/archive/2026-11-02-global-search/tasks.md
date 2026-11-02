# Tasks

## 1. Búsqueda pura

- [x] 1.1 Crear `src/catalog/search.ts` con `normalize`, `buildSearchText`, `queryWords` y `search` (D2). Tests en `test/unit/catalog/search.test.ts`:
  - `normalize`: mayúsculas, tildes, `ñ`, espacios repetidos;
  - `queryWords`: solo espacios → `[]`;
  - `search`: todas las palabras, sin tildes, orden con el título primero y orden estable del catálogo;
  - una búsqueda vacía no devuelve nada;
  - `buildSearchText`: sin vacíos ni repetidos y con el separador;
  - el archivo `search.ts` no contiene ningún `import`.

  Verificar con `pnpm run test:unit`

## 2. Extensión

- [x] 2.1 `CommandSummary` añade `searchText`, y `buildCategorySummaries` lo construye con `en`, `es`, el idioma activo, la categoría y el ejemplo (D1). Tests en `CatalogService.test.ts`:
  - con el idioma activo `en`, `git.status` contiene "show status", "ver estado", "estado" y "git status";
  - `git.reset-hard` contiene "indice" y no "í";
  - ajustar el test de claves exactas del resumen.

  En `extension.test.ts`, ningún `searchText` contiene `${` y todos están en minúsculas. Verificar con `pnpm run test:unit`, `pnpm run check-types` y `pnpm test`

## 3. Navegación

- [x] 3.1 En `navigation.ts` (D4): `query` y `focusCommandId` en `categories`, la acción `search`, `focusCommand` en `categories` cuando hay `query`, y los cambios en `parseSavedView` y `resolveView`. Tests en `navigation.test.ts`:
  - `search` guarda la consulta y la vacía con espacios;
  - `focusCommand` con consulta;
  - `back` y `open` no se ven afectados;
  - `parseSavedView` acepta y rechaza estados con `query`;
  - un estado antiguo sin `query` sigue siendo válido;
  - `resolveView` quita el foco inexistente y conserva `query`.

  Verificar con `pnpm run test:unit`

## 4. Webview

- [x] 4.1 Añadir `searchLabel`, `searchPlaceholder`, `searchResultsLabel`, `resultCount` (plural según `Intl.PluralRules`) y `noResults` en los 11 idiomas (D6). Verificar con `pnpm run test:unit` (diccionarios)
- [x] 4.2 Crear `SearchBox.tsx` y `SearchResults.tsx`, y ajustar `CommandList` (`categoryTitle` por fila, `listLabel`, `focusFirst` con `ref`) y `App.tsx` (D5). Añadir `../src/catalog/search.ts` al `include` de `webview-ui/tsconfig.app.json` (D3) y los estilos (`.search-box` con `--vscode-input-*` y el foco del tema, y `.command-category`). Verificar con `pnpm run lint:webview` y `pnpm run build:webview`, y comprobar con grep que `dist/webview/assets/index.js` no contiene `vscode` como módulo ni `node:`

## 5. Verificación manual (F5)

- [x] 5.1 Con F5, en Windows con PowerShell:
  - con la interfaz en inglés, escribir "rama" muestra "Create and switch branch" con la categoría Git;
  - "INDICE" encuentra "Discard all local changes";
  - "git estado" deja solo `git.status`;
  - en español, "cambios" muestra primero "Descartar todos los cambios locales" y después "Ver estado";
  - "zzz" muestra "Ningún comando coincide con la búsqueda.";
  - Flecha abajo pasa del campo al primer resultado; Tab desde un resultado sale de la lista; Escape en el campo o en un resultado vacía el campo, vuelve la lista de categorías y el foco queda en el campo;
  - Enter en un resultado lo escribe en la terminal sin ejecutarlo, y el botón de copiar y `Ctrl+C` lo copian;
  - al ocultar la vista y volver, se conservan la búsqueda y el foco;
  - el Narrador anuncia el número de resultados ("3 resultados") y "Ningún comando coincide…";
  - escribir rápido no pierde caracteres.

  El autor confirma. La prueba en bash queda cubierta por los tests y por la prueba en WSL antes de la release

## 6. Documentación

- [x] 6.1 Actualizar:
  - `CHANGELOG.md`: en `[Unreleased]` → Added, la búsqueda global en los dos idiomas del catálogo;
  - `README.md`: en Usage, el campo de búsqueda;
  - `docs/ROADMAP.md`: 1.6 ✅ y su casilla en Siguientes pasos.

  Verificar con grep

## 7. Verificación final

- [x] 7.1 `pnpm run verify` en verde, `openspec validate global-search --strict` sin errores y `/opsx:archive` antes de abrir el PR a `develop`
