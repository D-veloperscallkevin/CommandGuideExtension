## Why

Al probar el `.vsix` de la 2.9 con Claude Code abierto en la terminal activa, el comando elegido se escribió dentro de Claude Code y no en un shell. `TerminalService` siempre escribe en `window.activeTerminal`, aunque esa terminal esté ocupada con un programa (Claude Code, `pnpm dev`, un `python` interactivo…), y ese programa se queda con el texto. Hay que resolverlo antes de publicar la v1.0.0.

Fase del roadmap: **Fase 2 (v1)**, change 2.10, antes del release v1.0.0.

## What Changes

- La extensión lleva la cuenta de qué terminales están ocupadas:
  - Una terminal está ocupada si tiene un comando del shell empezado y sin terminar, según los eventos de la integración del shell (`onDidStartTerminalShellExecution` y `onDidEndTerminalShellExecution`).
  - También está ocupada si VS Code detecta en ella un programa y no un shell (`state.shell` = `node`, `python` o `julia`).
  - También está ocupada si no se creó con un shell: su ejecutable no es un shell conocido, o es una pseudoterminal de otra extensión.
- **Elección de la terminal:**
  - Si la terminal activa está libre, se usa, igual que hoy.
  - Si está ocupada, se usa la terminal libre que tuvo el foco más recientemente.
  - Si no hay ninguna libre, se crea "DevCommands".
  - No se muestra ningún aviso: la terminal elegida recibe el foco, y así se ve dónde quedó el comando.
- El shell de destino ("Ejemplos para", ejemplos y escapado de parámetros) usa esa misma terminal. Se recalcula también cuando un comando empieza o termina, o cuando se cierra una terminal.
- La extensión se activa también al terminar el arranque de VS Code (`onStartupFinished`). Así ve los programas que se lanzan antes de abrir la vista de DevCommands.
- Sigue sin ejecutarse nada: el texto se escribe con `sendText(texto, false)`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `terminal-integration`: el requisito "Elección de la terminal y foco" tiene en cuenta las terminales ocupadas. Si la activa está ocupada, se escribe en la última terminal libre usada o en una nueva "DevCommands".
- `shell-detection`:
  - "Shell de la terminal de destino" usa la misma terminal que el envío, que ya no es siempre la activa.
  - "Shell de destino al día" también se recalcula cuando una terminal pasa de libre a ocupada o al revés.
- `sidebar-view`: el requisito "Activación perezosa" pasa de "solo al abrir la vista o un comando" a "al terminar el arranque de VS Code". El webview sigue sin crearse hasta que se abre la vista.

## Impact

- **Código nuevo:** `src/terminal/TerminalActivity.ts`, que lleva el registro de terminales ocupadas y el orden de uso y contiene la función pura `pickTarget()`.
- **Código modificado:**
  - `src/terminal/TerminalService.ts` y `src/terminal/TargetShell.ts`: reciben el destino de `TerminalActivity`.
  - `src/test/extension.test.ts`: el test de activación refleja `onStartupFinished`.
  - `src/extension.ts`: conecta `TerminalActivity`.
  - `package.json`: añade `activationEvents: ["onStartupFinished"]`.
- **Tests:**
  - Nuevo `test/unit/terminal/TerminalActivity.test.ts`.
  - Casos nuevos en `TerminalService.test.ts` y `TargetShell.test.ts`.
- **API de VS Code:** solo API estable de 1.99, ya disponible desde 1.93. No hay dependencias nuevas.
- **Mensajes webview↔extensión:** sin cambios. La vista recibe el catálogo con el nuevo shell por el mismo mensaje de siempre.
- **Límite conocido:** en `cmd.exe` no hay integración del shell, así que un programa lanzado ahí solo se detecta si VS Code informa de él en `state.shell`.
