# Design

## Context

- El repositorio tenía dos proyectos npm con sus propios lockfiles (D10 los une en un workspace pnpm): la raíz (extensión: `check-types`, `lint`, `test:unit`, `test`, `package`) y `webview-ui/` (`build` = `tsc -b && vite build`, `lint` = `oxlint`, sin tests).
- `pnpm test` (antes `npm test`) usa `@vscode/test-cli`, que descarga VS Code en `.vscode-test/` y necesita una pantalla.
- No se usa GitHub Actions (ver `proposal.md`, Why). GitHub no puede exigir un check, así que la verificación tiene que vivir en la máquina de quien hace el push.
- Entorno del autor: Windows 10 con Git for Windows y WSL 2 (Ubuntu). En Windows 10 no hay WSLg, así que dentro de WSL no hay pantalla para VS Code.
- El índice de git ya está entero en LF.
- El `~/.npmrc` del autor tiene `ignore-scripts=true`, así que npm nunca ejecuta `prepare` en `npm install` ni en `npm ci`. Comprobado: `core.hooksPath` quedaba vacío.
- El ruleset `protect-main-staging-develop` exige PR y bloquea el borrado y el force push. No se modifica.

## Goals / Non-Goals

**Goals:**
- Un único comando de verificación, idéntico en Windows y en Linux.
- Que sea imposible olvidarse de verificar: se ejecuta solo antes de cada push.
- Cero dependencias nuevas.
- Que un clon limpio genere un paquete completo.

**Non-Goals:**
- Bloqueo del merge en GitHub (requeriría CI en la nube).
- Cobertura en macOS.
- Empaquetado `.vsix`, control de tamaño y publicación (changes 1.8 y 2.9).
- Tests contra la versión mínima de VS Code (1.90).

## Decisions

### D1. `scripts/verify.mjs`: orquestador sin dependencias
Script Node (ESM) que `pnpm run verify` invoca:
1. Lee `.nvmrc` y compara su versión mayor con `process.versions.node`. Si no coinciden, falla con "Node X esperado, encontrado Y".
2. Ejecuta en orden `check-types`, `lint`, `lint:webview`, `test:unit`, `package` y `test` con `spawnSync('pnpm', ['run', step], { stdio: 'inherit', shell: true })`.
3. Antes de cada paso imprime `▶ <paso>`. Si un paso falla, imprime `✖ verify falló en: <paso>` y sale con el código del paso. Al final imprime `✔ verify OK`.
- *Por qué un script y no `a && b && c` en `package.json`:* da el mismo comportamiento en cmd, PowerShell y sh, nombra el paso que falla y permite la comprobación de Node.
- `package` ya incluye `check-types` y `lint`. Se acepta repetirlos para que cada fallo se atribuya a un paso con nombre claro. Coste: unos segundos.

### D2. Hook `.githooks/pre-push`
```sh
#!/bin/sh
echo "pre-push: pnpm run verify (salta con git push --no-verify)"
pnpm run verify
```
- Git for Windows ejecuta los hooks con su `sh` incluido, así que funciona aunque el push se lance desde PowerShell o desde VS Code.
- Se marca como ejecutable en el índice (`git update-index --chmod=+x`) para Linux y WSL.
- *Alternativa descartada:* Husky o simple-git-hooks. Añaden una dependencia para algo que git ya hace con `core.hooksPath`.

### D3. Activación con `prepare` → `scripts/install-hooks.mjs`
`"prepare": "node scripts/install-hooks.mjs"`. Si existe `.git` en la raíz, ejecuta `git config core.hooksPath .githooks`. Si no existe, no hace nada y sale con 0. pnpm ejecuta el `prepare` del proyecto raíz en `pnpm install`. Además, pnpm 11+ solo lee del `.npmrc` los ajustes de autenticación y de registry, así que el `ignore-scripts=true` del usuario no lo desactiva (D10).

### D4. Coste del push
`verify` incluye los tests de integración, que abren una ventana de VS Code unos segundos. Un push tarda alrededor de un minuto más. Se acepta: el push es poco frecuente comparado con los commits, y el hook es `pre-push`, no `pre-commit`.

### D5. Linux con WSL antes de cada release
Procedimiento (documentado en `docs/ROADMAP.md`, paso del PR de release):
1. Clonar el repo **dentro del sistema de archivos de WSL** (`~/src/...`), no en `/mnt/c/...`. esbuild, rollup y oxlint instalan binarios distintos según el SO, y compartir `node_modules` entre Windows y Linux los rompe. Además, `/mnt/c` es mucho más lento.
2. Node 24 en WSL con nvm (`nvm install 24`), `npm i -g pnpm@11.21.0`, y `sudo apt-get install -y xvfb libnss3 libgbm1 libgtk-3-0t64 libasound2t64 libatk-bridge2.0-0t64 libxkbfile1 libsecret-1-0 libxss1`. Validado en Ubuntu 26.04 (WSL 2, Windows 10) el 2026-11-01: con estos paquetes VS Code 1.144 arranca bajo `xvfb-run`. El aviso `GpuControl.CreateCommandBuffer` de Electron es inofensivo. Al ejecutar desde Git Bash hay que usar `wsl.exe --exec` y `MSYS_NO_PATHCONV=1` para que no se reescriban las rutas ni las variables.
3. Instalar pnpm en WSL (`npm i -g pnpm`) y ejecutar `git checkout <rama> && pnpm install --frozen-lockfile && xvfb-run -a pnpm run verify`.
4. Marcar la casilla correspondiente en la plantilla del PR.

