# Proposal

## Why

La fase 1 (MVP, roadmap 1.8) se cierra con una v0.1.0 pre-release. Su puerta exige:

- un `.vsix` de menos de 2 MB;
- probado instalado en Windows (PowerShell) y en WSL o Linux (bash).

Hoy no hay forma de generar ese paquete:

- `package.json` no declara `publisher` ni `repository`, y `vsce` se niega a empaquetar sin ellos;
- `@vscode/vsce` no está instalado;
- nada comprueba qué entra en el paquete ni cuánto pesa.

Además, el proyecto no paga servicios de GitHub, así que el empaquetado y su control tienen que ser locales, igual que `pnpm run verify`.

## What Changes

- **Script `pnpm run release:package`** (`scripts/release-package.mjs`), sin dependencias propias y válido en Windows y en Linux. Hace lo siguiente:
  1. ejecuta `vsce package --no-dependencies --pre-release`; `vsce` lanza antes `vscode:prepublish`, es decir, el build de producción completo;
  2. comprueba que el `.vsix` pese menos de 2 MB;
  3. comprueba que el paquete solo contenga archivos permitidos:
     - `dist/` sin `.map`;
     - `media/` y `l10n/`;
     - `package.json` y `package.nls*.json`;
     - `README.md`, `CHANGELOG.md` y `LICENSE`;
  4. si algo falla, termina con error nombrando el motivo (el tamaño o los archivos sobrantes); si todo va bien, imprime la ruta, el tamaño y el número de archivos.
- **Comprobaciones como funciones puras** en `scripts/release-check.mjs`, con tests de Vitest.
- **`@vscode/vsce` como devDependency** con versión fija. Sus scripts de instalación se declaran revisados y **denegados** en `allowBuilds`, porque empaquetar no los necesita.
- **`package.json`:**
  - `publisher: "aguilardigital"`, el publisher definitivo del Marketplace; la extensión queda como `aguilardigital.devcommands`;
  - `repository` apuntando a GitHub;
  - `"vsce": { "dependencies": false }`;
  - `version` pasa a `0.1.0`.
- **`CHANGELOG.md`:** `[Unreleased]` pasa a `[0.1.0]` con la fecha de la release, y se deja un `[Unreleased]` vacío encima.
- **`.vscodeignore`:** se añade `*.vsix`, para que un paquete anterior no acabe dentro del nuevo. En `.gitignore` ya está.
- **Documentación:** procedimiento de release en `docs/ROADMAP.md` y una sección "Packaging" en `README.md`:
  - empaquetar;
  - instalar con `code --install-extension`;
  - probar en PowerShell y en WSL con Remote-WSL.
- Fuera de alcance:
  - publicar en el Marketplace u Open VSX, icono PNG, capturas y nombre visible definitivo (2.9);
  - GitHub Actions;
  - firmar el paquete.

- **Arreglo encontrado en la prueba en WSL:** al enviar un comando sin ninguna terminal abierta, el texto llegaba antes que el prompt de bash (`docker imagesusuario@host:~$ docker images`). En una terminal recién creada, la extensión espera a que el shell esté listo (D7).

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `continuous-integration`:
  - nuevo requisito de empaquetado local verificado (tamaño y contenido del `.vsix`);
  - nuevo requisito de identidad del paquete (publisher, versión y pre-release);
  - el PR de release `staging → main` tiene que dejar constancia del empaquetado y de la prueba del `.vsix` instalado.
- `terminal-integration`: en una terminal recién creada, el comando se escribe cuando el shell está listo (espera máxima de 3 segundos).

## Impact

- **Archivos nuevos:** `scripts/release-package.mjs`, `scripts/release-check.mjs` y `test/unit/scripts/release-check.test.ts`.
- **Archivos modificados:** `package.json` (scripts, metadatos y devDependency), `pnpm-lock.yaml`, `pnpm-workspace.yaml` (`allowBuilds`), `.vscodeignore`, `CHANGELOG.md`, `README.md` y `docs/ROADMAP.md`.
- **Id de la extensión:** pasa de `undefined_publisher.devcommands` a `aguilardigital.devcommands`. El test de integración que busca la extensión por id se ajusta, y el estado guardado en desarrollo (la vista persistida) empieza de cero.
- **Terminal:** `src/terminal/TerminalService.ts` (`write` pasa a ser asíncrono), `src/views/CommandsViewProvider.ts` y sus tests unitarios.
- **`pnpm run verify` no cambia:** `release:package` se lanza aparte, antes de una release.
