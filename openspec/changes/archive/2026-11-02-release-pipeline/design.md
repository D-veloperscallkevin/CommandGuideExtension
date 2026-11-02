# Design

## Context

- **`package.json`:**
  - tiene `name: devcommands` y `version: 0.0.1`, pero no `publisher` ni `repository`;
  - `vscode:prepublish` ya ejecuta `pnpm run package`, que compila la extensión con esbuild en modo producción y el webview con Vite.
- **`.vscodeignore`:** ya excluye `src/`, `webview-ui/`, `catalog/`, `openspec/`, `docs/`, `test/`, `node_modules/`, `**/*.map`, `**/*.ts` y otros. El webview compilado vive en `dist/webview/`.
- **`.gitignore`:** ya ignora `*.vsix`.
- **`scripts/verify.mjs`:** es un script de Node sin dependencias que lanza `pnpm run <paso>` con `shell: true` y termina nombrando el paso que falla. `release:package` sigue el mismo estilo.
- **`pnpm-workspace.yaml`:** declara en `allowBuilds` los scripts de instalación revisados. El spec `continuous-integration` exige que una dependencia con scripts sin revisar haga fallar la instalación.
- **`vsce` (documentación oficial, vía Context7):**
  - **Prepublicación:** `vsce package` ejecuta `npm run vscode:prepublish`, o `yarn` si lo detecta.
  - **Dependencias:** sin `--no-dependencies` recorre `npm list --production`, que no sirve con pnpm.
  - **Opciones de `package`:** `--out`, `--pre-release`, `--allow-missing-repository` y `--ignoreFile`. También se pueden configurar en `package.json` bajo `"vsce"`.
  - **Repositorio:** sin `repository`, `vsce` falla al reescribir los enlaces relativos del README.
  - **`vsce ls`:** lista los archivos que entrarían en el paquete sin crearlo.
- **Test de integración:** `src/test/extension.test.ts` busca la extensión por `packageJSON.name`, porque el publisher no estaba decidido.
- **Puerta de la fase 1** (`docs/ROADMAP.md`): `.vsix` de menos de 2 MB, probado en PowerShell y en WSL o Linux.

## Goals / Non-Goals

**Goals:**

- Un único comando local que deje un `.vsix` listo para instalar, o que falle diciendo por qué.
- Que el control de tamaño y contenido no dependa de revisar el paquete a mano.
- Identidad definitiva de la extensión (`aguilardigital.devcommands`) desde la primera release instalable.
- Versión `0.1.0` pre-release, coherente con la fase 1.

**Non-Goals:**

- Publicar en el Marketplace u Open VSX, tokens y tags (2.9).
- Icono PNG, `displayName` definitivo, capturas y `galleryBanner` (2.9).
- Firmar el paquete (`vsce-sign`).
- Paquetes por plataforma (`--target`): la extensión no tiene binarios nativos.
- Añadir `release:package` a `pnpm run verify`: alargaría cada push y el build de producción ya forma parte de `verify`.

## Decisions

### D1. Script `scripts/release-package.mjs`

Pasos, en orden; el primero que falle termina con `✖ release:package falló en: <motivo>` y código 1:

1. **Lista de archivos:** `pnpm exec vsce ls --no-dependencies`. Se valida con `disallowedFiles()` (D2) **antes** de empaquetar, así el error sale pronto y nombra los archivos.
2. **Empaquetado:** `pnpm exec vsce package --no-dependencies --pre-release --out <nombre>.vsix`.
   - El nombre es `devcommands-<version>.vsix`, a partir de `package.json`.
   - `vsce` ejecuta `vscode:prepublish` (`pnpm run package`). Aunque el usuario tenga `ignore-scripts=true` en `~/.npmrc`, `npm run <script>` explícito sí se ejecuta; solo se omiten los `pre`/`post`.
   - `vsce ls` no compila, así que el paso 1 no comprueba los archivos de `dist/`. Por eso, tras empaquetar, se repite `vsce ls`, ya con `dist/` generado, y se valida otra vez.
