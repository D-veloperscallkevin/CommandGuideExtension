# Tasks

## 1. Protocolo

- [x] 1.1 Añadir `copyToClipboard` a `WebviewMessage` (con su validador en `webviewMessageFields`) y `copied` a `ExtensionMessage` (D1). Tests en `protocol.test.ts`:
  - acepta `copyToClipboard` con un id válido;
  - rechaza `commandId` ausente, numérico, `null`, vacío o de 201 caracteres;
  - rechaza la clave extra `text`;
  - los casos de `ready` y `sendToTerminal` siguen pasando.

  Verificar con `pnpm run test:unit`

## 2. Portapapeles

- [x] 2.1 Crear `src/clipboard/ClipboardService.ts` (D2) y `test/unit/clipboard/ClipboardService.test.ts` con un portapapeles falso:
  - copia el texto exacto y devuelve `true`;
  - si `writeText` rechaza, devuelve `false` sin lanzar.

  Añadir `src/clipboard` al `include` de `test/unit/tsconfig.json`. Verificar con `pnpm run test:unit`
- [x] 2.2 En `CommandsViewProvider` (D3):
  - extraer `commandText(commandId)` y usarlo en `sendToTerminal`;
  - añadir `copyToClipboard(commandId)`, público;
  - atender el mensaje y responder con `copied` solo si la copia funcionó;
  - `activate` crea `ClipboardService(vscode.env.clipboard)`, y la API de pruebas expone `copyToClipboard`.

  Tests de integración en `extension.test.ts`:
  - `api.copyToClipboard('git.status')` devuelve `true` y `vscode.env.clipboard.readText()` es `git status`;
  - con `'git.nope'` devuelve `false` y el portapapeles conserva un valor centinela escrito antes;
  - la copia no abre ninguna terminal.

  Los tests de terminal siguen en verde. Verificar con `pnpm run check-types`, `pnpm run lint` y `pnpm test`

## 3. Webview

- [x] 3.1 Añadir en `CommandList.tsx` el botón hermano `.command-copy` (D4):
  - `tabIndex -1`, `aria-label`, y un `title` con el atajo según la plataforma;
  - visible con hover o `focus-within`;
  - al hacer clic, envía `copyToClipboard` sin mover el foco.

  Añadir también el atajo `Ctrl+C`/`Cmd+C` en el botón principal, que respeta la selección y lleva `aria-keyshortcuts` (D5). Añadir `copyCommand` y `copied` en los 11 idiomas (D7) y los estilos (`.command-item`, `.command-copy`, `padding-inline-end` del encabezado, `.visually-hidden`). Verificar con `pnpm run test:unit` (diccionarios), `pnpm run lint:webview` y `pnpm run build:webview`
- [x] 3.2 Confirmación (D6):
  - `App.tsx` atiende `copied` y guarda `{ commandId, seq }` durante 2000 ms, reiniciando el temporizador si llega otra copia;
  - el botón de esa fila muestra el icono ✓;
  - `CategoryScreen` lo pasa a `CommandList`, que muestra el icono `check` en esa fila y pone `t('copied')` en la región viva, siempre presente en el DOM.

  Verificar con `pnpm run lint:webview` y `pnpm run build:webview`

## 4. Verificación manual (F5)

- [x] 4.1 Con F5, en Windows con PowerShell:
  - al pasar el ratón por "Show status" aparece el botón de copiar con el tooltip "Copy command (Ctrl+C)"; al pulsarlo, el portapapeles contiene `git status` (pegarlo en el editor), el icono cambia a ✓ unos 2 segundos y la terminal no cambia;
  - con el foco en "Create a branch", `Ctrl+C` copia `git checkout -b feature/my-change` y el foco no se mueve;
  - Tab desde un comando sale de la lista sin pasar por el botón de copiar;
  - si hay texto seleccionado en una descripción, `Ctrl+C` copia esa selección;
  - clic, Enter y Espacio en el botón principal siguen enviando el comando a la terminal;
  - en español, el tooltip dice "Copiar comando (Ctrl+C)", y, con el Narrador, se anuncia "Copiado" en cada copia (también al copiar dos veces seguidas).

  El autor confirma. En bash, la copia queda cubierta por el test de integración en WSL antes de la release

## 5. Documentación

- [x] 5.1 Actualizar:
  - `CHANGELOG.md`: en `[Unreleased]` → Added, el botón de copiar y `Ctrl+C`, que copian el comando sin enviarlo a la terminal;
  - `README.md`: en Usage, copiar con el botón o con `Ctrl+C`/`Cmd+C`;
  - `docs/ROADMAP.md`: 1.5 ✅ y su casilla en Siguientes pasos.

  Verificar con grep

## 6. Verificación final

- [x] 6.1 `pnpm run verify` en verde, `openspec validate copy-to-clipboard --strict` sin errores y `/opsx:archive` antes de abrir el PR a `develop`