### D6. Plantilla de PR `.github/pull_request_template.md`
Es una función gratuita de GitHub, sin Actions. Contiene un checklist:
- `pnpm run verify` en verde en local (el hook lo garantiza salvo `--no-verify`);
- `/opsx:archive` ejecutado;
- **solo en PR de release:** `pnpm run verify` en verde en WSL o Linux.

### D7. Retirada de GitHub Actions
Se borra `.github/workflows/ci.yml`. El ruleset no cambia: nunca se le añadió un check. `.github/` sigue ignorado en `.vscodeignore`.

### D8. Sin cambios en lo ya decidido
- `.nvmrc` = `24`.
- `.gitattributes` con `* text=auto eol=lf`.
- Scripts `build:webview` y `lint:webview`.
- `package` encadena `build:webview`, así que `vscode:prepublish` produce un paquete completo.
- `compile`, que usan F5 y `pretest`, sigue construyendo solo la extensión.

### D9. Dependencias y mensajes
- Dependencias nuevas: ninguna.
- Mensajes webview ↔ extensión: ninguno.

### D10. Migración a pnpm
- **Workspace:** `pnpm-workspace.yaml` con `packages: [webview-ui]`. Un único `pnpm-lock.yaml` y un único `pnpm install` para las dos mitades. Los scripts de la raíz pasan a `"build:webview": "pnpm --filter webview-ui run build"` y `"lint:webview": "pnpm --filter webview-ui run lint"`.
- **Lockfile:** `pnpm import` convierte los `package-lock.json` existentes sin cambiar versiones. Después se borran.
- **Versión fijada:** `"packageManager": "pnpm@11.21.0"` en el `package.json` de la raíz: la versión que el autor ya tiene instalada con Volta (cumple el mínimo v11 que hace falta para D3). Subir a la 12.x es un cambio aparte. En una máquina nueva se instala con `npm i -g pnpm` o con Volta; no se usa Corepack porque está en retirada.
- **Scripts de dependencias:** `allowBuilds` en `pnpm-workspace.yaml`, con `esbuild: false`. esbuild trae su binario como dependencia opcional por plataforma y su `postinstall` solo lo comprueba. Cualquier otra dependencia con scripts hará fallar la instalación (`strictDepBuilds`) hasta que se revise.
- **Defaults de pnpm 11 que se mantienen:** `minimumReleaseAge` (no instala versiones publicadas hace menos de un día) y `node_modules` estricto, sin dependencias fantasma.
- *Alternativa descartada:* mantener npm y pedir un `npm run hooks:install` manual en cada clon. Funciona, pero rompe la activación automática con `ignore-scripts` y no aporta la lista de builds autorizados.
- **Para el change 1.8:** `vsce package` usa `npm list` internamente. Con pnpm hay que usar `vsce package --no-dependencies`, que es válido porque el bundle no tiene dependencias de runtime.

## Risks / Trade-offs

- [Se puede saltar el hook con `--no-verify` o empujando desde un clon sin `pnpm install`] → Es una red de seguridad, no un candado. La plantilla de PR obliga a confirmarlo y con un solo desarrollador el riesgo es bajo. Si entra más gente, se reconsidera un CI en la nube.
- [Sin cobertura en macOS] → Riesgo aceptado. Los bugs típicos de rutas y de shell ya los cubren Windows y Linux. Se puede añadir cuando haya un usuario o tester con Mac.
- [Los tests de integración en WSL no arrancan por falta de librerías de sistema] → El procedimiento D5 documenta los paquetes necesarios. La tarea de WSL lo valida una vez.
- [Push más lento] → Ver D4.
- [El `node_modules` estricto de pnpm destapa dependencias no declaradas, por ejemplo en `@vscode/test-cli` o en mocha] → `verify` lo detecta. Se declara la dependencia que falte. No se usa `shamefullyHoist`.
- [pnpm no está instalado en una máquina nueva] → El roadmap documenta `npm i -g pnpm` en los prerrequisitos. `packageManager` avisa si la versión no coincide.

## Migration Plan

1. Implementar en la misma rama `feature/ci-setup` y actualizar el PR #3.
2. El propio push de la implementación ya pasa por el hook.
3. Rollback: `git config --unset core.hooksPath` y revertir el squash merge.
