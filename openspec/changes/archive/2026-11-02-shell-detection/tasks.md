## 1. Engine 1.99 y tipos de la terminal

- [x] 1.1 Actualizar a VS Code 1.99 (D6):
  - `pnpm add -D --save-exact @types/vscode@1.99.x` (la última 1.99) y `engines.vscode` `^1.99.0` en `package.json`;
  - `openspec/config.yaml`: el contexto dice `^1.99.0`.

  Comprobar en los tipos instalados que existen `TerminalState.shell`, `window.onDidChangeTerminalState` y `env.onDidChangeShell`, y anotar el resultado en D2. Si `env.onDidChangeShell` no existe, se usa `onDidChangeConfiguration`.

  Verificar: `pnpm install --frozen-lockfile` y `pnpm run check-types` pasan.
- [x] 1.2 `TerminalService` con los tipos de la 1.99 (D6):
  - `shellIntegration` y `onDidChangeTerminalShellIntegration` dejan de ser opcionales en las interfaces mínimas;
  - se quita el camino "sin la API" y su test;
  - se mantienen los 3 segundos máximos.

  Verificar: `pnpm run test:unit` (tests de `TerminalService`) y `pnpm run check-types`.

## 2. Detección del shell

- [x] 2.1 Crear `src/terminal/shell.ts` con `shellIdFromName` y `resolveTargetShell` (D1). Tests en `test/unit/terminal/shell.test.ts`:
  - rutas de Windows (`C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`, `C:\Program Files\Git\bin\bash.exe`, `cmd.exe`, `wsl.exe`) y de Linux (`/bin/bash`, `/usr/bin/zsh`);
  - mayúsculas (`PWSH.EXE`);
  - `gitbash`, `sh`, `ksh` y `dash` → `bash`;
  - `fish`, `nu`, `python` y `''` → `undefined`;
  - una carpeta con "bash" en el nombre que contiene `pwsh.exe` → `powershell`;
  - el orden de las fuentes: detectado > `shellPath` > perfil > sistema operativo;
  - un desconocido salta al siguiente;
  - sin datos: `win32` → `powershell` y `linux` → `bash`.

  Verificar: `pnpm run test:unit`.
- [x] 2.2 Crear `src/terminal/TargetShell.ts` (D2): `current()` y `onDidChange` sobre interfaces mínimas de `window` y `env`. Tests en `test/unit/terminal/TargetShell.test.ts` con una ventana falsa:
  - terminal activa con `state.shell` `gitbash` en `win32` → `bash`;
  - sin `state.shell` usa `creationOptions.shellPath`;
  - una terminal de extensión sin `shellPath` usa `env.shell`;
  - sin terminal activa usa `env.shell`;
  - cambiar de terminal activa de PowerShell a Git Bash emite `bash` una vez;
  - pasar entre dos terminales bash no emite;
  - un cambio de estado en una terminal que no es la activa no emite;
  - cerrar la última (la activa pasa a `undefined`) emite el perfil por defecto;
  - el cambio del perfil por defecto emite;
  - `dispose` deja de escuchar.

  Verificar: `pnpm run test:unit`.

## 3. Extensión: texto, mensaje y reenvío

- [x] 3.1 `src/messaging/protocol.ts`: `catalog` incluye `shell: ShellId` (D3). Actualizar `test/unit/messaging/protocol.test.ts` y los tipos del webview. Verificar: `pnpm run test:unit` y `pnpm run check-types`.
- [x] 3.2 `CommandsViewProvider` con `TargetShell` (D3):
  - `commandText` usa `targetShell.current()` en el momento de enviar o copiar;
  - se guarda el webview vivo;
  - `postCatalog(shell)` se llama en `ready` y en `onDidChange`;
  - `onDidSendCatalog` emite `{ shell, categories }`;
  - `extension.ts` crea `TargetShell` con `vscode.window` y `vscode.env` y lo registra en `subscriptions`.

  Ningún comando se ejecuta: el envío sigue siendo `sendText(texto, false)`.

  Actualizar `src/test/extension.test.ts`:
  - el catálogo llega con `shell` igual al que corresponde al perfil por defecto del entorno de pruebas;
  - el ejemplo de `terminal.remove-directory` es el de ese shell.

  Verificar: `pnpm run verify` (unitarios e integración).

## 4. Catálogo y webview

- [x] 4.1 Añadir `shells.cmd` a los 18 comandos de `catalog/terminal.json` (D5). En `test/unit/catalog/content.test.ts`:
  - todos los comandos de Terminal tienen `shells.cmd`;
  - el ejemplo de cmd para borrar una carpeta es `rmdir /s /q …`;
  - el de bash sigue siendo `rm -rf …`.

  Verificar: `pnpm run test:unit`, incluida la validación de placeholders.
- [x] 4.2 Webview (D4):
  - `App` guarda `shell` de cada `catalog`;
  - indicador `role="status"` `aria-live="polite"` en la parte superior de `<main>`, visible en todas las pantallas, con `shellLabel` (`PowerShell`, `bash`, `zsh`, `cmd`) y estilo `muted` discreto;
  - `examplesFor` en los 11 diccionarios (textos de D4).

  Tests:
  - `test/unit/i18n/webview-dictionaries.test.ts` sigue exigiendo todas las claves;
  - un test del reductor de navegación: un nuevo catálogo con los mismos ids conserva pantalla, búsqueda y `focusCommandId`;
  - un test de `shellLabel`.

  Verificar: `pnpm run test:unit` y `pnpm run check-types`.
- [x] 4.3 Documentación:
  - `CHANGELOG.md` `[Unreleased]`:
    - Added: detección del shell de la terminal, ejemplos en directo, indicador y variantes de cmd en Terminal;
    - Changed: requiere VS Code 1.99 o posterior;
  - `README.md`: mencionar que los ejemplos siguen el shell de la terminal activa y la versión mínima de VS Code;
  - `docs/ROADMAP.md`: 2.1 ✅ y su checkbox.

  Verificar: revisar el diff de la documentación.

## 5. Verificación manual

- [x] 5.1 F5 en Windows:
  - con PowerShell activa, el indicador dice "Ejemplos para: PowerShell" y Terminal muestra `Remove-Item …`;
  - al abrir Git Bash, el indicador y los ejemplos pasan a bash sin perder la pantalla ni el foco;
  - al abrir cmd, pasan a cmd; enviar y copiar `terminal.remove-directory`, `terminal.list` y `terminal.path` en cmd da la variante de cmd, que funciona al pulsar Enter;
  - al cerrar todas las terminales, vuelve el perfil por defecto;
  - con el lector de pantalla (NVDA o Narrador), el cambio de shell se anuncia.

  En WSL (Remote-WSL), el indicador dice bash y enviar funciona.

## 6. Cierre

- [x] 6.1 Dejar en verde `pnpm run verify` y `openspec validate shell-detection --strict`. Hacer `/opsx:archive` antes de abrir el PR a `develop`.
