## Context

- **Búsqueda compartida:** `src/catalog/search.ts` no tiene imports.
  - `search(items, query)` filtra por `searchText` y ordena primero los que tienen todas las palabras en el título;
  - el webview lo usa sobre los `CommandSummary` de `catalog`;
  - `buildCategorySummaries(categories, locale, shell)` ya construye títulos, descripciones, ejemplos y `searchText` en el idioma activo.
- **Flujos del provider:** `CommandsViewProvider` ya tiene `sendToTerminal(id)`, `sendRecent(entryId)`, `copyToClipboard(id)`, `copyRecent(entryId)` y `toggleFavorite(id)`.
  - Piden los valores con `ParamPrompter`, confirman con `RiskConfirmer`, registran en el historial y reenvían `favorites` e `history` al webview si está listo.
  - Los tests de integración los usan a través de `DevCommandsApi`.
- **Historial para mostrar:** `historyItem(entry, locale, shell)` produce `HistoryItem { id, commandId, text, needsInput }`, con el texto de los valores o el aviso.
- **Proyecto:** `ProjectDetector.current()` da las categorías detectadas, y `postCatalog` ya las filtra y ordena.
- **Activación:** VS Code activa la extensión con cualquier comando contribuido (`onCommand` implícito), y `sidebar-view` ya lo permite. El provider se crea en `activate`, así que existe aunque la vista no se haya resuelto.
- **Textos:** los del webview están en sus diccionarios. Los de la extensión van por `vscode.l10n.t` con bundles en 10 idiomas, y un test exige que todas las claves estén traducidas.

## Goals / Non-Goals

**Goals:**
- Reutilizar los flujos de envío, copia, favoritos e historial sin duplicar su lógica.
- Que el buscador y el panel encuentren lo mismo para la misma búsqueda.
- Que la lógica de los elementos se pueda probar sin `vscode`.

**Non-Goals:**
- Atajo de teclado por defecto.
- Acciones de la vista dentro del buscador, como borrar el historial o abrir una categoría.
- Seleccionar varios comandos a la vez.

## Decisions

### D1. Modelo puro en `src/quickPick/items.ts`
```ts
type SearchEntry =
  | { kind: 'separator'; label: string }
  | { kind: 'command'; key: string; commandId: string; entryId?: string;
      title: string; category: string; description: string; text: string;
      needsInput?: string; favorite: boolean };
interface SearchSnapshot {
  categories: readonly CategorySummary[];
  favorites: readonly string[];
  history: readonly HistoryItem[];
  detected: readonly string[];
}
function searchEntries(snapshot, query, labels: { favorites: string; recent: string; needsInput: (shell) => string }): SearchEntry[]
```
- **Cuadro vacío:** los grupos de la spec. `key` es `fav:<id>`, `recent:<entryId>` o `cmd:<id>`, para que VS Code no confunda elementos repetidos.
- **Con texto:** `search()` sobre los comandos aplanados en el orden del catálogo, sin separadores ni duplicados.
- **Favoritos y recientes:** se ignoran los que ya no están en `categories`. El texto de una entrada de "Recientes" es `HistoryItem.text`.

Al no depender de `vscode`, se prueba con Vitest.

### D2. Lo que el provider expone
- `searchSnapshot(): SearchSnapshot` devuelve los mismos datos que se envían al webview:
  - `buildCategorySummaries` con el idioma y el shell actuales;
  - los favoritos de `favorites.list()`;
  - el historial con `historyItem`;
  - las categorías detectadas, filtradas como en `postCatalog`.
  
  Para no duplicar código, `postCatalog` y `postHistory` lo usan.
- El buscador llama a los métodos públicos que ya existen: `sendToTerminal`, `sendRecent`, `copyToClipboard`, `copyRecent` y `toggleFavorite`.
- Hay que cambiar `toggleFavorite` para que devuelva la lista nueva, o `undefined`. Así el buscador repinta la estrella sin pedir otro snapshot.
- `copyToClipboard` ya devuelve si copió.

**Alternativa descartada:** que el buscador reconstruya los textos por su cuenta. Duplicaría `historyItem` y la resolución del idioma y del shell.

### D3. `CommandSearch` en `src/quickPick/CommandSearch.ts`
- `vscode.window.createQuickPick<Item>()`, donde `Item` es un `QuickPickItem` que guarda su `SearchEntry`:
  - `title` con el texto de "Buscar comandos" y `placeholder` con un texto de ayuda;
  - `matchOnDescription` y `matchOnDetail` en `false`;
  - `keepScrollPosition` en `true` al repintar tras un favorito.
