## Context

- **Envío actual:** `CommandsViewProvider.commandText(id, action)` construye el texto. Si el comando tiene parámetros, pide los valores con `ParamPrompter.ask` y los escapa con `buildCommandText`; si es destructivo, confirma con `RiskConfirmer`. `sendToTerminal` escribe con `TerminalService.write` y registra solo el `commandId`. Los valores no salen de `commandText`.
- **Favoritos (2.4):** ya existe el patrón que se reutiliza aquí:
  - `FavoritesStore` sobre un `Memento` mínimo, probado con Vitest;
  - el mensaje `favorites` tras `ready` y tras cada cambio;
  - la tarjeta `@favorites`, la pantalla `FavoritesScreen` con la lista congelada y la estrella en `CommandList`.
- **`CommandList`:** identifica cada elemento por `command.id`, que sirve para el id del DOM, el foco guardado y el ✓ de copiado. En el historial, el mismo comando puede aparecer varias veces con valores distintos.
- **Validación de valores:** `validateValue(value, shell)` depende del shell. `cmd` rechaza `"` y `%`, y PowerShell rechaza `"`. Un valor aceptado en bash puede no valer en PowerShell.
- **Cambio de shell:** el proveedor reenvía `catalog` al webview listo cuando cambia el shell de destino.

## Goals / Non-Goals

**Goals:**
- Reenviar un comando reciente con sus valores en un clic, con el texto correcto para el shell del momento.
- Que el webview nunca pueda inyectar valores ni texto: solo elige una entrada por su clave.
- Reutilizar `CommandList`, la navegación y el patrón de favoritos sin duplicar lógica.

**Non-Goals:**
- Historial por proyecto o sincronizado entre equipos.
- Borrar entradas sueltas, buscar dentro del historial o fijar entradas (para eso están los favoritos).
- Rellenar los cuadros de un envío normal con los últimos valores usados.
- Registrar los comandos copiados.

## Decisions

### D1. `HistoryStore` en la extensión
`src/history/HistoryStore.ts` no importa `vscode`. Recibe:
- el mismo `Memento` mínimo que favoritos (renombrado a un tipo compartido o duplicado, de dos métodos);
- `paramsOf(commandId): readonly string[] | undefined`: los nombres de los parámetros del comando, o `undefined` si no existe en el catálogo;
- `newId(): string`: en la extensión, `randomUUID()` de `node:crypto`. No añade dependencias.

Clave: `history`, sin `setKeysForSync`. Formato guardado: `[{ id, commandId, values: { [param]: string } }]`, JSON plano. Máximo de 20 entradas (`MAX_HISTORY = 20`).

Métodos:
- `list(): HistoryEntry[]`: lee la lista sin escribir. Omite:
  - lo que no tenga la forma esperada;
  - los ids repetidos o que no cumplan `^[A-Za-z0-9-]{1,64}$`;
  - los comandos que no existan;
  - los `values` cuyas claves no sean exactamente las de `paramsOf`;
  - los valores no válidos para cualquier shell: vacíos, de más de `MAX_VALUE_LENGTH` o con caracteres de control. Para esto se exporta de `escape.ts` la parte común de `validateValue` como `basicValueError(value)`.
  - Después recorta a 20.
- `get(entryId)`: la entrada de `list()` con ese id, o `undefined`.
- `record(commandId, values: ReadonlyMap<string, string>): Promise<HistoryEntry[]>`:
  - si ya hay una entrada con el mismo comando y los mismos valores, la quita y conserva su `id`; si no, usa `newId()`;
  - pone la entrada al principio, recorta a 20, guarda y devuelve la lista.
  - Así una entrada reenviada mantiene su clave y el foco del webview no la pierde.
- `clear(): Promise<void>`: guarda `[]`.

Alternativas descartadas:
- **Guardar el texto final:** no se podría reescapar para otro shell, y un texto de bash enviado a PowerShell podría ejecutar algo distinto.
- **Usar el índice como clave:** cambia con cada envío, así que un mensaje en vuelo podría reenviar otra entrada.

