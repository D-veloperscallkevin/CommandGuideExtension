# Proposal

## Why

Hoy ningún cambio se verifica de forma automática antes de llegar a las ramas protegidas: un error puede entrar en `develop` sin que nadie lo vea. Además, ningún script de la raíz construye el webview, así que el `.vsix` generado en una máquina limpia saldría sin interfaz. El proyecto no depende de GitHub Actions: la cuenta tiene Actions bloqueado por facturación y el autor prefiere no depender de servicios de GitHub. Por eso la verificación se ejecuta en local, de forma automática antes de cada push. Con npm, la configuración `ignore-scripts=true` (recomendada contra ataques de supply chain) impide además que el hook se active al instalar. pnpm 11+ resuelve las dos cosas: bloquea por defecto los scripts de las dependencias y sí ejecuta los del propio proyecto. Conviene tenerlo antes de `webview-shell` para que todo el trabajo de UI nazca protegido.

**Fase del roadmap:** MVP, Fase 0 (change 0.2).

## What Changes

- Migración de npm a pnpm: workspace con `webview-ui` como sub-paquete, un único `pnpm-lock.yaml`, versión de pnpm fijada en `packageManager` y `allowBuilds` explícito para los scripts de dependencias.
- Nuevo comando `pnpm run verify` que ejecuta, en orden y parando en el primer fallo: comprobación de la versión de Node, typecheck, lint de la extensión y del webview, tests unitarios, build de producción completo y tests de integración en VS Code.
- Hook `pre-push` versionado en `.githooks/` que ejecuta `verify` y aborta el push si falla. Se activa solo al instalar dependencias (script `prepare`), sin dependencias nuevas.
- Linux se cubre ejecutando `verify` en WSL antes de cada PR de release (`develop → staging`). macOS queda sin cubrir (riesgo aceptado).
- Plantilla de PR con checklist de verificación.
- El build de la raíz construye también el webview, de modo que `vscode:prepublish` produce un paquete completo.
- `.nvmrc` con Node 24 como única fuente de la versión de Node. El roadmap pasa a "Node 24 LTS".
- `.gitattributes` con `* text=auto eol=lf` para normalizar los finales de línea en todos los equipos.
- Se retira el workflow de GitHub Actions. El ruleset de GitHub no cambia: no hay check obligatorio.
- El roadmap se adapta: la puerta de la Fase 0 pasa a ser "verificación local obligatoria antes del push", y los changes 1.8 (`release-pipeline`) y 2.9 (`marketplace-release`) pasan a ser locales y manuales.

## Capabilities

### New Capabilities
- `continuous-integration`: verificación automática y local de cada cambio antes del push, verificación en Linux antes de cada release y build completo (extensión + webview).

### Modified Capabilities
<!-- Ninguna: command-catalog no cambia. -->

## Impact

- **Archivos nuevos:** `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `scripts/verify.mjs`, `scripts/install-hooks.mjs`, `.githooks/pre-push`, `.github/pull_request_template.md`, `.nvmrc`, `.gitattributes`.
- **Archivos eliminados:** `.github/workflows/ci.yml`, `package-lock.json` y `webview-ui/package-lock.json`.
- **Archivos modificados:** `package.json` (`packageManager` y scripts `verify`, `prepare`, `build:webview`, `lint:webview` y `package`), `.vscodeignore`, `CHANGELOG.md`, `docs/ROADMAP.md`, `catalog/README.md`.
- **Para el change 1.8:** `vsce package` usa `npm list` y no funciona con pnpm. Como el bundle no tiene dependencias de runtime, se empaqueta con `vsce package --no-dependencies`.
- **GitHub:** sin cambios en el ruleset y sin uso de Actions. Coste: 0 €.
- **Dependencias:** ninguna nueva, ni de runtime ni de desarrollo. Cambia el gestor de paquetes (pnpm, instalado globalmente).
- **Mensajes webview ↔ extensión:** ninguno.
- **Fuera de alcance:** `vsce package`, control de 2 MB y publicación (changes 1.8 y 2.9), y tests contra la versión mínima de VS Code (1.90).