- **Mapeo de los elementos:**
  - `label` es el título;
  - `description` es la categoría;
  - `detail` es el ejemplo, seguido de la descripción del comando con `' — '`; si tiene `needsInput`, en su lugar va el ejemplo seguido del aviso;
  - los separadores usan `kind: QuickPickItemKind.Separator`.
- **Filtro propio:** `onDidChangeValue` recalcula `items` con `searchEntries(snapshot, value)`, y cada elemento lleva `alwaysShow: true` para que VS Code no lo oculte con su filtro difuso.
  - VS Code puede resaltar las letras que coinciden con el label, pero no quita elementos.
  - El orden puede verse alterado si VS Code reordena por coincidencia del label. Se comprueba en F5 (ver Risks).
- **Botones:**
  - copiar: `ThemeIcon('copy')`;
  - favorito: `ThemeIcon('star-full')` o `ThemeIcon('star-empty')`;
  - tooltips: "Copiar comando", "Añadir a favoritos" y "Quitar de favoritos".
- **Eventos:**
  - **`onDidAccept`:** toma el elemento activo, llama a `hide()` y después a `sendRecent(entryId)` o `sendToTerminal(commandId)`.
  - **`onDidTriggerItemButton` con copiar:** llama a `copyRecent` o a `copyToClipboard`. Si copió, muestra `window.setStatusBarMessage` con el texto "Copiado: {título}" durante 3 s. Si hubo que pedir valores o confirmar, el cuadro de VS Code reemplaza al buscador, y es lo esperado.
  - **`onDidTriggerItemButton` con favorito:** `await toggleFavorite`, actualiza `snapshot.favorites` y repinta conservando el valor y el elemento activo.
  - **`onDidHide`:** llama a `dispose()`.
- **Sin resultados:** con `items = []` VS Code muestra su propio mensaje de "sin resultados" en su idioma. Si en F5 no aparece, se usa `placeholder` con el texto de "Ningún comando coincide" (ver Risks).

### D4. Manifiesto y textos
- **`package.json`:** `contributes.commands` añade `{ command: 'devcommands.searchCommands', title: '%command.searchCommands%', category: 'DevCommands' }`. No hace falta `activationEvents`.
- **`package.nls*.json`:** `command.searchCommands` en los 11 idiomas.
- **`l10n`:** el título, el placeholder, "Favoritos", "Recientes", "Copiar comando", "Añadir a favoritos", "Quitar de favoritos", "Copiado: {0}", el aviso de `needsInput` ("No es válido en {0}: se pedirá el valor") y el texto de sin resultados, en 10 idiomas.

### D5. Registro
`extension.ts` registra `devcommands.searchCommands`, que llama a `showCommandSearch(provider, log)`. `DevCommandsApi` gana `searchEntries(query)`, que devuelve el modelo de D1 con los datos actuales, para que los tests de integración comprueben grupos y búsqueda sin manejar la interfaz del QuickPick.

### D6. Pruebas
- **Unitarias (`test/unit/quickPick/items.test.ts`):**
  - el orden de los grupos;
  - los grupos vacíos omitidos;
  - los favoritos y recientes de comandos inexistentes ignorados;
  - las categorías detectadas antes que el resto;
  - las claves únicas;
  - con texto: el mismo orden que `search` y sin separadores ni duplicados;
  - solo espacios equivale al cuadro vacío;
  - `needsInput`;
  - la marca `favorite`.
- **Integración:**
  - `devcommands.searchCommands` está registrado (`vscode.commands.getCommands`);
  - `searchEntries('')` empieza por una sección de proyecto (`pnpm`, por la carpeta de prueba);
  - `searchEntries('status')` incluye `git.status`.

  Enviar y copiar ya tienen tests que reutilizan los mismos métodos.

## Risks / Trade-offs

- **[Orden de VS Code]**
  - **Riesgo:** con `alwaysShow`, VS Code muestra todos los elementos, pero puede reordenar los que coinciden por label. El resultado coincide con nuestra regla de "título primero", pero el orden dentro de cada grupo podría variar.
  - **Mitigación:** se comprueba en F5. Si molesta, se elimina el resaltado (label sin coincidencias), y no hay API estable para desactivar del todo el orden propio de VS Code.
- **[Mensaje de sin resultados]**
  - **Riesgo:** el mensaje propio de VS Code podría no aparecer con `items` vacío.
  - **Mitigación:** cambiar el `placeholder`, comprobado en F5.
- **[Cuadros encadenados]**
  - **Riesgo:** al copiar un comando con parámetros, el cuadro del valor cierra el buscador.
  - **Mitigación:** es el comportamiento de VS Code (un solo QuickInput a la vez), y la spec lo contempla.
