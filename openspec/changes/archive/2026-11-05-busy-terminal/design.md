## Context

- `TerminalService.write()` y `TargetShell.current()` usan cada uno `window.activeTerminal` por su cuenta. Ninguno sabe si la terminal está ocupada.
- Las dos clases evitan importar `vscode`: reciben interfaces mínimas, que `vscode.window` cumple tal cual, y se testean con Vitest.
- La extensión se activa hoy solo al abrir la vista (`onView:devcommands.commands`, implícito). El `activationEvents` del manifiesto está vacío.
- VS Code 1.99 (el mínimo del proyecto) ofrece en API estable:
  - `window.terminals`, `onDidChangeActiveTerminal`, `onDidCloseTerminal` y `onDidChangeTerminalState` (`state.shell`, que puede valer `node`, `python` o `julia`);
  - `onDidStartTerminalShellExecution` y `onDidEndTerminalShellExecution` (desde 1.93), que llevan `terminal` y `execution`.
  - No existe una API para preguntar si una terminal ejecuta algo *ahora*: solo los eventos.

## Goals / Non-Goals

**Goals:**
- Una única fuente que decida la terminal de destino, usada por el envío y por el shell de destino, para que nunca discrepen.
- Lógica pura y testeable sin `vscode`.
- Coste despreciable: unos pocos listeners y un `Map`.

**Non-Goals:**
- Detectar programas en `cmd.exe` u otros shells sin integración, salvo lo que VS Code ya informa en `state.shell`.
- Ajustes nuevos para desactivar el comportamiento, o un aviso al usuario (decidido: sin aviso).
- Cambiar los mensajes webview↔extensión: la vista sigue recibiendo el catálogo por el mismo mensaje cuando cambia el shell.

## Decisions

### 1. `TerminalActivity` como fuente única

Nueva clase `src/terminal/TerminalActivity.ts` que recibe un `ActivityWindow` mínimo. Usa estos miembros de `vscode.window`:
- `activeTerminal` y `terminals`;
- `onDidChangeActiveTerminal`, `onDidCloseTerminal` y `onDidChangeTerminalState`;
- `onDidStartTerminalShellExecution` y `onDidEndTerminalShellExecution`.

Lleva dos registros:
- **`running: Map<terminal, execution>`.** El inicio de una ejecución la guarda. Su fin la borra, solo si es la misma ejecución. El cierre de la terminal también la borra.
  - Un inicio nuevo en la misma terminal sustituye al anterior: un shell solo ejecuta un comando desde su prompt. Así, un fin perdido no deja la terminal ocupada para siempre.
- **`recent: terminal[]`.** Las terminales por orden de foco, la más reciente al final. Se actualiza con `onDidChangeActiveTerminal` y se limpia con `onDidCloseTerminal`. Al crearse, se inicia con `window.terminals` y la activa al final.

Expone:
- `isBusy(terminal)`.
- `target()`: la terminal de destino o `undefined` si hay que crear una.
- `onDidChange(listener)`: avisa cuando cambia algo que puede mover el destino (inicio, fin, cierre, cambio de foco o de `state.shell`).

Se descartó guardar el estado ocupado dentro de `TerminalService` porque `TargetShell` también lo necesita. Dos copias podrían discrepar.

### 2. Reglas puras en funciones exportadas

- **`isProgramTerminal(terminal)`:** es `true` si:
  - `state.shell` es `node`, `python` o `julia`;
  - `creationOptions` tiene `pty` (pseudoterminal de otra extensión);
  - o `creationOptions.shellPath` existe y su nombre, sin carpeta, sin `.exe` y en minúsculas, no es un shell conocido. Los shells conocidos son los que traduce `shellIdFromName()` más `fish`, `nu`, `csh`, `tcsh` y `xonsh`, que son shells aunque el catálogo no los cubra. La lista vive en `shell.ts`, junto a la traducción.
- **`pickTarget({ active, recent, terminals, isBusy })`:** devuelve la primera terminal libre de esta lista:
  - `active`;
  - `recent`, de la más reciente a la más antigua;
  - el resto de `terminals`, de la última a la primera.

  Si ninguna está libre, devuelve `undefined`.

  Las terminales que nunca tuvieron foco (por ejemplo, abiertas antes de activarse la extensión y no tocadas desde entonces) siguen siendo candidatas, después de las usadas.

### 3. `TerminalService` y `TargetShell` reciben el destino

- **`TerminalService(host, target)`:**
  - `target` es `() => TerminalLike | undefined`, en la extensión `() => activity.target()`.
  - `TerminalHost` deja de usar `activeTerminal`.
  - La espera del shell listo solo se aplica a la terminal recién creada, como ahora.
- **`TargetShell(window, env, platform, activity)`:**
  - `current()` usa `activity.target()` en lugar de `window.activeTerminal`.
  - `refresh()` también se suscribe a `activity.onDidChange`.
  - El filtro de `onDidChangeTerminalState` compara con la terminal de destino.

Se descartó que `TerminalService` reciba la clase entera: con una función basta y los tests siguen siendo triviales.

### 4. Activación con `onStartupFinished`

Para ver un `claude` o un `pnpm dev` lanzado antes de abrir la vista, los listeners tienen que existir desde el principio. `onStartupFinished` activa la extensión después del arranque de VS Code, sin retrasarlo.

La activación ya es ligera:
- crea servicios y registra listeners;
- la detección del proyecto comprueba unos pocos archivos por carpeta del workspace y crea sus watchers, el mismo coste que hoy al abrir la vista;
- el webview no se crea hasta que se abre la vista.

Esto contradice el requisito "Activación perezosa" de `sidebar-view` ("MUST NOT activarse al arrancar VS Code"). El autor eligió modificarlo (delta en `specs/sidebar-view`). El test de integración que comprueba que la extensión no está activa antes de abrir la vista se sustituye por uno que comprueba que se activa tras el arranque sin crear el webview.

Se descartó mantener solo `onView`: el escenario que motivó el change, Claude Code abierto antes que la vista, seguiría fallando cuando VS Code no detecta `node` en `state.shell`.

## Risks / Trade-offs

- **Shells sin integración** (cmd, terminales con la integración desactivada): un programa lanzado ahí no se detecta → mitigación parcial con `state.shell`, y el límite queda documentado en el README.
- **Fin de ejecución que no llega** (por ejemplo, con `exec`) → la terminal se libera al empezar otro comando en ella o al cerrarla.
- **Comandos lanzados antes de activar la extensión** (VS Code recién abierto, en el arranque) → se pierden, salvo que `state.shell` los delate; con `onStartupFinished` esa ventana es de segundos.
- **Un `ssh` o un `bash` anidado cuenta como ocupado** porque es una ejecución sin terminar, aunque el usuario esté en un prompt → es preferible escribir en otra terminal libre que en un shell remoto por error. Si no hay otra libre, se crea "DevCommands".
- **Activar la extensión siempre** cuesta unos milisegundos tras el arranque aunque el usuario no abra la vista → aceptable y medible con el test de activación existente.

## Migration Plan

No hay datos ni ajustes que migrar. Para volver atrás basta con revertir el commit; no deja estado persistente.
