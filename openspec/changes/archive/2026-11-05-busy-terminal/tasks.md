# Tasks

## 1. Reglas de terminal ocupada y elección del destino

- [x] 1.1 En `src/terminal/shell.ts`, añadir la lista de shells conocidos: los que traduce `shellIdFromName()` más `fish`, `nu`, `csh`, `tcsh` y `xonsh`. Añadir también `isKnownShell(name)`, que acepta nombre o ruta sin distinguir mayúsculas, sin carpeta y sin `.exe`. Verificar con casos nuevos en `test/unit/terminal/shell.test.ts`:
  - `C:\…\pwsh.exe` y `/usr/bin/fish` → `true`;
  - `node` y `claude.exe` → `false`.
- [x] 1.2 Crear `src/terminal/TerminalActivity.ts`, sin importar `vscode`.
  - Funciones puras exportadas:
    - `isProgramTerminal(terminal)`: `state.shell` = `node`, `python` o `julia`; `creationOptions.pty`; o un `shellPath` que no es un shell conocido.
    - `pickTarget({ active, recent, terminals, isBusy })`.
  - Clase `TerminalActivity` (`isBusy`, `target`, `onDidChange` y `dispose`), con los registros `running` y `recent` descritos en design.md.

  Verificar con `test/unit/terminal/TerminalActivity.test.ts`. Usar ventana falsa y eventos falsos, en Windows/PowerShell y en Linux/bash:
  - la activa libre se elige;
  - activa ocupada por una ejecución → la libre más reciente;
  - inicio y fin de la misma ejecución → vuelve a estar libre;
  - un fin de otra ejecución no la libera;
  - un inicio nuevo sustituye al anterior;
  - el cierre de la terminal la borra de `running` y `recent`;
  - `state.shell` = `node` → ocupada;
  - `shellPath` = `node` o `pty` → ocupada;
  - `shellPath` = `wsl.exe` o `fish` → libre;
  - todas ocupadas → `undefined`;
  - terminales sin foco previo, después de las usadas;
  - `onDidChange` se dispara en cada evento relevante;
  - `dispose` da de baja todos los listeners.

## 2. Envío a la terminal

- [x] 2.1 Cambiar `TerminalService`:
  - El constructor pasa a ser `(host, target, readyTimeoutMs?)`, con `target: () => TerminalLike | undefined`.
  - `TerminalHost` deja de usar `activeTerminal`.
  - Escribe en `target()` o, si devuelve `undefined`, en una "DevCommands" nueva tras esperar el shell.
  - Sigue escribiendo con `sendText(texto, false)`, nunca ejecuta nada.

  Verificar adaptando `test/unit/terminal/TerminalService.test.ts` y añadiendo estos casos:
  - el destino no es la activa → se escribe y se muestra ese destino, sin crear otra;
  - destino `undefined` con terminales abiertas → se crea "DevCommands" y espera al shell;
  - el texto llega siempre con `false`.

## 3. Shell de destino

- [x] 3.1 Cambiar `TargetShell`:
  - Recibe `activity` (lo que usa: `target()` y `onDidChange`).
  - `current()` usa `activity.target()`.
  - Se refresca con `activity.onDidChange`.
  - El filtro de `onDidChangeTerminalState` compara con el destino.

  Verificar con casos nuevos en `test/unit/terminal/TargetShell.test.ts`:
  - activa PowerShell ocupada y la libre más reciente es Git Bash → `bash`, y se emite el cambio;
  - el programa termina → vuelve a `powershell`;
  - todas ocupadas → perfil por defecto (`zsh` en Linux);
  - un cambio de ocupación que no mueve el shell no emite nada.

## 4. Integración en la extensión

- [x] 4.1 En `src/extension.ts`:
  - Crear `TerminalActivity(vscode.window)` y registrarlo en `context.subscriptions`.
  - Pasar `() => activity.target()` a `TerminalService` y `activity` a `TargetShell`.
  - Actualizar el comentario de activación.

  Verificar con `pnpm run compile` (tipos) y con que `src/test/extension.test.ts` siga en verde.
- [x] 4.2 En `package.json`, añadir `"activationEvents": ["onStartupFinished"]`. En `src/test/extension.test.ts`, cambiar la aserción "no debe activarse antes de abrir la vista": antes de abrir la vista, la extensión acaba activa (`onStartupFinished`) y no se ha enviado ningún catálogo; después, al abrir la vista, llega el catálogo como hoy. Verificar con `pnpm test` (vscode-test) en verde.

## 5. Documentación

- [x] 5.1 En el README:
  - Actualizar la frase "The command goes to the active terminal…" con la regla nueva: la activa si está libre; si no, la última libre usada; si no hay ninguna, "DevCommands".
  - Sustituir la limitación "If the active terminal is running a process…" por la nueva: en `cmd.exe` o sin integración del shell no se detectan los programas.

  Verificar que `test/unit/scripts/listing.test.ts` sigue en verde.
- [x] 5.2 En `CHANGELOG.md`, bajo `## [Unreleased]`, añadir en `### Fixed`: los comandos ya no se escriben en una terminal ocupada por un programa (Claude Code, un servidor de desarrollo…); van a la última terminal libre usada o a una nueva "DevCommands". Verificar leyendo el CHANGELOG.
- [x] 5.3 En `docs/ROADMAP.md`, marcar la fila 2.10 con ✅ y la casilla `busy-terminal` de "Siguientes pasos". Verificar con `pnpm run verify` en verde (lint, tipos, unitarios e integración).

## 6. Prueba manual (F5)

- [x] 6.1 Dar al autor la lista de comprobación en F5, en Windows con PowerShell y Git Bash:
  - `claude` en la terminal activa → el comando va a la otra terminal y "Ejemplos para" cambia;
  - salir de `claude` → vuelve;
  - `pnpm dev` en la única terminal → se crea "DevCommands";
  - cerrar terminales;
  - el buscador de la paleta usa la misma regla.

  Anotar aquí el resultado.

  *Resultado:* los 7 puntos funcionan en Windows con PowerShell y Git Bash: con `claude` o `node` en la terminal activa el comando va a la otra terminal libre y "Ejemplos para" la sigue; al salir vuelve; con la única terminal ocupada se crea "DevCommands"; el buscador de la paleta sigue la misma regla; y un `claude` lanzado antes de abrir el panel también se detecta.
