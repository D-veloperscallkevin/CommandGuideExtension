# Design

## Context

- `src/extension.ts` solo registra `devcommands.helloWorld`. `activationEvents` está vacío y `engines.vscode` es `^1.90.0`.
- `webview-ui/` es la plantilla de Vite (React 19, TS 7, oxlint). `vite.config.ts` ya emite nombres fijos (`assets/index.js`, `assets/index.css`) en `dist/webview`, con `base: './'`.
- `pnpm run compile` (que usan F5 y `pretest`) no construye el webview, y la tarea `watch` de `.vscode/tasks.json` solo vigila `tsc` y esbuild. Así lo dejó `ci-setup`, a la espera de este change.
- `src/catalog/CatalogService.ts` ya exporta `resolveLocale` (en/es con fallback en).
- Los tests unitarios (Vitest) incluyen `src/catalog/**` en `test/unit/tsconfig.json`. Los de integración (Mocha + `@vscode/test-cli`) viven en `src/test/`.

## Goals / Non-Goals

**Goals:**
- Vista lateral segura (CSP + nonce + recursos acotados) con activación perezosa.
- Un protocolo de mensajes que los changes siguientes amplíen añadiendo tipos, sin rediseñarlo.
- Que la lógica crítica de seguridad (validación y CSP) sea pura y testeable con Vitest.

**Non-Goals:**
- Contenido funcional (catálogo, navegación) y traducción de la interfaz.
- Persistir estado del webview (`setState`). Llega con `command-list`.
- Validar en el webview los mensajes de la extensión (fuente confiable). Allí basta con tipar.

## Decisions

### D1. Contribuciones en `package.json`
```json
"viewsContainers": { "activitybar": [
  { "id": "devcommands", "title": "DevCommands", "icon": "media/icon.svg" } ] },
"views": { "devcommands": [
  { "type": "webview", "id": "devcommands.commands", "name": "DevCommands" } ] }
```
- `commands` y el registro de `helloWorld` desaparecen.
- `activationEvents` sigue vacío: desde VS Code 1.74, contribuir una vista genera solo `onView:devcommands.commands`. Nunca `"*"`.
- `media/icon.svg`: monocromo, 24×24, `fill="currentColor"` (VS Code lo tiñe según el tema). Se incluye en el paquete. Los Codicons no se pueden usar en `viewsContainers`.

### D2. `CommandsViewProvider` (`src/views/CommandsViewProvider.ts`)
- Implementa `WebviewViewProvider`. Se registra en `activate` con `registerWebviewViewProvider('devcommands.commands', provider)`.
- `resolveWebviewView`:
  - `webview.options = { enableScripts: true, localResourceRoots: [Uri.joinPath(extensionUri, 'dist', 'webview')] }`
  - `webview.html = buildWebviewHtml({ scriptUri, styleUri, cspSource: webview.cspSource, nonce: createNonce() })`
  - `onDidReceiveMessage` → `isWebviewMessage(msg)`. Si no es válido, `log.warn(...)` y no hace nada. Si es `ready`, responde `postMessage({ type: 'init', locale: resolveLocale(vscode.env.language), version })` y dispara el evento `onDidReceiveReady`.
- Sin `retainContextWhenHidden`: al ocultarse, el webview se destruye y al volver repite el handshake (escenario "Recarga de la vista"). Ahorra memoria.
- `createNonce()` usa `crypto.randomBytes(16).toString('base64')` (módulo de Node, sin dependencias).
- Registro: `vscode.window.createOutputChannel('DevCommands', { log: true })`. API estable desde 1.74.

### D3. HTML puro (`src/views/webviewHtml.ts`)
`buildWebviewHtml(opts): string`, sin importar `vscode`, para testearlo con Vitest:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'none';
  script-src 'nonce-${nonce}'; style-src ${cspSource}; img-src ${cspSource} data:;
  font-src ${cspSource};">