3. **Tamaño:** se lee con `statSync` y se valida con `checkSize()` (D2).
4. **Resumen:** `✔ devcommands-0.1.0.vsix · 312 KB · 23 archivos`, con ruta absoluta.

Por qué `vsce ls` y no abrir el zip: `ls` usa la misma selección de archivos que `package` (`.vscodeignore` y los ignores por defecto) y evita escribir un lector de zip. La lista se compara con la ruta relativa de cada archivo, como la imprime `vsce ls`. Los archivos de control que `vsce` añade (`extension.vsixmanifest`, `[Content_Types].xml`) no aparecen en `ls` y no se validan.

Se ejecuta con `pnpm exec`, que usa la versión de `vsce` fijada en el proyecto, nunca una global, y `shell: true` como en `verify.mjs`, para que funcione en PowerShell, cmd y bash.

### D2. Comprobaciones puras en `scripts/release-check.mjs`

- `MAX_VSIX_BYTES = 2 * 1024 * 1024`.
- `checkSize(bytes)` devuelve `null` si `bytes < MAX_VSIX_BYTES`, o un mensaje con ambos tamaños en KB o MB.
- `disallowedFiles(paths)` devuelve las rutas no permitidas, normalizadas a `/`.
  - **Permitidas:**
    - `package.json`, `README.md`, `CHANGELOG.md`, `LICENSE` o `LICENSE.md`/`LICENSE.txt`;
    - `package.nls.json` y `package.nls.<idioma>.json`;
    - cualquier archivo bajo `dist/` que no termine en `.map`;
    - `media/**` y `l10n/**`.
  - **No permitidas:** todo lo demás, incluidos `node_modules/`, `src/`, `webview-ui/`, `catalog/` y `.vsix` anteriores.
- `formatBytes(bytes)` da un formato legible (`312 KB`, `1.4 MB`).
- `vsixName(pkg)` devuelve `` `${pkg.name}-${pkg.version}.vsix` ``.

Es JavaScript (`.mjs`) con JSDoc, como el resto de `scripts/`. Lo importa `test/unit/scripts/release-check.test.ts`. Si `check-types` del test necesita tipos, se añade un `release-check.d.mts` mínimo o `allowJs` solo en `test/unit/tsconfig.json`; se decide en el apply y se anota aquí.

### D3. `@vscode/vsce` y la instalación segura

- **Dependencia:** `pnpm add -D --save-exact @vscode/vsce`, con la última versión estable en el momento del apply.
- **Scripts de instalación:**
  - Si `pnpm install` informa de scripts sin revisar en dependencias de `vsce` (por ejemplo `@vscode/vsce-sign` o `keytar`), se añaden a `allowBuilds` con `false` y un comentario: solo sirven para firmar o guardar el token de publicación, y empaquetar no los usa.
  - Se comprueba que `vsce package` funciona sin ellos.
  - Si alguno resultara imprescindible, se para y se consulta.

### D4. Manifiesto y versión

- **`package.json`:**
  - `"publisher": "aguilardigital"`;
  - `"repository": { "type": "git", "url": "https://github.com/D-veloperscallkevin/CommandGuideExtension.git" }`;
  - `"vsce": { "dependencies": false }`, para que un `vsce` lanzado a mano tampoco recorra `npm list`;
  - `"version": "0.1.0"`;
  - `scripts`: `"release:package": "node scripts/release-package.mjs"`.
- **`--pre-release` en el script**, no en `package.json`: las versiones `0.x` son pre-release. Al llegar a `1.0.0` (2.9) se cambia el script. La convención del Marketplace de usar un minor impar para las pre-releases encaja con `0.1.0`.
- **`CHANGELOG.md`:**
  - `## [Unreleased]` pasa a `## [0.1.0] - 2026-11-02`, como pre-release, con todo lo de la fase 1;
  - encima queda un `## [Unreleased]` vacío;
  - el resto del histórico (`Initial release`) se mantiene.
- **Test de integración:** busca la extensión con `vscode.extensions.getExtension('aguilardigital.devcommands')`, ahora que el publisher es definitivo.

### D5. `.vscodeignore`

