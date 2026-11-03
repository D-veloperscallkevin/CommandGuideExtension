## 1. Almacén, valores y protocolo (extensión)

- [x] 1.1 Exportar `basicValueError(value)` de `src/params/escape.ts` (la parte de `validateValue` que no depende del shell: control, vacío y longitud) y usarla dentro de `validateValue`, sin cambiar su comportamiento. Verificar: `pnpm run test:unit`, con los tests de escape existentes en verde.
- [x] 1.2 Crear `src/history/HistoryStore.ts` (D1) e incluir `src/history/**` en `test/unit/tsconfig.json`. Tests en `test/unit/history/HistoryStore.test.ts` con un `Memento` falso, un `paramsOf` fijo y un `newId` con contador:
  - `list()` sin nada guardado y con valores corruptos (`42`, entradas sin `id`, `values` que no es objeto) da `[]` o solo las válidas, sin escribir;
  - omite comandos inexistentes, claves de valores que no coinciden con los parámetros, valores con salto de línea o de más de 500 caracteres, ids repetidos o con caracteres no admitidos;
  - `record` pone la entrada al principio;
  - el mismo comando con los mismos valores conserva el `id` y no duplica;
  - con otros valores son dos entradas;
  - con 20 entradas, la nueva descarta la más antigua;
  - `get` por id y `clear`.

  Verificar: `pnpm run test:unit`.
- [x] 1.3 `ParamPrompter.ask` acepta valores iniciales (D2): `ParamInputBoxOptions` gana `value?: string`. Test en `test/unit/params/ParamPrompter.test.ts`: con valores iniciales, cada cuadro recibe su `value`; sin ellos, no lo recibe. Verificar: `pnpm run test:unit`.
- [x] 1.4 `src/messaging/protocol.ts` (D4):
  - `sendRecent`, `copyRecent` y `clearHistory` en `WebviewMessage`, con el validador `isEntryId`;
  - `history` y `copied.entryId?` en `ExtensionMessage`;
  - tipo `HistoryItem`.

  Tests en `test/unit/messaging/protocol.test.ts`:
  - los tres mensajes válidos;
  - `sendRecent` con `values` de más, sin `entryId`, con `entryId` vacío, de 65 caracteres o con `/`;
  - `clearHistory` con campos de más.

  Verificar: `pnpm run test:unit`.

## 2. Integración en la extensión

- [x] 2.1 `CommandsViewProvider` (D2, D3):
  - `commandText` acepta valores guardados y devuelve los valores usados;
  - `send` privado compartido por `sendToTerminal` y `sendRecent`, que registra tras escribir;
  - `copyToClipboard` acepta valores guardados;
  - `copyRecent` responde `copied` con `entryId`;
  - `clearHistory`;
  - `postHistory` tras `favorites` en `ready`, tras cada cambio y tras cada cambio de shell;
  - `log.warn` con una entrada desconocida;
  - ningún valor en el log.
- [x] 2.2 `extension.ts`:
  - crea `HistoryStore` con `context.globalState`, `paramsOf` desde `catalog.getCommand` y `randomUUID`, sin `setKeysForSync`;
  - la API de tests gana `sendRecent(entryId)`, `clearHistory()` y `onDidSendHistory`.

  Tests de integración en `src/test/extension.test.ts`:
  - borrar emite `[]`;
  - enviar `git.status` emite una primera entrada con `text` `git status`;
  - reenviarla por su clave mantiene una sola entrada con el mismo id;
  - copiar `git.status` no emite `history`;
  - el test termina borrando el historial.

  Verificar: `pnpm run verify`.

## 3. Navegación y textos (webview, lógica pura)

- [x] 3.1 `webview-ui/src/navigation.ts` (D5): pantalla `recent`, `RECENT_CARD_ID`, acción `openRecent`, `back` con el foco en la tarjeta, `parseSavedView` y `resolveView`. Tests en `test/unit/webview/navigation.test.ts`:
  - abrir y volver;
  - foco en una entrada;
  - estado guardado válido e inválido (`{ screen: 'recent', focusCommandId: 3 }`);
  - `resolve` conserva la pantalla y el foco.

  Verificar: `pnpm run test:unit`.
