# Tasks

## 1. Protocolo de mensajes

- [x] 1.1 Crear `src/messaging/protocol.ts` con `WebviewMessage`, `ExtensionMessage` e `isWebviewMessage` (D4), y añadir `src/messaging/**` al `include` de `test/unit/tsconfig.json`. Verificar con `pnpm run check-types`
- [x] 1.2 Crear `test/unit/messaging/protocol.test.ts` con los casos de D7 (válido, `null`, string, `{}`, tipo desconocido como `runShell`, propiedades extra, `type` no string). Verificar con `pnpm run test:unit`

## 2. Vista y proveedor

- [x] 2.1 Crear `src/views/webviewHtml.ts` con `buildWebviewHtml` (D3) y `test/unit/views/webviewHtml.test.ts` con las aserciones de D7 (CSP con `default-src 'none'` y nonce, sin `unsafe-*`, nonce en el `<script>`, escapado). Verificar con `pnpm run test:unit`
- [x] 2.2 Crear `media/icon.svg` (monocromo, `currentColor`) y actualizar `contributes` en `package.json`: `viewsContainers` + `views` y sin `commands` (D1). Verificar con `npx @vscode/vsce ls --no-dependencies` que `media/icon.svg` entra en el paquete
- [x] 2.3 Crear `src/views/CommandsViewProvider.ts` (D2) y reescribir `src/extension.ts`: registra el proveedor, crea el canal de log y devuelve la API `{ onDidReceiveReady }`, sin `helloWorld`. Verificar con `pnpm run check-types` y `pnpm run lint`

## 3. Webview

- [x] 3.1 Limpiar la plantilla: borrar `App.css`, `src/assets/` y `public/icons.svg`, reducir `index.css` a reset + variables `--vscode-*` y añadir `@types/vscode-webview` como devDependency de `webview-ui`. Verificar con `pnpm run lint:webview` y que `pnpm run build:webview` ya no emite `hero.png` ni los SVG de la demo
- [x] 3.2 Crear `webview-ui/src/vscode.ts` y reescribir `App.tsx` y `main.tsx` según D5 (handshake, estados de carga e init, ARIA, `import type` del protocolo). Verificar con `pnpm run build:webview` sin errores de `tsc -b` y comparar el tamaño de `dist/webview/assets/index.js` con los 222 KB anteriores

## 4. Flujo de desarrollo

- [x] 4.1 Añadir `build:webview` a `compile` y el script `watch:webview` (D6). Actualizar `.vscode/tasks.json` (tarea en segundo plano con su `problemMatcher`) y `.vscode/settings.json` (`npm.packageManager: pnpm`). Verificar que, tras borrar `dist/`, `pnpm run compile` genera `dist/extension.js` y `dist/webview/index.html`

## 5. Tests de integración

- [x] 5.1 Reescribir `src/test/extension.test.ts` (D7): abre la vista con `workbench.view.extension.devcommands`, espera `onDidReceiveReady` (timeout 10 s) y comprueba que la extensión está activa. Verificar con `pnpm test` en verde, y que falla si se comenta temporalmente el `postMessage({type:'ready'})` del webview

## 6. Verificación manual (F5)

- [ ] 6.1 Con F5: el icono aparece en la Activity Bar; al abrir la vista se muestra "DevCommands" con la versión; al cambiar a tema claro, oscuro y alto contraste los colores cambian sin recargar; y en la paleta no hay "Hello World". El autor confirma la verificación visual

## 7. Documentación

- [x] 7.1 Añadir a `CHANGELOG.md` en `[Unreleased]` → "Added": "Vista lateral de DevCommands en la Activity Bar con webview seguro (CSP + nonce) y handshake inicial", y en "Removed": "Comando de ejemplo Hello World". Marcar `webview-shell` (0.3) como ✅ en `docs/ROADMAP.md`. Verificar leyendo ambos archivos

## 8. Verificación final

- [ ] 8.1 `pnpm run verify` en verde en Windows y `xvfb-run -a pnpm run verify` en WSL (cierre de la Fase 0). `openspec validate webview-shell --strict` sin errores. `/opsx:archive` antes de abrir el PR
