# Proposal

## Why

Hoy ningún PR se verifica de forma automática. El ruleset exige PR, pero no exige que el código compile ni que pasen los tests, así que un error puede llegar a `develop` sin que nadie lo vea. Además, ningún script de la raíz construye el webview: el `.vsix` generado en una máquina limpia saldría sin interfaz. La puerta de la Fase 0 exige "CI corre lint, tests y build en cada PR", y conviene tenerlo antes de `webview-shell` para que todo el trabajo de UI nazca protegido.

**Fase del roadmap:** MVP, Fase 0 (change 0.2).

## What Changes

- Nuevo workflow de GitHub Actions `.github/workflows/ci.yml` que se dispara en cada PR a `develop`, `staging` y `main`.
- Matriz Ubuntu + Windows + macOS (`fail-fast: false`). En cada SO: instalación limpia de las dos mitades, typecheck y lint de la extensión y del webview, tests unitarios, build completo y tests de integración en VS Code (con pantalla virtual en Linux).
- Job agregador `ci-ok`, que es el único check obligatorio del ruleset. Así cambiar la matriz no rompe la protección de ramas.
- `concurrency` con cancelación de ejecuciones obsoletas del mismo PR, y caché de npm y de la descarga de VS Code.
- El build de la raíz construye también el webview, de modo que `vscode:prepublish` produce un paquete completo.
- `.nvmrc` con Node 24 como única fuente de la versión de Node (local y CI). El roadmap pasa a "Node 24 LTS".
- `.gitattributes` con `* text=auto eol=lf` para normalizar los finales de línea en todos los equipos.
- Configuración del repositorio: el ruleset `protect-main-staging-develop` añade `ci-ok` como status check obligatorio.

## Capabilities

### New Capabilities
- `continuous-integration`: verificación automática de cada PR en los tres sistemas operativos, bloqueo del merge si falla y build completo (extensión + webview).

### Modified Capabilities
<!-- Ninguna: command-catalog no cambia. -->

## Impact

- **Archivos nuevos:** `.github/workflows/ci.yml`, `.nvmrc`, `.gitattributes`.
- **Archivos modificados:** `package.json` (scripts de build y lint del webview), `.vscodeignore` (excluir `.github/`, `.nvmrc` y `.gitattributes`), `CHANGELOG.md`, `docs/ROADMAP.md` (prerrequisito de Node y paso 8 del setup).
- **GitHub:** el ruleset pasa a exigir el check `ci-ok`. Coste: 0 €, porque Actions es gratuito sin límite de minutos en repos públicos.
- **Dependencias:** ninguna nueva, ni de runtime ni de desarrollo.
- **Mensajes webview ↔ extensión:** ninguno.
- **Fuera de alcance:** `vsce package`, el control de 2 MB y los artefactos `.vsix` (change 1.8 `release-pipeline`), y los tests contra la versión mínima de VS Code (1.90).
