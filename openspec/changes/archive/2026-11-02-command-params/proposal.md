## Why

57 de los 108 comandos del catálogo llevan parámetros (`${branch}`, `${file}`, `${message}`…). Hoy se envían y se copian con el valor de ejemplo (`git checkout -b feature/mi-cambio`), así que el usuario tiene que borrarlo a mano antes de pulsar Enter. Es el diferenciador principal de la v1 (fase 2, change 2.2): DevCommands debe pedir los valores y escribirlos bien escapados para el shell de destino, sin que un valor con espacios, comillas o `$` rompa el comando o ejecute algo que el usuario no escribió.

## What Changes

- Al enviar o copiar un comando con parámetros, la extensión pide cada valor con un cuadro de texto nativo de VS Code (`showInputBox`), en orden y con el paso (`1/2`), la etiqueta y el placeholder del catálogo en el idioma activo. Escape cancela: no se envía ni se copia nada. Los comandos sin parámetros no cambian.
- Los valores se validan en el propio cuadro: no pueden estar vacíos, ni contener saltos de línea o caracteres de control (un salto de línea ejecutaría el comando), ni pasar de 500 caracteres. En cmd, además, se rechazan `"` y `%`, que cmd no permite escapar de forma fiable, y en PowerShell `"`, que Windows PowerShell 5.1 borra al pasarla a programas como git o node.
- Los valores se escapan según el shell de destino y según dónde está el `${x}` en la plantilla (suelto, entre comillas dobles o entre simples). Un valor que solo tiene caracteres seguros (`feature/login`, `node:20`, `8080:80`) se escribe tal cual.
- La variante cmd de `terminal.follow-file` pasa a `powershell -NoProfile -Command "Get-Content -LiteralPath '${file}' -Tail 50 -Wait"`, para que el valor tenga un contexto de comillas definido dentro del comando de PowerShell.
- El webview sigue enviando solo el `id` del comando: los valores nunca pasan por él. El protocolo no cambia.
- Textos nuevos de la extensión (mensajes de validación) en los 11 idiomas con `vscode.l10n.t`.
- ROADMAP: el flujo de un clic y la regla de seguridad dejan de decir que el webview envía los parámetros.

## Capabilities

### New Capabilities
- `command-params`: pedir los valores de los parámetros, validarlos y escaparlos según el shell de destino y el contexto de comillas de la plantilla.

### Modified Capabilities
- `terminal-integration`: un comando con parámetros se escribe con los valores introducidos (no con el ejemplo); cancelar no escribe nada.
- `clipboard-integration`: lo mismo para copiar; cancelar no modifica el portapapeles ni envía `copied`, y no se registra como error.
- `command-list`: copiar un comando con parámetros abre el cuadro de los valores, que recibe el foco.

## Impact

- Código nuevo: `src/params/escape.ts` (contextos de comillas, escapado y validación; función pura), `src/params/ParamPrompter.ts` (cuadros de texto sobre una interfaz mínima de `window`).
- `src/views/CommandsViewProvider.ts`: el texto del comando pasa a construirse de forma asíncrona (pide los valores si hay parámetros).
- `catalog/terminal.json`: variante cmd de `terminal.follow-file`.
- `l10n/bundle.l10n.*.json` (10 idiomas) con los mensajes de validación.
- Tests unitarios del escapado (por shell y contexto), de la validación y del flujo de los cuadros con una ventana falsa.
- `docs/ROADMAP.md`, `CHANGELOG.md` y `README.md`.
- Sin dependencias nuevas. Sin cambios en `src/messaging/protocol.ts`.
