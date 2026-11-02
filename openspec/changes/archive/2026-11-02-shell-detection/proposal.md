## Why

Hoy el ejemplo y el texto que se envía o se copia dependen solo del sistema operativo de la extensión: PowerShell en Windows y bash en el resto. En Windows, con una terminal de Git Bash, WSL o cmd activa, el usuario recibe una sintaxis que no funciona en su shell. Por ejemplo, `Remove-Item -Recurse -Force` en bash, o `rm -rf` en cmd. Es el primer change de la **fase 2 (v1.0.0 pública)** y el resto de la fase (parámetros con escapado por shell en la 2.2) depende de saber en qué shell se va a escribir.

## What Changes

- **Detección del shell de la terminal de destino.** La terminal de destino es la misma que al enviar: la activa, o una nueva con el perfil por defecto. El shell se detecta en este orden:
  1. el que VS Code ha identificado en la terminal activa (`terminal.state.shell`);
  2. el `shellPath` con el que se creó;
  3. el perfil por defecto (`vscode.env.shell`);
  4. el sistema operativo.

  Una función pura traduce el nombre a una variante del catálogo: `powershell`, `bash`, `zsh` o `cmd`.
- **Ejemplos en directo.** Cuando cambia el shell de destino (cambio de terminal activa, de shell dentro de la terminal o de perfil por defecto), la extensión vuelve a enviar el catálogo con los ejemplos y el texto de búsqueda de ese shell. El ejemplo visible, el texto enviado a la terminal y el texto copiado siguen siendo idénticos.
- **Indicador "Ejemplos para: <shell>"** en la vista, discreto, traducido a los 11 idiomas y anunciado al lector de pantalla cuando cambia. El mensaje `catalog` lleva el shell para el que se han construido los ejemplos.
- **Variantes `shells.cmd`** en los comandos de la categoría Terminal cuya sintaxis en cmd difiere de la POSIX: son los 18, incluidos `pwd` y `cd`, que no tienen variante de PowerShell (`cd`, `cd /d`, `rmdir /s /q`, `del`, `dir`, `type`…). Git, npm, pnpm, Node.js y Docker se escriben igual en cualquier shell.
- **BREAKING (requisito mínimo):** `engines.vscode` pasa de `^1.90.0` a `^1.99.0` y `@types/vscode` a `~1.99.0`. La API del tipo de shell es estable desde la 1.99. La espera del prompt en una terminal nueva (1.8) usa ya los tipos oficiales de la integración del shell, sin interfaces opcionales.

## Capabilities

### New Capabilities

- `shell-detection`: cómo se elige la terminal de destino, cómo se detecta su shell y se traduce a una variante del catálogo, y cuándo se vuelven a construir los ejemplos.

### Modified Capabilities

- `command-list`:
  - el requisito "Ejemplo según el sistema operativo" se sustituye por "Ejemplo según el shell de destino";
  - nuevo requisito para el indicador del shell.
- `terminal-integration`:
  - el texto enviado usa el shell de destino y no el del sistema;
  - la espera del prompt deja de mencionar versiones de VS Code anteriores a la 1.99.
- `clipboard-integration`: el texto copiado usa el shell de destino.
- `webview-messaging`: `catalog` lleva el campo `shell`, los ejemplos y el `searchText` usan el shell de destino, y el catálogo se vuelve a enviar cuando ese shell cambia.
- `command-catalog`: los comandos de Terminal declaran también `shells.cmd` cuando su sintaxis en cmd difiere de la POSIX.

## Impact

- **Código nuevo:** `src/terminal/shell.ts` (traducción pura del nombre o la ruta del shell a `ShellId`) y un servicio de shell de destino que escucha los eventos de terminal de VS Code.
- **Código modificado:**
  - `src/views/CommandsViewProvider.ts` (shell de destino en ejemplo, envío y copia, y reenvío del catálogo);
  - `src/terminal/TerminalService.ts` (tipos de la 1.99);
  - `src/messaging/protocol.ts` (`shell` en `catalog`);
  - `src/catalog/CatalogService.ts` (`defaultShellFor` queda solo como último recurso);
  - el webview (`App.tsx` y los 11 diccionarios de `webview-ui/src/i18n/`);
  - `catalog/terminal.json`.
- **Dependencias:** `@types/vscode` `~1.99.0`; `engines.vscode` `^1.99.0` en `package.json`; contexto de `openspec/config.yaml`.
- **Usuarios:** VS Code anterior a la 1.99 (marzo de 2025) deja de poder instalar las versiones nuevas. La v0.1.0 sigue disponible como `.vsix`.
