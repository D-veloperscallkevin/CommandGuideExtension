## Why

El catálogo tiene los comandos de Git, pero no los de GitHub CLI (`gh`) ni los de GitLab CLI (`glab`). Quien crea y revisa PR o MR, sigue los workflows o pipelines o publica releases desde la terminal no los encuentra.

Fase del roadmap: **Fase 3 (v1.x)**, change 3.6 `catalog-vcs`.

## What Changes

- **Dos categorías nuevas** en la sección `vcs`, después de Git. Cada una tiene al menos 15 comandos traducidos a los 11 idiomas y con enlace `docs`:
  - **`github-cli`:**
    - cuenta: `auth login` y `auth status`;
    - repositorios: `repo clone`, `repo create` y `browse`;
    - PR: `pr create --fill`, `pr list`, `pr status`, `pr checkout`, `pr view --web`, `pr diff`, `pr checks`, `pr merge --squash --delete-branch` y `pr review --approve`;
    - issues: `issue list`, `issue create`, `issue view` y `issue close`;
    - Actions: `run list`, `run watch`, `run view --log-failed` y `workflow run`;
    - releases: `release list`, `release create --generate-notes` y `release delete`.
  - **`gitlab-cli`:**
    - cuenta y repositorios: `auth login`, `auth status` y `repo clone`;
    - MR: `mr create --fill`, `mr list`, `mr checkout`, `mr view --web`, `mr diff`, `mr merge` y `mr approve`;
    - issues: `issue list`, `issue create`, `issue view` y `issue close`;
    - CI: `ci status`, `ci view`, `ci trace` y `ci run`;
    - releases: `release list`, `release create` y `release delete`.
- **Sin variantes por shell:** `gh` y `glab` funcionan igual en los cuatro shells. No se usan textos libres entre comillas: se usan `--fill`, `--generate-notes` o el modo interactivo.
- **Señales `detect`:**

  | Señales | Categoría |
  | --- | --- |
  | carpeta `.github` | `github-cli` |
  | `.gitlab-ci.yml` o carpeta `.gitlab` | `gitlab-cli` |

- **Riesgo:**
  - **`caution`:** lo que publica o cambia algo en GitHub o GitLab (crear repos, PR, MR o issues; fusionar; aprobar; cerrar issues; lanzar workflows o pipelines; publicar releases);
  - **`destructive`:** `release delete`;
  - **excluido:** `repo delete`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- **`command-catalog`:** el requisito "Contenido mínimo del catálogo empaquetado" incluye:
  - las 2 categorías nuevas y su lugar en `vcs`;
  - la ausencia de variantes y de textos libres entre comillas;
  - las reglas de riesgo y la exclusión de `repo delete`.
- **`project-detection`:** el requisito "Señales del proyecto" añade `.github`, `.gitlab-ci.yml` y `.gitlab`.

## Impact

- **Catálogo:** se añaden dos archivos: `catalog/github-cli.json` y `catalog/gitlab-cli.json`.
- **Tests:**
  - `test/unit/catalog/content.test.ts`: orden de las categorías, riesgo y ausencia de `repo delete`;
  - `test/unit/project/detect.test.ts`: escenarios de detección;
  - `src/test/extension.test.ts`: lista de categorías.
- **Docs:**
  - README: herramientas incluidas y tabla de señales;
  - CHANGELOG;
  - ROADMAP: 3.6 ✅.
- **Sin cambios:** código, mensajes entre webview y extensión, y dependencias.
- **Tamaño:** unos 140 KB más de JSON, unos 30 KB comprimidos en el `.vsix`.