<link rel="stylesheet" href="${styleUri}">
<div id="root"></div>
<script type="module" nonce="${nonce}" src="${scriptUri}"></script>
```
- *Por qué generar el HTML en lugar de leer `dist/webview/index.html`:* los nombres de los assets ya son fijos, y reescribir con regex el HTML que produce Vite es frágil. El `index.html` de Vite queda solo para `pnpm dev`.
- Los valores interpolados se escapan para atributos HTML.

### D4. Protocolo (`src/messaging/protocol.ts`)
```ts
export type WebviewMessage = { type: 'ready' };                                  // webview -> extensión
export type ExtensionMessage = { type: 'init'; locale: Locale; version: string }; // extensión -> webview
export function isWebviewMessage(value: unknown): value is WebviewMessage;
```
- Validación escrita a mano: comprueba que es un objeto plano, que `type` está en la lista conocida y que tiene exactamente las claves declaradas. Sin zod ni Ajv en runtime, para mantener cero dependencias.
- Archivo puro: solo importa el tipo `Locale` de `src/catalog/types.ts`.
- El webview importa **solo tipos** (`import type { ... } from '../../src/messaging/protocol'`). Con `verbatimModuleSyntax`, el import se borra al compilar y no cruza código al bundle.
- *Alternativa descartada:* una carpeta `shared/` o un paquete del workspace. Para un archivo de tipos es más estructura de la necesaria. Se reconsidera si el protocolo crece mucho.

### D5. Webview (`webview-ui/src/`)
- Se eliminan `App.css`, `assets/` (hero, logos) y `public/icons.svg`. `index.css` se reduce a un reset y variables `--vscode-*` (`--vscode-foreground`, `--vscode-font-family`, `--vscode-sideBar-background`…).
- `vscode.ts`: envoltorio de `acquireVsCodeApi()` (se llama una sola vez) con `postMessage(msg: WebviewMessage)`. Tipos de `@types/vscode-webview` (devDependency de `webview-ui`).
- `App.tsx`:
  - envía `ready` en un `useEffect` y escucha `message` con un listener que limpia al desmontar;
  - antes de `init` muestra "Cargando…" con `role="status"` y `aria-live="polite"`;
  - después muestra "DevCommands" y `v{version}`;
  - el contenedor es `<main aria-label="DevCommands">`.
- `StrictMode` puede enviar `ready` dos veces en desarrollo. La extensión es idempotente, así que no afecta.
- Los textos del marcador van en inglés y sin traducir. `ui-i18n` (1.1) los traducirá.

### D6. Flujo de desarrollo
- `package.json`:
  - `compile` añade `&& pnpm run build:webview`, así F5 y `pretest` tienen siempre un webview construido;
  - nuevo `"watch:webview": "pnpm --filter webview-ui exec vite build --watch"`, que `npm-run-all -p watch:*` recoge solo.
- `.vscode/tasks.json`: la tarea `watch` añade `npm: watch:webview` como tarea en segundo plano, con un `problemMatcher` cuyo `background` usa `beginsPattern` "build started" y `endsPattern` "built in".
- `.vscode/settings.json`: `"npm.packageManager": "pnpm"`, para que las tareas `npm:` de VS Code usen pnpm.

### D7. Tests
- **Vitest** (`test/unit/`; se añaden `src/messaging/**` y `src/views/webviewHtml.ts` al `include` de `test/unit/tsconfig.json`):
  - `isWebviewMessage`: acepta `{type:'ready'}`; rechaza `null`, un string, `{}`, un tipo desconocido, propiedades extra y un `type` no string.
  - `buildWebviewHtml`: la CSP contiene `default-src 'none'` y `script-src 'nonce-X'`; no contiene `unsafe-inline` ni `unsafe-eval`; el `<script>` lleva el mismo nonce; las URIs se escapan.
- **Integración (Mocha)** (`src/test/extension.test.ts`):
  - `activate` devuelve una API `{ onDidReceiveReady: Event<void> }`, que es la vía estándar de VS Code para exponer funciones de una extensión (`extension.exports`);
  - el test ejecuta `workbench.view.extension.devcommands` (comando generado por el contenedor) y espera `onDidReceiveReady` con un timeout de 10 s;
  - después comprueba que la extensión está activa;
  - sustituye al "Sample test".
- La comprobación visual del tema y del lector de pantalla se hace a mano con F5 (tarea de verificación manual).

### D8. Mensajes webview ↔ extensión
| Mensaje | Dirección | Forma | Respuesta |
| --- | --- | --- | --- |
| `ready` | webview → extensión | `{ type: 'ready' }` | `init` |
| `init` | extensión → webview | `{ type: 'init', locale: 'en' \| 'es', version: string }` | — |

### D9. Dependencias
- **Runtime de la extensión:** ninguna (solo `vscode` y `node:crypto`).
- **Desarrollo:** `@types/vscode-webview` en `webview-ui`. Solo aporta los tipos de `acquireVsCodeApi`.

## Risks / Trade-offs

- [El test de integración depende de que el webview se renderice en el runner] → Ya funciona en Windows y en WSL con `xvfb`. El timeout de 10 s da margen. Si es inestable, se investiga en lugar de desactivarlo.
- [El catálogo entra ahora en el bundle de la extensión por importar `resolveLocale`] → Era lo esperado (lo anotó `catalog-schema` D4): son unos KB.
- [`pretest` y F5 tardan unos segundos más al construir el webview] → Se acepta. `watch` lo mantiene incremental durante el desarrollo.
- [Importar tipos del webview desde `../../src`] → Es solo `import type`. Si TS 7 (`tsc -b`) se queja por estar fuera del `include`, se añade el archivo del protocolo al `include` de `tsconfig.app.json`.

## Migration Plan

Sin datos ni usuarios. Rollback: revertir el squash merge.