- Se añade `*.vsix`.
- Se revisa la salida de `vsce ls` y, si aparece algo no permitido, se corrige `.vscodeignore` en vez de ampliar la lista de D2. Por ejemplo, `vsc-extension-quickstart.md` ya está excluido; `LICENSE` sí entra.

### D6. Procedimiento de release documentado

- **`docs/ROADMAP.md`**, tras el bloque de verificación en WSL, una sección "Empaquetado y prueba del `.vsix`":
  1. `pnpm run release:package`;
  2. Windows: `code --install-extension devcommands-0.1.0.vsix --force` y, en una terminal PowerShell, probar de categoría a comando en 3 clics o menos;
  3. WSL: abrir la carpeta con Remote-WSL e instalar desde Extensions › "…" › "Install from VSIX…", eligiendo instalar en WSL. Probar con una terminal bash; los ejemplos salen en bash;
  4. desinstalar las versiones de prueba si hace falta (`code --uninstall-extension aguilardigital.devcommands`).

  Además, la línea "Antes de `marketplace-release`" deja de pedir el publisher: ya está decidido.
- **`README.md`:** una sección corta "Packaging" en Development, con `pnpm run release:package` y cómo instalar el `.vsix`.

### D7. Terminal nueva: esperar a que el shell esté listo

En la prueba del `.vsix` en WSL, enviar un comando sin terminales abiertas dejaba la línea como `docker imageskevin@host:~$ docker images`: `sendText` llega al pty antes de que bash cargue su configuración y pinte el prompt; la tty hace eco del texto y luego readline lo vuelve a mostrar detrás del prompt. En Windows no se notaba porque PowerShell arranca antes.

- Solo en una terminal **recién creada** por la extensión, `TerminalService.write` espera a `window.onDidChangeTerminalShellIntegration` para esa terminal antes de llamar a `sendText`. Ese evento se dispara cuando el script de integración del shell ya se ha cargado, es decir, con el prompt listo.
- Espera máxima de 3 segundos (`TerminalService.readyTimeoutMs`), por si la integración del shell está desactivada o el shell no la soporta. Pasado ese tiempo se escribe igual.
- El engine sigue en `^1.90` y `@types/vscode` en `~1.90`: la API es de VS Code 1.93, así que `TerminalHost` la declara como opcional y se comprueba en tiempo de ejecución. Sin ella, se espera el tiempo máximo.
- En una terminal que ya existía no se espera: su shell ya está listo.
- `write` pasa a devolver una promesa. `CommandsViewProvider.sendToTerminal` no la espera (la vista no se bloquea) y registra el resultado en el canal de log.

## Risks / Trade-offs

- [`vsce` usa `npm run` para la prepublicación aunque el proyecto use pnpm] → `vscode:prepublish` delega en `pnpm run package`, y npm viene con Node. Es el flujo documentado por `vsce`.
- [`vsce ls` antes del build no ve `dist/`] → La segunda comprobación tras empaquetar (D1, paso 2) lo cubre.
- [Cambiar el id a `aguilardigital.devcommands` borra el estado guardado de la versión de desarrollo] → No hay usuarios todavía. Es el momento más barato, y por eso se fija el publisher definitivo ahora.
- [Dependencias de `vsce` con scripts nativos (`keytar`)] → Se deniegan en `allowBuilds`. Si `vsce` no funcionara sin ellas, se pararía para decidir (D3).
- [El `.vsix` queda en la raíz del repo] → Está en `.gitignore` y en `.vscodeignore`. `--out` permite cambiarlo más adelante.
- [Con la integración del shell desactivada, la primera vez que se envía un comando a una terminal nueva tarda 3 segundos] → Solo afecta a la terminal que crea la extensión, y el comando sigue sin ejecutarse. Sin la espera, el texto puede salir mezclado con el prompt.
- [Los enlaces relativos del README se reescriben a GitHub] → Apuntan a la rama por defecto (`main`). Hasta que haya release en `main`, algunos enlaces pueden no existir aún. Es aceptable para una pre-release que solo se instala en local.
