## Context

- **Cómo se elige el shell ahora:**
  - `CommandsViewProvider` construye el ejemplo, el texto enviado y el texto copiado con `defaultShellFor(process.platform)`: `powershell` en `win32` y `bash` en el resto.
  - En Remote-WSL ya acierta, porque el host de extensiones corre en Linux.
  - En Windows falla con Git Bash, con perfiles de WSL lanzados desde Windows y con cmd.
- **Catálogo:**
  - `buildExample(command, locale, shell)` ya elige `shells[shell] ?? command`.
  - `ShellId` es `'bash' | 'zsh' | 'powershell' | 'cmd'`, y el schema admite esas cuatro claves en `shells`.
  - Solo `terminal.json` tiene variantes: 16 de 18 comandos con `shells.powershell` y ninguno con `shells.cmd`.
- **API de VS Code:**
  - `TerminalState.shell` y `window.onDidChangeTerminalState` son estables desde la 1.99.
  - `terminal.shellIntegration` y `window.onDidChangeTerminalShellIntegration`, que usa la espera del prompt de la 1.8, son estables desde la 1.93.
  - Hoy `engines.vscode` es `^1.90.0` y `@types/vscode` `~1.90.0`; `TerminalService` declara esas APIs como opcionales.
- **Mensajes:**
  - `catalog` se envía solo como respuesta a `ready`, desde el `onDidReceiveMessage` de `resolveWebviewView`.
  - El proveedor no guarda la referencia al webview.
  - El webview trata cada `catalog` con `setCategories` y `dispatch({ type: 'resolve' })`, que vuelve a validar la navegación persistida.

## Goals / Non-Goals

**Goals:**
- Que el ejemplo visible, el texto enviado y el texto copiado usen siempre el shell de la terminal donde se escribiría el comando.
- Que la vista se actualice sola al cambiar de terminal o de shell, sin perder pantalla, búsqueda ni foco.
- Que cmd tenga variantes correctas en Terminal.
- Que el usuario sepa para qué shell son los ejemplos.

**Non-Goals:**
- Parámetros y escapado según el shell (2.2 `command-params`).
- Variantes para `fish`, `nu` u otros shells fuera de `ShellId`. Se tratan como desconocidos y se pasa al siguiente dato de la lista.
- Elegir a mano el shell desde la vista.
- Variantes de cmd fuera de la categoría Terminal: git, npm, pnpm, node y docker se escriben igual.

## Decisions

### D1. Traducción pura en `src/terminal/shell.ts`