### D2. Valores guardados y validez por shell
`commandText(commandId, action, stored?)` acepta los valores guardados:
- **Sin `stored`:** el comportamiento actual.
- **Con `stored`, todos válidos para el shell actual** (`validateValue`): se usan directamente, sin cuadros.
- **Con `stored` y algún valor no válido:** se llama a `params.ask(command, locale, shell, stored)`. `ParamPrompter.ask` acepta un cuarto argumento opcional con valores iniciales, que pasa a `showInputBox` como `value` (`ParamInputBoxOptions` gana `value?: string`). El cuadro muestra el valor con su error de validación y el usuario lo corrige.

El resultado `text` gana `values: ReadonlyMap<string, string>`, que son los valores realmente usados. Después, la confirmación de riesgo es la de siempre.

### D3. Proveedor
- **Envío:** `sendToTerminal(commandId)` y el nuevo `sendRecent(entryId)` comparten un `send(commandId, stored?)` privado. Tras `terminal.write` correcto, llama a `history.record(commandId, values)` y a `postHistory`. Si `write` falla, no registra.
- **`sendRecent` y `copyRecent`:** buscan la entrada con `history.get`. Si no existe, registran `log.warn('Entrada del historial desconocida…')` y no hacen nada más. Si existe, siguen con el `commandId` y los `values` de la entrada.
- **`copyRecent`:** usa `copyToClipboard(commandId, stored?)` y, si copia, responde `copied { commandId, entryId }`. No registra en el historial.
- **`clearHistory`:** llama a `history.clear()` y después a `postHistory`.
- **`postHistory(webview)`:** construye `entries: { id, commandId, text, needsInput }[]` con el shell actual. Usa `buildCommandText` si todos los valores son válidos para ese shell. Si alguno no lo es, usa `buildDisplayText` (nuevo en `CatalogService`: la plantilla con los valores tal cual, sin escapar) y `needsInput: true`. Ese texto solo se muestra: enviar o copiar siempre pasa por `commandText`, que pide los valores.

  En la prueba con F5, la primera versión mostraba en ese caso el ejemplo del catálogo ("fix: error del login"), que parecía un commit enviado por el usuario y no avisaba de que se pediría el valor. Dispara `onDidSendHistory`. Se llama:
  - tras `postFavorites` en `ready`;
  - tras cada `record` y `clear`;
  - en el manejador del cambio de shell, después de `postCatalog`.
- **Log:** solo `commandId` y número de entradas, nunca valores.

### D4. Protocolo
Mensajes del webview a la extensión:
- `{ type: 'sendRecent'; entryId }` y `{ type: 'copyRecent'; entryId }`, con el validador `isEntryId`: string que cumple `^[A-Za-z0-9-]{1,64}$`;
- `{ type: 'clearHistory' }`, con solo el campo `type`.

Mensajes de la extensión al webview:
- `{ type: 'history'; entries: readonly HistoryItem[] }`, con `HistoryItem = { id, commandId, text, needsInput }`;
- `copied` pasa a `{ commandId; entryId?: string }`.

Con la validación existente, un campo de más (por ejemplo `values`) descarta el mensaje.

### D5. Navegación
- `View` gana `{ screen: 'recent'; focusCommandId?: string }`. Aquí `focusCommandId` guarda la clave de la entrada con foco, para reutilizar la acción `focusCommand` y la prop `focusCommandId` de `CommandList`.
- `RECENT_CARD_ID = '@recent'`.
- Acción nueva: `openRecent`. `back` desde `recent` vuelve a `{ screen: 'categories', focusCategoryId: RECENT_CARD_ID }`.
- `parseSavedView` acepta la forma nueva.
- `resolveView` deja `recent` como está, porque la navegación no conoce el historial. Si la entrada con foco ya no existe, `CommandList` enfoca la primera, igual que hoy.

### D6. Webview
- **`App`:**
  - guarda `history: readonly HistoryItem[] | null`; muestra el indicador de carga hasta recibirlo, igual que con `favorites`;
  - pasa `recentCount` y `onOpenRecent` a `CategoryList`;
  - pinta `RecentScreen` en la pantalla `recent`.
