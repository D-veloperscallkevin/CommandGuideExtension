# Proposal

## Why

Desde la 1.4, la única acción sobre un comando es escribirlo en la terminal. Pero a veces el comando se necesita en otro sitio: una terminal externa, un README, un chat o una sesión SSH. Hoy, para eso, el usuario tiene que seleccionar el ejemplo a mano. La funcionalidad "Copiar al portapapeles" del MVP añade esa salida como acción secundaria, sin cambiar la principal.

**Fase del roadmap:** v0.1.0 pre-release, Fase 1 (MVP), change 1.5.

## What Changes

- **Mensaje `copyToClipboard { commandId }`** (webview → extensión). Igual que con la terminal, el webview solo envía el id. La extensión lo valida, construye el texto con la misma regla que el ejemplo visible y lo copia con el portapapeles de VS Code (`vscode.env.clipboard`), no con el del navegador.
- **Mensaje `copied { commandId }`** (extensión → webview). Solo se envía cuando la copia ha salido bien.
- **`ClipboardService`:** recibe el portapapeles inyectado e informa de si la copia funcionó, sin lanzar excepciones. Se puede probar sin VS Code.
- **Botón secundario de copiar** en cada comando (Codicon `copy`). Aparece al pasar el ratón o cuando el foco está en la fila, y no añade paradas de Tab: la lista sigue teniendo una sola.
- **Atajo `Ctrl+C`** (`Cmd+C` en macOS) sobre el comando con foco. Se anuncia con `aria-keyshortcuts`. Si hay texto seleccionado en la vista, el atajo copia la selección como siempre.
- **Confirmación:** cuando llega `copied`, el icono cambia a ✓ durante unos 2 segundos y se anuncia "Copiado" en una región `aria-live`, en los 11 idiomas.
- La API de pruebas de la extensión expone `copyToClipboard`.

Fuera de alcance:
- parámetros (2.2), detección del shell (2.1) e historial (2.5);
- copiar varios comandos a la vez;
- notificaciones de VS Code para avisar de la copia.

## Capabilities

### New Capabilities
- `clipboard-integration`: copiar al portapapeles el texto de un comando del catálogo y confirmar la copia al webview.

### Modified Capabilities
- `webview-messaging`: el protocolo añade `copyToClipboard` y `copied`, y la validación los cubre.
- `command-list`: botón secundario de copiar, atajo de teclado y confirmación accesible (requisito nuevo dentro de esta capability).

## Impact

- **Extensión:**
  - nuevo `src/clipboard/ClipboardService.ts`;
  - cambios en `src/messaging/protocol.ts`, `src/views/CommandsViewProvider.ts` (atiende `copyToClipboard` y responde con `copied`) y `src/extension.ts` (la API de pruebas expone `copyToClipboard`).
- **Webview:** `CommandList.tsx` (botón de copiar, atajo y región `aria-live`), los diccionarios de los 11 idiomas y los estilos.
- **Tests:**
  - Vitest para la validación de los mensajes y para `ClipboardService` con un portapapeles falso;
  - integración: después de copiar `git.status`, el portapapeles contiene `git status`.
- **Mensajes webview ↔ extensión:** nuevos `copyToClipboard` (webview → extensión) y `copied` (extensión → webview).
- **Sin dependencias nuevas** y sin nuevos `contributes` en `package.json`.