- **`shellIdFromName(name: string | undefined): ShellId | undefined`:**
  1. pasa a minúsculas;
  2. se queda con el último segmento tras `/` o `\`;
  3. quita `.exe`;
  4. traduce `pwsh` y `powershell` → `powershell`; `bash`, `sh`, `gitbash`, `wsl`, `ksh` y `dash` → `bash`; `zsh` → `zsh`; `cmd` → `cmd`; cualquier otro → `undefined`.
- **`resolveTargetShell(sources, platform): ShellId`:** recibe `{ detected?, shellPath?, defaultShell? }` y devuelve el primer valor que traduzca, o `defaultShellFor(platform)`.
- Sin `vscode`: se testea con Vitest (rutas de Windows y de Linux, mayúsculas, `.exe`, shells desconocidos y el orden de las fuentes).
- **Alternativa descartada:** comparar con expresiones regulares sobre la ruta completa. Es más frágil, porque `C:\Users\bash-fan\pwsh.exe` contiene "bash".

### D2. `TargetShell`: servicio con eventos de VS Code

`src/terminal/TargetShell.ts` recibe interfaces mínimas de `window` y `env`, igual que `TerminalService`, para poder testearlo con Vitest.

- **`current(): ShellId`:**
  - con `window.activeTerminal`, usa:
    - `terminal.state.shell` como dato detectado;
    - `creationOptions.shellPath` como `shellPath`, si `creationOptions` tiene esa propiedad (las terminales de extensión no la tienen);
    - `env.shell` como perfil por defecto;
  - sin terminal activa, usa solo `env.shell`.
  - Después se llama a `resolveTargetShell(..., process.platform)`.
- **`onDidChange: Event<ShellId>`:** se calcula de nuevo con estos eventos:
  - `window.onDidChangeActiveTerminal`;
  - `window.onDidChangeTerminalState`, solo si la terminal es la activa;
  - `env.onDidChangeShell`.

  Se dispara solo si el resultado es distinto del último.
- Comprobado en `@types/vscode` 1.99.1 (tarea 1.1): existen `TerminalState.shell` (`string | undefined`), `window.onDidChangeTerminalState` y `env.onDidChangeShell`, así que no hace falta escuchar la configuración.
- **Cuándo se calcula:** el envío y la copia llaman a `current()` en el momento de actuar (spec: "del momento en que el usuario actúa"). No usan un valor guardado, por si un evento llega después del clic.

### D3. Proveedor: guardar el webview y reenviar `catalog`

- `CommandsViewProvider` recibe `TargetShell`.
- `commandText(id)` usa `targetShell.current()` en lugar de `defaultShellFor(process.platform)`.
- `resolveWebviewView` guarda el webview en `this.view`, lo borra en `onDidDispose` y lo usa en `postCatalog()`.
- **`postCatalog(shell)`:**
  - construye las categorías con ese shell;
  - envía `{ type: 'catalog', shell, categories }`;
  - dispara `onDidSendCatalog`.

  Se llama al recibir `ready` y en cada `targetShell.onDidChange` si la vista está viva. Si la vista no existe, no se hace nada: el próximo `ready` enviará el shell vigente.
- **Mensajes afectados:**
  - `catalog` (extensión → webview) añade `shell: ShellId`;
  - el tipo `ExtensionMessage` de `src/messaging/protocol.ts` cambia en ambos lados;
  - `init`, `ready`, `sendToTerminal`, `copyToClipboard` y `copied` no cambian;
  - el webview sigue sin enviar texto de comandos, solo ids.
- **Sin dependencias de runtime nuevas.**
- **API de tests:** `onDidSendCatalog` pasa a emitir `{ shell, categories }` para que el test de integración pueda comprobar el shell.

### D4. Webview: conservar la vista y anunciar el shell

- **Al recibir `catalog`:** `App` guarda `shell` y `categories`. `dispatch({ type: 'resolve' })` ya conserva la pantalla y la búsqueda cuando las categorías e ids siguen existiendo, y los ids no cambian con el shell. Las listas usan el `id` como `key` y `CategoryScreen` usa `key={category.id}`, así que el elemento con el foco no se vuelve a montar. Se añade un test del reductor de navegación: con un nuevo catálogo de mismos ids, la vista no cambia.
- **Indicador:**
  - es un `<p className="muted shell-indicator" role="status" aria-live="polite">` en la parte superior de `<main>`, fuera del bloque que cambia según la pantalla, para que esté en todas;
  - texto `t('examplesFor', { shell: shellLabel(shell) })`, con estos nombres: `PowerShell`, `bash`, `zsh` y `cmd`. Son nombres propios y no se traducen;
  - `aria-live="polite"` lo anuncia al cambiar sin mover el foco. En el primer render también se lee una vez, como el resto de la vista.
- **i18n:** `examplesFor` en los 11 diccionarios de `webview-ui/src/i18n/`:
  - en: "Examples for: {shell}"
  - es: "Ejemplos para: {shell}"
  - pt-br: "Exemplos para: {shell}"
  - fr: "Exemples pour : {shell}"
  - de: "Beispiele für: {shell}"
  - it: "Esempi per: {shell}"
  - ja: "{shell} 用の例"
  - ko: "{shell}용 예시"
  - zh-cn: "{shell} 示例"
  - zh-tw: "{shell} 範例"
  - ru: "Примеры для: {shell}"

  El tipo `Messages` obliga a tenerlo en todos.

### D5. Variantes `shells.cmd` en `catalog/terminal.json`

Para los 18 comandos, con los mismos placeholders que `command`:

| id | `shells.cmd` |
| --- | --- |
| current-directory | `cd` |
| list | `dir /a` |
| change-directory | `cd /d ${directory}` |
| make-directory | `mkdir ${directory}` (crea las carpetas intermedias) |
| create-file | `type nul > ${file}` |
| show-file | `type ${file}` |
| follow-file | `powershell -NoProfile -Command "Get-Content ${file} -Tail 50 -Wait"` (cmd no tiene equivalente propio) |
| copy | `xcopy /e /i ${source} ${destination}` |
| move | `move ${source} ${destination}` |
| remove-file | `del ${file}` |
| remove-directory | `rmdir /s /q ${directory}` |
| find-files | `dir /s /b "${pattern}"` |
| search-text | `findstr /s /n /c:"${text}" *` |
| which | `where ${program}` |
| path | `echo %PATH:;=&echo.%` (una ruta por línea, como la variante POSIX) |
| disk-usage | `dir /s ${directory}` (el total aparece al final) |
| port-in-use | `netstat -ano \| findstr :${port}` |
| kill-process | `taskkill /PID ${pid}` |

- El `risk` de cada comando no cambia.
- Los tests de contenido (`test/unit/catalog/content.test.ts`) comprueban que todos los comandos de Terminal tienen `shells.cmd` y que el ejemplo de cmd para borrar una carpeta es `rmdir /s /q`.
- Cada variante se comprueba a mano en cmd (tarea 5.1).

### D6. Engine 1.99 y limpieza de la 1.8

- **Versiones:**
  - `package.json`: `engines.vscode` `^1.99.0` y `@types/vscode` `~1.99.1` (pnpm conserva el `~` que ya tenía; los tipos siguen la misma versión menor que el engine);
  - `openspec/config.yaml`: el contexto pasa a decir `^1.99.0`.
- **Interfaces mínimas:** `TerminalLike.shellIntegration` y `TerminalHost.onDidChangeTerminalShellIntegration` dejan de ser opcionales. `vscode.window` encaja con los tipos oficiales.
- **Espera del prompt:** desaparece el camino "sin la API" de la espera. Se mantienen los 3 segundos máximos, para cuando la integración del shell está desactivada. También se elimina su test.
- **El test de integración** comprueba que la terminal "DevCommands" sigue creándose.
- **Requisitos del entorno de pruebas:** `@vscode/test-electron` descarga la versión estable actual, así que la 1.99 no afecta a `pnpm run verify`.

## Risks / Trade-offs

- [`state.shell` tarda en llegar en una terminal recién creada] → Mientras tanto se usa `creationOptions.shellPath` o el perfil por defecto. Cuando VS Code lo detecta, `onDidChangeTerminalState` corrige el ejemplo.
- [Dentro de una terminal se lanza otro shell que VS Code no detecta] → Se usa lo último detectado. Es el mismo límite que tiene VS Code, y el indicador deja ver para qué shell son los ejemplos.
- [Reenviar el catálogo entero en cada cambio] → Son 108 comandos (decenas de KB) y solo cuando el shell cambia de verdad. No compensa un mensaje parcial.
- [Subir a 1.99 excluye VS Code anterior a marzo de 2025] → Lo decidió el usuario. Cursor y Windsurf siguen versiones posteriores, y la v0.1.0 sigue disponible como `.vsix` para versiones antiguas.
- [Variantes de cmd sin equivalente exacto (`follow-file`, `disk-usage`)] → Se usa la alternativa más cercana y se documenta en D5. `follow-file` llama a PowerShell, que viene con Windows.
- [El nombre `zsh` sin variantes propias] → Usa `command` (POSIX), que es correcto en zsh.
