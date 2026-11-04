## Context

- **Envío del catálogo:** `CommandsViewProvider.postCatalog(webview, shell)` construye `CategorySummary[]` con `buildCategorySummaries` y envía `{ type: 'catalog', shell, categories }`. También dispara `onDidSendCatalog`, que usan los tests de integración. Hoy se reenvía al cambiar el shell (`TargetShell.onDidChange`) y al cambiar los comandos propios (`CatalogService.onDidChange`).
- **Patrón de servicios testeables:** `TargetShell` no importa `vscode`. Recibe interfaces mínimas (`Subscribe<T>`, `Disposable`) y se prueba con Vitest. La detección sigue el mismo patrón.
- **Portada:**
  - `CategoryList` pinta un único `<ul role="list" aria-label={t('categoriesLabel')}>`, con las tarjetas Favoritos y Recientes delante;
  - usa `useRovingFocus(length, initial)`, cuyo `onKeyDown` va en el `<ul>` y cuyos elementos se registran por índice con `itemRef(index)`;
  - `focusCategoryId` restaura el foco al volver.
- **Pruebas del webview:** no hay pruebas de componentes. La lógica se aísla en funciones puras (`navigation.ts`) con tests en `test/unit/webview/`.
- **Integración:** `.vscode-test.mjs` no abre ninguna carpeta, así que hoy los tests corren sin workspace.
- **Ajustes:** `confirmDestructive` y `customCommands` usan `scope: application`.

## Goals / Non-Goals

**Goals:**
- Que las categorías del proyecto se vean primero sin coste perceptible: como mucho unas pocas comprobaciones de existencia por carpeta, sin leer archivos.
- Mantener la portada idéntica a la actual cuando no se detecta nada.
- Que la detección no dependa de `vscode`, para probarla con Vitest.

**Non-Goals:**
- Prisma u otras categorías nuevas.
- Buscar en subcarpetas o leer `packageManager` de `package.json`.
- Señales en las categorías propias.
- Cambiar el orden o el contenido de los resultados de búsqueda.

## Decisions

### D1. Señales y detección pura en `src/project/detect.ts`
- `PROJECT_SIGNALS: readonly { readonly file: string; readonly categoryId: string }[]` con las entradas de la spec.
- `detectCategories(roots: readonly R[], exists: (root: R, name: string) => Promise<boolean>): Promise<Set<string>>`:
  - comprueba cada señal en cada raíz, en paralelo;
  - una promesa rechazada cuenta como `false`;
  - el resultado es un `Set` de ids.
- No depende de `vscode`. El genérico `R` permite usar `Uri` en la extensión y strings en los tests.
- `SIGNAL_GLOB` es `'{.git,package.json,pnpm-lock.yaml,...}'` y se genera a partir de `PROJECT_SIGNALS` para el watcher.

**Alternativa descartada:** `workspace.findFiles`. Respeta `files.exclude`, que puede ocultar `.git`, y recorre más de lo necesario.

### D2. `ProjectDetector` en `src/project/ProjectDetector.ts`
Clase con interfaces mínimas al estilo de `TargetShell`:
- `folders()`: las URIs de las carpetas del workspace;
- `onDidChangeFolders`;
- `stat`: `vscode.workspace.fs.stat`, que funciona con sistemas de archivos remotos y virtuales;
- `watch(folder, glob)`: devuelve un `Subscribe<void>` con create y delete y un `Disposable`;
- `enabled()` y `onDidChangeEnabled`: el ajuste.

API:
- `current(): ReadonlySet<string>`;
- `onDidChange(listener)`;
- `refresh(): Promise<void>`;
- `dispose()`.

Comportamiento:
- **Al crearse:** si el ajuste está activo, crea un watcher por carpeta con `RelativePattern(folder, SIGNAL_GLOB)` y lanza una detección.
- **Cambios:** un evento de carpetas o de archivos programa una detección con un debounce de 200 ms. Un cambio del ajuste rehace los watchers y detecta en el acto.
- **Al terminar una detección:** solo emite si el conjunto cambió.
- **Carreras:** un contador de generación descarta un resultado si, mientras se calculaba, empezó otra detección.
- **Ajuste en `false`:** sin watchers y con `current()` vacío.
- **Ajuste:** `devcommands.detectProject` con scope por defecto (`window`), para poder desactivarlo en un workspace concreto. Se lee con `getConfiguration('devcommands').get('detectProject', true)`.

Solo se vigilan create y delete, porque el contenido no importa. El evento change se ignora.

### D3. `detected` en `catalog`
- `protocol.ts`: `{ type: 'catalog'; shell; categories; detected: readonly string[] }`.
- `postCatalog` filtra `detector.current()` por las categorías del mensaje y en su orden, así que un id detectado que no está en el catálogo nunca llega.
- `onDidSendCatalog` también expone `detected`.
- El provider recibe `ProjectDetector` en el constructor y, en `onDidChange`, reenvía solo `catalog`: los favoritos y los recientes no dependen de la detección.
- La primera detección es asíncrona. Si el `catalog` del handshake sale antes, sale con `detected: []` y se reenvía al terminar. Así no se retrasa la carga de la vista.