- [x] 3.2 Diccionarios del webview (D7): las cinco claves en `en.ts` y en los otros 10 idiomas. En francés, usar comillas dobles si el texto lleva apóstrofo. Verificar: `pnpm run test:unit`, que incluye el test de claves de los diccionarios.

## 4. Interfaz del webview

- [x] 4.1 `CommandList` (D6):
  - `ListCommand.entryId` y `Copied.entryId`;
  - clave `entryId ?? id` para el DOM, React, el foco y el ✓;
  - con `entryId`, enviar `sendRecent` y copiar `copyRecent` (botón y `Ctrl+C`);
  - la estrella sigue con `commandId`.
- [x] 4.2 Tarjeta y pantalla (D6):
  - `CategoryList` muestra "Recientes" (icono `history`) tras "Favoritos" si hay historial;
  - nuevo `RecentScreen.tsx`, con el orden congelado, los textos en vivo, el botón "Borrar historial" con el foco al título al vaciarse y el estado vacío;
  - `App` guarda `history`, espera a recibirlo antes de mostrar la vista y pinta la pantalla.

  Verificar: `pnpm run verify` (incluye el lint del webview).
- [x] 4.3 Documentación:
  - CHANGELOG, en `[Unreleased]` → Added: "Recientes" con los últimos 20 comandos enviados y sus valores, reenvío y copia sin volver a escribirlos y "Borrar historial";
  - README: paso de uso de "Recientes" y una nota de privacidad (los valores se guardan solo en este equipo);
  - ROADMAP: 2.5 ✅.

## 5. Comprobación manual

- [x] 5.1 F5 en Windows. Herramientas: la ventana de F5 (Extension Development Host) y **Narrador**, el lector de pantalla de Windows, que se activa y desactiva con `Ctrl+Win+Enter`. Comprobar:
  - **Registro:** con PowerShell como terminal, enviar `git.status` y `git.new-branch` con `fix/login`; al volver aparece "Recientes" con "2 comandos" tras "Favoritos" (o primera, sin favoritos).
  - **Pantalla:** primero `git checkout -b fix/login` y después `git status`, cada uno con "Git".
  - **Reenvío:** enviar `git.new-branch` desde Recientes escribe el comando sin pedir el valor y no lo ejecuta; el orden de la pantalla no cambia hasta salir y volver a entrar.
  - **Cancelado y copiado:** cancelar el cuadro de un comando con parámetros y copiar otro comando no añaden entradas.
  - **Cambio de shell:** con `terminal.make-directory` y `mi carpeta` en el historial, cambiar a una terminal Git Bash; el texto pasa de `New-Item -ItemType Directory -Force 'mi carpeta'` a `mkdir -p 'mi carpeta'`.
  - **Valor no válido:** enviar `git.commit` con `say "hi"` desde Git Bash y cambiar a PowerShell; la entrada muestra `git commit -m "say "hi""` con el aviso "No es válido en PowerShell…". Al reenviarlo aparece el cuadro con el valor y su error.
    - Primera prueba: la entrada mostraba el ejemplo del catálogo ("fix: error del login") sin aviso y parecía otro commit. Corregido: valor sin escapar y aviso (D3, D6).
  - **Destructivo:** reenviar `terminal.remove-directory` pide la confirmación.
  - **Copiar:** copiar una entrada muestra ✓ solo en esa entrada.
  - **Persistencia:** `Developer: Reload Window` conserva el historial y la pantalla abierta.
  - **Borrar historial:** muestra el estado vacío, el foco va al título y al volver la tarjeta ya no está; los favoritos siguen.
  - **Narrador:** anuncia "Recientes" como una entrada más de la lista de categorías y el botón "Borrar historial".

## 6. Cierre

- [x] 6.1 Dejar en verde `pnpm run verify` y `openspec validate recent-history --strict`. Hacer `/opsx:archive` antes de abrir el PR a `develop`.
