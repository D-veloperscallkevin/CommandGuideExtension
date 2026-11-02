# Proposal

## Why

La extensión todavía es el Hello World del generador: no tiene interfaz propia y el webview de React es la plantilla de Vite, sin conexión con VS Code. La puerta de la Fase 0 exige que "el webview de React carga dentro de la vista lateral", y todos los changes de la Fase 1 (categorías, lista, terminal, búsqueda) necesitan antes una vista segura y un canal de mensajes validado sobre el que construir.

**Fase del roadmap:** MVP, Fase 0 (change 0.3, el último de la fase).

## What Changes

- Contenedor propio en la Activity Bar ("DevCommands", icono SVG propio) con una vista webview.
- Activación perezosa: la extensión solo se activa al abrir la vista. Nunca con `"*"`.
- Proveedor de la vista que genera el HTML del webview con CSP estricta, `nonce` por carga y recursos limitados a `dist/webview`.
- Protocolo de mensajes tipado y compartido entre la extensión y el webview. La extensión valida cada mensaje entrante y descarta los inválidos.
- Handshake inicial: el webview avisa de que está listo (`ready`) y la extensión responde con el contexto inicial (`init`: idioma y versión).
- El webview sustituye la demo de Vite por un marcador mínimo (nombre, versión, "Cargando…") que respeta el tema de VS Code y es accesible con teclado y lector de pantalla.
- **BREAKING (interno):** se elimina el comando de ejemplo `devcommands.helloWorld`.
- Flujo de desarrollo: F5 y el modo watch construyen también el webview.

Fuera de alcance: el catálogo en la vista (change 1.2 `category-view`) y la traducción de la interfaz (change 1.1 `ui-i18n`).

## Capabilities

### New Capabilities
- `sidebar-view`: la vista lateral de DevCommands (contenedor en la Activity Bar, activación perezosa, carga segura del webview, tema y accesibilidad).
- `webview-messaging`: protocolo de mensajes entre el webview y la extensión, validación de entrada y handshake inicial.

### Modified Capabilities
<!-- Ninguna: command-catalog y continuous-integration no cambian. -->

## Impact

- **Extensión:** `src/extension.ts` reescrito, y nuevos `src/views/CommandsViewProvider.ts`, `src/views/webviewHtml.ts` y `src/messaging/protocol.ts`. `package.json` (`contributes`, scripts `compile` y `watch:webview`) y `media/icon.svg`.
- **Webview:** `webview-ui/src/` reescrito (`App.tsx`, `main.tsx`, `vscode.ts`, estilos). Se eliminan los assets de la demo. Nueva devDependency `@types/vscode-webview` en `webview-ui`.
- **Dev:** `.vscode/tasks.json` (tarea watch del webview) y `.vscode/settings.json` (`npm.packageManager: pnpm`).
- **Tests:** Vitest para el protocolo y la generación de HTML/CSP, y Mocha (integración) para activación y handshake.
- **Dependencias de runtime nuevas:** ninguna en la extensión. El webview sigue con React.
- **Mensajes webview ↔ extensión:** se crean `ready` (webview → extensión) e `init` (extensión → webview).
- **Tamaño:** el `index.js` del webview baja al quitar la demo. Muy lejos de los 2 MB.
