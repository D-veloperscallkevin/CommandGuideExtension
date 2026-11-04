## Why

Al abrir la vista, todas las categorías aparecen siempre en el mismo orden, aunque el proyecto abierto solo use algunas. Por ejemplo, un proyecto con `pnpm-lock.yaml` y `Dockerfile` obliga a buscar pnpm y Docker entre categorías que no usa. Este change es el punto 2.7 de la Fase 2 (v1) del roadmap: "Sugiere primero las categorías del proyecto".

## What Changes

- **Detección del proyecto:**
  - la extensión comprueba si existen ciertos archivos en la raíz de cada carpeta del workspace, también en multi-root, sin leer su contenido;
  - **señales:** `.git` → Git; `package.json` → Node; `pnpm-lock.yaml` → pnpm; `package-lock.json` → npm; `Dockerfile`, `compose.yaml`, `compose.yml`, `docker-compose.yml` o `docker-compose.yaml` → Docker;
  - Terminal nunca se detecta, porque aplica a cualquier proyecto.
- **Mensaje `catalog`:** gana el campo `detected`, con los ids de las categorías detectadas.
- **Portada:**
  - Favoritos y Recientes siguen arriba;
  - si se detecta alguna categoría, debajo aparece una sección "En este proyecto" con las detectadas y otra "Todas" con el resto, cada una con su encabezado;
  - si no se detecta ninguna, la portada queda igual que hoy;
  - las flechas recorren toda la portada sin cortarse entre secciones, y el lector de pantalla anuncia cada sección por su encabezado;
  - la búsqueda no cambia.
- **Recarga en vivo:** crear o borrar uno de esos archivos, o añadir o quitar carpetas del workspace, actualiza la portada sin recargar.
- **Ajuste `devcommands.detectProject`:** boolean, `true` por defecto. Si está en `false`, no se detecta nada; al cambiarlo, la portada se actualiza.
- **Textos:** los nuevos de la interfaz y del ajuste, en los 11 idiomas.
- **Fuera de este change:**
  - una categoría Prisma: no existe en el catálogo y queda para un change de contenido;
  - buscar en subcarpetas;
  - que las categorías propias declaren sus propias señales.

## Capabilities

### New Capabilities
- `project-detection`: señales de proyecto, alcance (raíz de cada carpeta), actualización en vivo y el ajuste `devcommands.detectProject`.

### Modified Capabilities
- `webview-messaging`: `catalog` incluye `detected` y se reenvía cuando cambian las categorías detectadas o el ajuste.
- `category-view`:
  - la lista de categorías se divide en las secciones "En este proyecto" y "Todas" cuando hay detectadas;
  - el teclado recorre todas las secciones como una sola lista;
  - cada sección tiene un nombre accesible.

## Impact

- **Extensión:**
  - nuevo `src/project/detect.ts`: las señales y una detección pura con la comprobación de existencia inyectada, sin depender de `vscode`;
  - nuevo `src/project/ProjectDetector.ts`: usa `vscode.workspace.fs.stat`, `FileSystemWatcher` por carpeta, `onDidChangeWorkspaceFolders` y el ajuste, y emite `onDidChange`;
  - `CommandsViewProvider` añade `detected` a `catalog` y lo reenvía al cambiar;
  - `extension.ts` lo crea y lo registra.
- **Protocolo:** `catalog` gana `detected: readonly string[]` en `src/messaging/protocol.ts`.
- **Webview:**
  - nueva función pura que reparte las categorías en secciones;
  - `CategoryList` pinta las secciones con un foco itinerante compartido;
  - estilos de encabezado;
  - textos en los 11 diccionarios.
- **Manifiesto:** `package.json` declara el ajuste, y `package.nls*.json` lo describe en los 11 idiomas.
- **Dependencias:** ninguna nueva.
- **Pruebas:**
  - unitarias de la detección, con raíces y archivos simulados;
  - unitarias de las secciones;
  - coherencia de las señales con las categorías del catálogo;
  - integración de `detected` con el workspace de prueba.
- **Docs:** README, CHANGELOG y ROADMAP.
