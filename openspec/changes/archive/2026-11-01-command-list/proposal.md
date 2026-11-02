# Proposal

## Why

La vista ya lista las categorías, pero al abrir una solo se ve una pantalla provisional. Para cumplir la puerta de la Fase 1 ("de categoría a comando en la terminal en 3 clics o menos"), el usuario tiene que ver los comandos de la categoría con lo necesario para decidir antes de enviarlos: qué hacen, cómo se escriben y si son peligrosos. Este change es el segundo paso de ese flujo; el tercero, enviar a la terminal, es la 1.4.

**Fase del roadmap:** v0.1.0 pre-release, Fase 1 (change 1.3).

## What Changes

- **Comandos en el mensaje `catalog`:** cada categoría lleva sus comandos con `id`, `title`, `description`, `example` y `risk`. Los textos ya van en el idioma activo, y el ejemplo se calcula en la extensión con la variante del shell por defecto del sistema: PowerShell en Windows y POSIX en el resto. La detección real del shell es la 2.1. `commandCount` desaparece, porque es la longitud de `commands`.
- **Lista de comandos** en la pantalla de la categoría, en lugar del texto provisional. Cada comando muestra su título, su descripción y el ejemplo en la fuente monoespaciada del editor.
- **Aviso de riesgo:** los comandos `caution` y `destructive` muestran una etiqueta con icono y texto, con los colores de aviso y error del tema. Los `safe` no muestran nada.
- **Teclado y ARIA:** la lista de comandos es una sola parada de Tab, con flechas, Inicio y Fin, y Escape vuelve a las categorías. Cada comando se anuncia con su título, su riesgo (si lo tiene), su descripción y su ejemplo.
- **Estado persistido:** con `setState`/`getState` se guardan la pantalla, la categoría abierta y el comando con foco. Al ocultar y volver a mostrar la vista, o al recargar la ventana, el usuario vuelve a donde estaba. Si algo ya no existe en el catálogo, vuelve a la lista de categorías. El estado guardado se valida antes de usarlo.

Fuera de alcance: enviar a la terminal y copiar (1.4 y 1.5), la búsqueda (1.6), los parámetros (2.2) y el enlace a la documentación.

## Capabilities

### New Capabilities
- `command-list`: lista de comandos de una categoría con título, descripción, ejemplo y aviso de riesgo; teclado, ARIA, tema y persistencia de la navegación con `setState`.

### Modified Capabilities
- `webview-messaging`: el mensaje `catalog` incluye los comandos de cada categoría (con el ejemplo ya calculado) en lugar de `commandCount`.
- `category-view`: la pantalla de una categoría deja de ser provisional y muestra su lista de comandos. La navegación incluye la restauración tras ocultar la vista.

## Impact

- **Extensión:** `src/catalog/CatalogService.ts` (`buildCategorySummaries` añade comandos y recibe el shell), `src/messaging/protocol.ts` y `src/views/CommandsViewProvider.ts` (elige el shell según `process.platform`).
- **Webview:** nuevo `CommandList.tsx`; cambios en `CategoryScreen.tsx`, `App.tsx`, `navigation.ts` (estado inicial a partir del guardado y foco del comando), `vscode.ts` (`getState`/`setState`), diccionarios (11 idiomas) y estilos.
- **Tests:** Vitest para el resumen con comandos, el ejemplo por shell, la validación y restauración del estado y los textos de riesgo. La integración comprueba los comandos de Git.
- **Mensajes webview ↔ extensión:** cambia la forma de `catalog`; no hay mensajes nuevos.
- **Sin dependencias nuevas.**