### D4. Secciones en el webview
- **Función pura `homeSections(categories, detected)`** en `webview-ui/src/navigation.ts`:
  - devuelve `{ detected: CategorySummary[]; rest: CategorySummary[] }` en el orden de `categories`;
  - ignora ids desconocidos;
  - sin detectadas, `detected` está vacío.
- **`CategoryList`:**
  - recibe `detected` y construye una única lista plana de entradas (tarjetas, detectadas y resto) para `useRovingFocus`, de modo que los índices son globales;
  - **sin secciones:** el mismo `<ul aria-label={t('categoriesLabel')}>` de hoy;
  - **con secciones:** un `<div>` con el `onKeyDown`, que contiene:
    - si hay tarjetas, `<ul aria-label={t('shortcutsLabel')}>` con ellas;
    - `<h2 id=…>` con el texto de `t('inThisProject')`, seguido de `<ul aria-labelledby>`;
    - `<h2 id=…>` con el texto de `t('allCategories')`, seguido de `<ul aria-labelledby>`;
  - los ids de los encabezados usan `useId`;
  - `itemRef(index)` usa el índice global, así que las flechas, Inicio y Fin cruzan las secciones y solo una entrada tiene `tabIndex=0`.
- **CSS:** `.section-heading` usa el estilo de cabecera de sección de VS Code: mayúsculas, `font-size: 11px`, `font-weight: 700` y `var(--vscode-sideBarSectionHeader-foreground)` con fallback al color del texto. Tiene un margen pequeño y no es enfocable.
- **`App`:** guarda `detected` del último `catalog` y lo pasa a `CategoryList`. `SearchResults` no lo recibe.
- **Textos:** `inThisProject`, `allCategories` y `shortcutsLabel` en los 11 diccionarios.

### D5. Manifiesto y textos
- **`package.json`:** `devcommands.detectProject` con `type: boolean`, `default: true` y `markdownDescription: "%config.detectProject%"`. No declara `scope`, así que se aplica el de por defecto.
- **`package.nls*.json`:** la descripción en los 11 idiomas, que enumera los archivos que se miran.

### D6. Pruebas
- **Unitarias (`test/unit/project/detect.test.ts`):**
  - cada señal por separado;
  - la unión de varias raíces;
  - sin raíces;
  - una comprobación que rechaza;
  - `terminal` nunca aparece;
  - cada `categoryId` de `PROJECT_SIGNALS` existe en el catálogo incluido;
  - `SIGNAL_GLOB` contiene todos los archivos.
- **Unitarias (`test/unit/project/ProjectDetector.test.ts`), con fakes y temporizadores falsos de Vitest:**
  - detección inicial;
  - un evento de archivo reprograma la detección y agrupa varios eventos;
  - solo emite si el resultado cambia;
  - con el ajuste en `false`, `current` queda vacío y no crea watchers;
  - al reactivarlo, detecta;
  - al cambiar las carpetas, rehace los watchers;
  - un resultado obsoleto se descarta;
  - `dispose` limpia.
- **Unitarias (`test/unit/webview/navigation.test.ts`):** `homeSections` con orden, ids desconocidos y la lista vacía.
- **Integración:**
  - `.vscode-test.mjs` abre `test/fixtures/workspace/`, que contiene `package.json` y `pnpm-lock.yaml` mínimos y sin dependencias, fuera del workspace de pnpm porque `pnpm-workspace.yaml` solo incluye `webview-ui`;
  - **test 1:** `onDidSendCatalog` trae `detected` igual a `['pnpm', 'node']`;
  - **test 2:** crear `Dockerfile` con `workspace.fs.writeFile` produce un `catalog` con `docker`, y en `finally` se borra y se espera el `catalog` sin `docker`;
  - **test 3:** `detectProject: false` (`ConfigurationTarget.Global`) da `detected: []`, y en `finally` se restaura.
  - Hay que comprobar que los tests existentes siguen pasando con una carpeta abierta.

## Risks / Trade-offs

- **[Watchers de `.git`]**
  - **Riesgo:** algunas configuraciones excluyen `.git` del watcher (`files.watcherExclude`), y en ese caso crear o borrar `.git` no se notifica en vivo.
  - **Mitigación:** se acepta. Es raro, y la siguiente detección (al cambiar otra señal, las carpetas o el ajuste) lo corrige.
- **[Primer `catalog` sin `detected`]**
  - **Riesgo:** en proyectos lentos (remotos), la portada aparece sin secciones y se reordena un instante después.
  - **Mitigación:** se acepta, porque no bloquear la carga es preferible. En local, la detección suele terminar antes del handshake.
- **[Workspace de pruebas]**
  - **Riesgo:** abrir una carpeta en los tests de integración puede cambiar el comportamiento de otros tests.
  - **Mitigación:** la carpeta es mínima y no contiene `.vscode/settings.json`. `pnpm run verify` lo confirma.
- **[Monorepos]**
  - **Riesgo:** un proyecto cuyo `Dockerfile` está en `api/` no detecta Docker.
  - **Mitigación:** decisión explícita (solo la raíz). Queda anotado para más adelante.