- **`CategoryList`:** tras la tarjeta de favoritos, añade una entrada con el icono `history`, el título `t('recent')` y `t('commandCount')` si `recentCount > 0`.
- **`CommandList`:**
  - `ListCommand` gana `entryId?: string`. La clave de cada elemento es `entryId ?? id`, y sirve para el id del DOM, la key de React, el foco y el ✓ de copiado;
  - `Copied` gana `entryId?`. El elemento muestra el ✓ si `(copied.entryId ?? copied.commandId) === clave`;
  - con `entryId`, el clic y Enter envían `sendRecent` y copiar (botón o `Ctrl+C`) envía `copyRecent`. La estrella sigue usando `commandId`.
- **`RecentScreen.tsx`:** sigue la estructura de `FavoritesScreen`:
  - congela al montarse el orden de las claves (`useState(() => ids)`). Muestra las entradas actuales de esas claves en ese orden, así que el texto se actualiza al cambiar el shell y las borradas desaparecen;
  - cada entrada es el `CommandSummary` del catálogo con `example: text`, `categoryTitle` y `entryId`. Si `needsInput`, lleva además `notice: t('needsInput', { shell })`, que `CommandList` pinta bajo el ejemplo con el icono `warning` y añade a `aria-labelledby`;
  - el botón "Borrar historial" envía `clearHistory`. Cuando llega un `history` vacío tras pulsarlo, el foco va al título;
  - sin entradas muestra `t('noRecent')`.

### D7. Textos del webview
Claves nuevas en `en.ts` y en los otros 10 diccionarios:
- `recent`: "Recent";
- `recentLabel`: "Recent commands", el nombre de la lista;
- `noRecent`: "No recent commands yet. Commands you write to the terminal appear here.";
- `clearHistory`: "Clear history";
- `needsInput`: "Not valid in {shell}: you'll be asked for the value when you send it."

### D8. Tests
- **`test/unit/history/HistoryStore.test.ts`**, con un `Memento` falso, un `paramsOf` fijo y un `newId` con contador:
  - lista vacía y valor guardado corrupto;
  - comando inexistente, claves de valores que no coinciden y valor con control o demasiado largo;
  - `record` al principio y con mismos valores (conserva el `id` y no duplica);
  - mismo comando con otros valores (dos entradas);
  - límite de 20;
  - `get` y `clear`.
- **`test/unit/params/ParamPrompter.test.ts`:** con valores iniciales, el cuadro recibe `value`.
- **`test/unit/messaging/protocol.test.ts`:**
  - `sendRecent`, `copyRecent` y `clearHistory` válidos;
  - `sendRecent` con `values` de más y con una clave con caracteres no admitidos o de más de 64;
  - `clearHistory` con campos de más.
- **`test/unit/webview/navigation.test.ts`:**
  - `openRecent` y `back`, con el foco en `@recent`;
  - `focusCommand` en `recent`;
  - `parseSavedView` y `resolveView` con la forma nueva.
- **Integración:** la API expone `sendRecent(entryId)`, `clearHistory()` y `onDidSendHistory`.
  - Borrar emite `[]`.
  - Enviar `git.status` emite una primera entrada con `text` `git status`, y reenviarla por su clave mantiene una sola entrada con el mismo id.
  - Copiar `git.status` no emite `history`.
  - El test termina borrando el historial.

## Risks / Trade-offs

- **[Los valores tecleados quedan guardados en texto plano en el perfil de VS Code]** → Solo en este equipo, sin Settings Sync ni registro. El botón "Borrar historial" los elimina. El usuario eligió guardarlos a cambio de reenviar con un clic.
- **[Un valor válido en un shell no lo es en otro]** → Se piden de nuevo con el valor ya escrito, en vez de enviar un texto mal escapado. Mientras tanto, la entrada muestra el valor sin escapar con un aviso, para que no se confunda con un comando listo para enviar.
- **[Un cambio del catálogo cambia los parámetros de un comando]** → Las entradas cuyas claves no coinciden se omiten al leer y desaparecen en el siguiente guardado.
- **[Borrar el historial no pide confirmación]** → Solo afecta a una lista de comandos recientes que se vuelve a llenar sola. Una confirmación modal añadiría un paso a una acción de bajo coste.
