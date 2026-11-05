## 1. Modelo (lógica pura)

- [x] 1.1 Crear `src/quickPick/items.ts` con `SearchEntry`, `SearchSnapshot` y `searchEntries` (D1). Tests en `test/unit/quickPick/items.test.ts` (D6). Verificar: `pnpm run test:unit`.

## 2. Manifiesto y textos

- [x] 2.1 Añadir a `package.json` el comando `devcommands.searchCommands`, y `command.searchCommands` a los 11 `package.nls*.json` (D4). Verificar: `pnpm run test:unit` (test del manifiesto).

## 3. Extensión

- [x] 3.1 `CommandsViewProvider` (D2):
  - `searchSnapshot()`, reutilizado por `postCatalog` y `postHistory`;
  - `toggleFavorite` devuelve la lista nueva.

  Verificar: `pnpm run check-types` y los tests existentes.
- [x] 3.2 Crear `src/quickPick/CommandSearch.ts` (D3) y registrar el comando en `extension.ts`. Añadir `searchEntries(query)` a `DevCommandsApi` (D5). Los textos `l10n` en los 10 bundles (D4). Verificar: `pnpm run check-types`, `pnpm run lint` y `pnpm run test:unit` (tests de i18n).

## 4. Integración

- [x] 4.1 Tests en `src/test/extension.test.ts` (D6):
  - comando registrado;
  - grupos con el cuadro vacío, con la sección pnpm primero;
  - búsqueda de "status".

  Verificar: `pnpm run verify`.

## 5. Documentación

- [x] 5.1 Documentación:
  - **README:** "Search from the Command Palette", con cómo asignarle un atajo;
  - **CHANGELOG:** en `[Unreleased]` → Added;
  - **ROADMAP:** 2.8 ✅ y el checkbox.

## 6. Comprobación manual

- [x] 6.1 F5 en Windows. Herramientas:
  - la ventana de F5 (Extension Development Host): la ventana de VS Code que abre F5 con la extensión cargada desde el código;
  - la **paleta de comandos** (`Ctrl+Shift+P`), el buscador de comandos de VS Code;
  - la **barra de estado**, la franja inferior de la ventana de VS Code.

  Comprobar:
  - **Sin panel:** con la vista DevCommands cerrada, "DevCommands: Buscar comandos" abre el buscador y la vista sigue cerrada.
  - **Grupos:** con el cuadro vacío aparecen los separadores Favoritos, Recientes, las categorías del proyecto y el resto.
  - **Búsqueda:** "status" encuentra "Ver estado". El orden es el del panel, o se anota cualquier diferencia que provoque VS Code. Con "zzzz" se ve el mensaje de sin resultados.
  - **Enter:** escribe el comando sin ejecutarlo. Uno con parámetro pide el valor. Una entrada de "Recientes" usa su valor.
  - **Copiar:** el botón copia, la barra de estado lo confirma y el buscador sigue abierto.
  - **Favorito:** el botón rellena la estrella sin cerrar el buscador. Con el panel abierto, aparece en su tarjeta "Favoritos".
  - **Destructivo:** Enter sobre uno destructivo muestra la confirmación, y cancelarla no escribe nada.

## 7. Cierre

- [x] 7.1 Dejar en verde `pnpm run verify` y `openspec validate quick-pick --strict`. Archivar el change antes de abrir el PR a `develop`.
