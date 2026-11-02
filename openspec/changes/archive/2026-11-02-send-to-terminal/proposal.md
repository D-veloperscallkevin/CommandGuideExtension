# Proposal

## Why

La vista ya muestra los comandos con su ejemplo y su riesgo, pero hay que copiarlos a mano. El tercer clic del flujo principal ("categoría → comando → terminal en 3 clics o menos", puerta de la Fase 1) es escribir el comando en la terminal **sin ejecutarlo**, para que el usuario lo revise y confirme con Enter. Ese es el principio rector del proyecto.

**Fase del roadmap:** v0.1.0 pre-release, Fase 1 (change 1.4).

## What Changes

- **Mensaje `sendToTerminal { commandId }`** (webview → extensión). El webview solo envía el id. La extensión lo valida, busca el comando en el catálogo y construye el texto ella misma, de modo que el webview no puede mandar texto arbitrario a la terminal.
- **Validación por campo:** `isWebviewMessage` comprueba también el tipo de cada campo (`commandId`: string no vacío de hasta 200 caracteres), además de las claves exactas.
- **`TerminalService`:** usa la terminal activa o, si no hay ninguna, crea "DevCommands". Le da el foco y escribe el comando con `sendText(texto, false)`, es decir, sin ejecutarlo.
- **Texto enviado:** el mismo ejemplo que muestra la vista. En los comandos con parámetros, el usuario edita el placeholder antes de pulsar Enter. Los parámetros de verdad son la 2.2.
- **Filas de comando como botones:** clic, Enter o Espacio envían el comando. Al pasar el ratón o enfocar la fila aparece un icono de terminal, y cada botón lleva un tooltip y una descripción accesible ("Escribe el comando en la terminal sin ejecutarlo") en los 11 idiomas.

Fuera de alcance: copiar al portapapeles (1.5), detección del shell (2.1), parámetros (2.2), confirmación de comandos destructivos (2.3), historial y respuesta `sent` al webview.

## Capabilities

### New Capabilities
- `terminal-integration`: escribir un comando del catálogo en la terminal sin ejecutarlo; elección de la terminal y foco.

### Modified Capabilities
- `webview-messaging`: el protocolo añade `sendToTerminal`, y la validación comprueba el tipo de cada campo.
- `command-list`: cada comando es un botón que lo envía a la terminal, con su descripción accesible.

## Impact

- **Extensión:** nuevo `src/terminal/TerminalService.ts`. Cambios en `src/messaging/protocol.ts`, `src/views/CommandsViewProvider.ts` (atiende `sendToTerminal`) y `src/extension.ts` (la API de pruebas expone `sendToTerminal`).
- **Webview:** `CommandList.tsx` (botones), `vscode.ts`, diccionarios (11 idiomas) y estilos.
- **Tests:** Vitest para la validación del mensaje y para `TerminalService` con una terminal falsa; la integración comprueba que se crea la terminal "DevCommands".
- **Mensajes webview ↔ extensión:** nuevo `sendToTerminal` (webview → extensión).
- **Sin dependencias nuevas** y sin nuevos `contributes` en `package.json`.
