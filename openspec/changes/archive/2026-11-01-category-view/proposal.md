# Proposal

## Why

La vista lateral ya carga de forma segura y está traducida, pero solo muestra un marcador ("Commands coming soon."). El primer paso del flujo principal de DevCommands, "de categoría a comando en la terminal en 3 clics o menos" (puerta de la Fase 1), es ver y elegir una categoría. Este change convierte el catálogo empaquetado en la primera pantalla real de la vista.

**Fase del roadmap:** v0.1.0 pre-release, Fase 1 (change 1.2).

## What Changes

- **Mensaje `catalog`:** la extensión envía al webview, después de `init`, el resumen de las categorías (id, título traducido, icono y número de comandos), ya ordenado.
- **Lista de categorías** en la vista: un Codicon por categoría, el título y el número de comandos, con los colores de lista del tema de VS Code.
- **Navegación a una pantalla provisional** de la categoría: título, "N comandos" y botón Atrás. Al volver, el foco regresa a la categoría de la que se salió. La 1.3 rellenará esa pantalla con la lista de comandos.
- **Teclado y lector de pantalla:** una sola parada de Tab para la lista; flechas, Inicio y Fin para moverse; Enter/Espacio para abrir; Escape para volver. Cada categoría se anuncia con su nombre y su número de comandos.
- **Estados** de carga y de catálogo vacío.
- **Plurales** en los diccionarios del webview ("1 comando" / "3 comandos"), con las reglas de cada idioma (`Intl.PluralRules`).
- **Codicons** con `@vscode/codicons`. Si un icono no existe, se muestra uno genérico, y un test valida los iconos del catálogo.
- Se retira el marcador de `webview-shell` (nombre, versión y "Commands coming soon.").

Fuera de alcance: la lista de comandos y el estado persistido (1.3), y nuevas categorías en el catálogo (1.7).

## Capabilities

### New Capabilities
- `category-view`: lista de categorías del catálogo en la vista lateral, navegación a la pantalla de una categoría y vuelta, teclado, ARIA, tema, iconos y estados de carga y vacío.

### Modified Capabilities
- `webview-messaging`: el protocolo añade el mensaje `catalog` (extensión → webview), que se envía tras cada `init`.
- `sidebar-view`: la interfaz inicial deja de ser el marcador con nombre y versión, y pasa a ser el indicador de carga seguido del contenido. La comprobación en Windows verifica las categorías en lugar de la versión.

## Impact

- **Extensión:** `src/catalog/CatalogService.ts` (nuevo `buildCategorySummaries`), `src/messaging/protocol.ts` (mensaje `catalog`) y `src/views/CommandsViewProvider.ts` (envío tras `init`). El catálogo entra ahora en `dist/extension.js`.
- **Webview:** nuevos componentes de lista y de pantalla de categoría, un reducer de navegación, plurales en `webview-ui/src/i18n/` y estilos con variables `--vscode-list-*`.
- **Dependencias:** `@vscode/codicons` en `webview-ui`, que añade una fuente de ~150 KB y su CSS al paquete. La extensión no gana dependencias de runtime.
- **Tests:** Vitest para el resumen, el reducer, los plurales y los iconos; el test de integración comprueba que llega el catálogo.
- **Mensajes webview ↔ extensión:** nuevo `catalog` (extensión → webview).
