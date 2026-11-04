## 1. Detección (lógica pura)

- [x] 1.1 Crear `src/project/detect.ts` con `PROJECT_SIGNALS`, `SIGNAL_GLOB` y `detectCategories` (D1). Tests en `test/unit/project/detect.test.ts` (D6), incluida la coherencia con el catálogo incluido. Verificar: `pnpm run test:unit`.
- [x] 1.2 Crear `src/project/ProjectDetector.ts` con interfaces mínimas, watchers por carpeta, debounce, generación y ajuste (D2). Tests en `test/unit/project/ProjectDetector.test.ts` con fakes y temporizadores falsos (D6). Verificar: `pnpm run test:unit`.

## 2. Manifiesto y textos

- [x] 2.1 `package.json`: el ajuste `devcommands.detectProject` (D5). Añadir `config.detectProject` a los 11 `package.nls*.json`. Verificar: `pnpm run test:unit` (test del manifiesto).
- [x] 2.2 Añadir a los 11 diccionarios del webview `inThisProject`, `allCategories` y `shortcutsLabel` (D4). Verificar: `pnpm run test:unit` (tests de diccionarios).

## 3. Extensión

- [x] 3.1 `protocol.ts`: añadir `detected` a `catalog`. En `CommandsViewProvider`:
  - recibir `ProjectDetector`;
  - filtrar y ordenar `detected` en `postCatalog`;
  - exponerlo en `onDidSendCatalog`;
  - reenviar `catalog` en `detector.onDidChange` (D3).
- [x] 3.2 `extension.ts`: crear `ProjectDetector` con `vscode.workspace` (`workspaceFolders`, `onDidChangeWorkspaceFolders`, `fs.stat`, `createFileSystemWatcher` con `RelativePattern`) y el ajuste (`onDidChangeConfiguration` con `affectsConfiguration('devcommands.detectProject')`). Pasarlo al provider y registrarlo en `subscriptions`. Verificar: `pnpm run check-types` y `pnpm run lint`.

## 4. Webview

- [x] 4.1 `homeSections` en `webview-ui/src/navigation.ts`, con tests en `test/unit/webview/navigation.test.ts` (D4).
- [x] 4.2 `App` guarda `detected`. `CategoryList`:
  - pinta las secciones con encabezados y `aria-labelledby`;
  - la lista de accesos rápidos usa `shortcutsLabel`;
  - el foco itinerante tiene índices globales y el `onKeyDown` en el contenedor;
  - sin detectadas, el `<ul>` de hoy.

  Añadir `.section-heading` a `index.css`. Verificar: `pnpm run build:webview` y `pnpm run lint`.

## 5. Integración

- [x] 5.1 Crear `test/fixtures/workspace/` con `package.json` y `pnpm-lock.yaml` mínimos, y abrirla desde `.vscode-test.mjs` (`workspaceFolder`). Tests en `src/test/extension.test.ts` (D6):
  - `detected` inicial;
  - crear y borrar `Dockerfile`;
  - `detectProject: false`, restaurado en `finally`.

  Verificar: `pnpm run verify`, con los tests existentes en verde.

## 6. Documentación

- [x] 6.1 Documentación:
  - **README:** cómo se detecta el proyecto, la lista de archivos y el ajuste;
  - **CHANGELOG:** en `[Unreleased]` → Added;
  - **ROADMAP:** 2.7 ✅ con el checkbox, y una nota de que Prisma queda para un change de contenido.

## 7. Comprobación manual

- [x] 7.1 F5 en Windows. Herramientas:
  - la ventana de F5 (Extension Development Host): la ventana de VS Code que abre F5 con la extensión cargada desde el código;
  - el **Explorador de archivos** de VS Code (`Ctrl+Shift+E`), para crear y borrar archivos;
  - la **Configuración** (`Ctrl+,`), para el ajuste;
  - **Narrador**, el lector de pantalla de Windows (`Ctrl+Win+Enter` para activarlo y desactivarlo), para oír los encabezados.

  Comprobar:
  - **Proyecto:** abrir este repositorio en la ventana de F5 muestra "En este proyecto" con Git, pnpm y Node, y "Todas" con npm, Docker y Terminal.
  - **En vivo:** crear un `Dockerfile` vacío en la raíz mueve Docker a "En este proyecto"; borrarlo lo devuelve a "Todas".
  - **Teclado:** las flechas pasan de la última de "En este proyecto" a la primera de "Todas", y Tab sale de la lista en una sola pulsación.
  - **Lector de pantalla** (audible): Narrador anuncia la lista "En este proyecto" al entrar en ella.
  - **Ajuste:** desactivar "Detect Project" deja la portada sin encabezados; activarlo los devuelve.
  - **Sin carpeta:** una ventana sin carpeta abierta (`Ctrl+Shift+N` en la ventana de F5) muestra la portada como siempre.
  - **Búsqueda:** al escribir, los resultados no muestran encabezados.

## 8. Cierre

- [x] 8.1 Dejar en verde `pnpm run verify` y `openspec validate project-detection --strict`. Archivar el change antes de abrir el PR a `develop`.
