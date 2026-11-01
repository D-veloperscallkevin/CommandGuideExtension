# Design

## Context

- El repositorio tiene dos proyectos npm con sus propios lockfiles: la raíz (extensión: `check-types`, `lint`, `test:unit`, `test`, `package`) y `webview-ui/` (`build` = `tsc -b && vite build`, `lint` = `oxlint`, sin tests).
- `npm run package` (y por tanto `vscode:prepublish`) solo ejecuta esbuild. El webview no se construye desde la raíz.
- `npm test` usa `@vscode/test-cli`, que descarga VS Code (~100 MB) en `.vscode-test/` y necesita una pantalla. En Linux, `xvfb-run` viene preinstalado en `ubuntu-latest`.
- El índice de git ya está entero en LF. Los avisos LF→CRLF vienen de `core.autocrlf` en la copia local de Windows.
- Existe el ruleset `protect-main-staging-develop` (id 26278428): PR obligatorio, sin borrado ni force push, merges squash/merge.
- El repo es público con plan gratuito, así que Actions y los rulesets salen gratis.

## Goals / Non-Goals

**Goals:**
- Un único workflow con los mismos checks en los tres SO, legible y fácil de ampliar en `release-pipeline`.
- Que cambiar la matriz no rompa nunca la protección de ramas.
- Que un clon limpio genere un paquete completo.

**Non-Goals:**
- Empaquetado `.vsix`, control de tamaño, artefactos y publicación (change 1.8 y 2.9).
- Workflows diferenciados por rama de destino.
- Tests contra la versión mínima de VS Code (1.90).
- Dependabot y CodeQL (se pueden añadir después sin cambiar este diseño).

## Decisions

### D1. Un workflow, un job matriz y un job agregador
`.github/workflows/ci.yml`:

```
on: pull_request -> branches [develop, staging, main]
concurrency: ci-${{ github.workflow }}-${{ github.event.pull_request.number }}, cancel-in-progress: true
permissions: contents: read

jobs:
  checks:  matrix.os [ubuntu-latest, windows-latest, macos-latest], fail-fast: false
  ci-ok:   needs: checks, if: always()
           falla salvo que needs.checks.result == 'success'
```

- *Por qué el agregador:* un ruleset que exige `checks (ubuntu-latest)` se queda bloqueado para siempre si la matriz cambia de nombre. `ci-ok` es estable. Con `if: always()`, `ci-ok` también se ejecuta (y falla) cuando `checks` falla o se cancela. Sin eso, quedaría como "skipped", y un check skipped cuenta como superado.
- *Alternativa descartada:* exigir cada job de la matriz por separado. Es frágil, por lo que acabamos de ver.
- `permissions: contents: read` sigue el principio de mínimo privilegio, porque el workflow no escribe nada.

### D2. Pasos del job `checks`
1. `actions/checkout`
2. `actions/setup-node` con `node-version-file: .nvmrc` y `cache: npm`, con `cache-dependency-path` apuntando a los dos lockfiles
3. `npm ci` y `npm ci --prefix webview-ui`
4. `npm run check-types`, `npm run lint` y `npm run lint:webview`
5. `npm run test:unit`
6. `npm run package`: build de producción de la extensión y del webview (D3), que incluye el `tsc -b` del webview
7. `actions/cache` de `.vscode-test/` (clave: SO + hash de `.vscode-test.mjs` y `package-lock.json`, con `restore-keys` por SO)
8. Tests de integración: `xvfb-run -a npm test` en Linux y `npm test` en Windows y macOS

Las versiones de las actions se fijan a la última major estable al implementar.

### D3. Build completo desde la raíz
Scripts nuevos en `package.json` de la raíz:
- `"build:webview": "npm --prefix webview-ui run build"`
- `"lint:webview": "npm --prefix webview-ui run lint"`
- `package` añade `&& npm run build:webview` al final. `vscode:prepublish` ya llama a `package`, así que el `.vsix` siempre incluye el webview.

`compile` (que usa `pretest` y F5) no cambia: los tests de integración aún no cargan el webview y así el ciclo local sigue rápido. Cuando `webview-shell` lo necesite, ese change decidirá si `compile` también construye el webview.
- *Alternativa descartada:* npm workspaces. Cambiaría la instalación de los dos proyectos y el layout de `node_modules` para ganar poco. Se puede reconsiderar más adelante.

### D4. Node 24 vía `.nvmrc`
`.nvmrc` = `24`. Solo afecta a las herramientas: la extensión corre en el Node de Electron de VS Code. Fijar una sola versión evita una matriz de Node sin valor. Node 20, el prerrequisito que daba el roadmap, ya no tiene soporte.

### D5. Finales de línea
`.gitattributes`:
```
* text=auto eol=lf
*.png binary
*.ico binary
*.vsix binary
```
Como el índice ya está en LF, `git add --renormalize .` no debería producir cambios. Se ejecuta para confirmarlo.

### D6. Activar el check obligatorio después de la primera ejecución
El ruleset se actualiza con `gh api` (PUT de `rulesets/26278428`, conservando las reglas actuales) añadiendo:
```
{ "type": "required_status_checks", "parameters": {
    "strict_required_status_checks_policy": false,
    "required_status_checks": [{ "context": "ci-ok", "integration_id": 15368 }] } }
```
- Se hace **después** de que `ci-ok` haya corrido en el PR de este change. Así GitHub ya conoce el check y no hay riesgo de bloquear un PR esperando un check que nunca llega.
- `integration_id: 15368` (GitHub Actions) impide que otra app publique un `ci-ok` falso.
- `strict: false` evita tener que actualizar la rama con `develop` antes de cada merge. Con un solo desarrollador y squash merge, el coste supera al beneficio.

### D7. Mensajes webview ↔ extensión
No se añade ni modifica ningún mensaje.

### D8. Dependencias
Ninguna nueva. Las actions oficiales de GitHub (`checkout`, `setup-node`, `cache`) no son dependencias del paquete.

## Risks / Trade-offs

- [Tests de integración inestables en los runners (GPU o pantalla)] → `xvfb-run -a` en Linux. Si falla de forma intermitente en algún SO, se documenta y se investiga en un change aparte. No se desactiva en silencio.
- [macOS hace más lento cada PR] → Los jobs corren en paralelo y `concurrency` cancela ejecuciones obsoletas. Se acepta, por decisión de producto.
- [La versión de VS Code "stable" cambia y la caché queda obsoleta] → `@vscode/test-cli` comprueba la versión y descarga la nueva si hace falta. La caché solo acelera.
- [Error al editar el ruleset por API y perder reglas existentes] → Leer el ruleset completo con GET antes del PUT y verificar después que siguen las reglas `deletion`, `non_fast_forward` y `pull_request`.
- [El build del webview en Windows usa rutas POSIX] → Vite y `npm --prefix` funcionan en los tres SO. La matriz lo verifica.

## Migration Plan

1. Se fusiona el workflow con el PR de este change, que ya ejecuta la verificación sobre sí mismo.
2. Con `ci-ok` en verde en ese PR, se activa el check obligatorio (D6) antes del merge.
3. Rollback: quitar la regla `required_status_checks` del ruleset y revertir el squash merge.
