## Context

- **Mecanismo:** como en las 3.3–3.5c, basta un `catalog/<id>.json` por categoría con `section`, `detect` y los comandos. No hay que tocar código.
- **Sección `vcs`:** hoy solo tiene `git` (order 10, icono `git-branch`, detect `.git`).
- **Tests de contenido existentes:**
  - schema;
  - al menos 15 comandos por categoría;
  - los 11 idiomas;
  - iconos válidos;
  - `docs` en cada comando;
  - la lista de categorías.
- **Comprobado al preparar el change** (Context7, cli.github.com/manual y docs.gitlab.com/cli):
  - **`gh pr merge`:**
    - acepta `--squash` y `--delete-branch`, que borra la rama local y la remota;
    - sin argumento, usa la PR de la rama actual.
  - **`gh run view --log-failed`:** muestra el log de los pasos fallidos.
  - **`gh release create <tag> --generate-notes`:** genera las notas con la API de GitHub.
  - **`glab mr merge`:**
    - usa la MR de la rama actual;
    - si hay un pipeline en curso, activa la fusión automática por defecto;
    - acepta `--squash` y `--remove-source-branch`.
  - **`glab mr approve`, `glab ci status`, `glab ci trace` y `glab ci run`:** existen con esa sintaxis. `ci run` usa la rama actual.

## Goals / Non-Goals

**Goals:**
- Los flujos habituales de GitHub y GitLab desde la terminal: autenticarse, PR y MR, issues, CI y releases.
- Comandos que funcionen igual en los cuatro shells.

**Non-Goals:**
- **`repo delete`:** borrar un repositorio remoto es irreversible y raro en el día a día.
- **Textos libres entre comillas** (`--title`, `--body`, `--notes`): sus comillas y escapes cambian entre shells, y el modo interactivo ya los pide.
- **Extensiones de `gh`** (`gh copilot`, `gh dash`…), **`gh api`** y **`glab api`**: son demasiado abiertos para un comando con un solo parámetro.
- **Otras plataformas:** Bitbucket, Gitea (`tea`) y Azure DevOps (`az repos`) quedan fuera del ROADMAP 3.6.

## Decisions

### 1. Categorías, orden, icono y señales

| id | section | order | icon | detect |
| --- | --- | --- | --- | --- |
| `github-cli` | `vcs` | 12 | `github` | `.github` |
| `gitlab-cli` | `vcs` | 14 | `git-merge` | `.gitlab-ci.yml`, `.gitlab` |

- **Iconos:** los dos existen en `codicon.csv` y no los usa ninguna otra categoría. Codicons no tiene icono de GitLab, así que `git-merge` representa las merge requests.
- **Títulos:** "GitHub CLI" y "GitLab CLI" en los 11 idiomas. Son nombres propios y no se traducen.
- **Señales:**
  - `.github` es una carpeta (workflows, plantillas, CODEOWNERS). La detección ya cuenta las carpetas, como `.git`.
  - Un repositorio de GitHub o GitLab sin esas entradas no se detecta, porque la detección no lee `.git/config`. Se acepta: la categoría sigue disponible navegando o buscando.

### 2. Sin variantes ni textos entre comillas

- `gh` y `glab` son binarios con la misma sintaxis en bash, zsh, PowerShell y cmd. Ningún comando lleva `shells`.
- Los parámetros son siempre identificadores sin espacios: número de PR o issue, etiqueta, repositorio y nombre de workflow.
- **Crear PR, MR, issues y releases:**
  - `gh pr create --fill` y `glab mr create --fill` toman el título y la descripción de los commits;
  - `gh issue create` y `glab issue create` piden los datos de forma interactiva;
  - `gh release create ${tag} --generate-notes` genera las notas;
  - `glab release create ${tag}` pide las notas.

### 3. Contenido de cada categoría

Es la lista de partida. Cada comando se comprueba en la documentación oficial (Context7 o la web oficial) antes de escribirlo, y lo que no se confirma no entra.

**`github-cli`** (unos 24 comandos):
- **Cuenta:** `gh auth login` y `gh auth status`.
- **Repositorios:** `gh repo clone ${repo}`, `gh repo create` y `gh browse`.
- **PR:**
  - `gh pr create --fill`, `gh pr list`, `gh pr status`, `gh pr checkout ${number}`, `gh pr view --web`, `gh pr diff` y `gh pr checks`;
  - `gh pr merge --squash --delete-branch` y `gh pr review --approve`.
- **Issues:** `gh issue list`, `gh issue create`, `gh issue view ${number}` y `gh issue close ${number}`.
- **Actions:** `gh run list`, `gh run watch`, `gh run view --log-failed` y `gh workflow run ${workflow}`.
- **Releases:** `gh release list`, `gh release create ${tag} --generate-notes` y `gh release delete ${tag}`.

**`gitlab-cli`** (unos 20 comandos):
- **Cuenta y repositorios:** `glab auth login`, `glab auth status` y `glab repo clone ${repo}`.
- **MR:** `glab mr create --fill`, `glab mr list`, `glab mr checkout ${number}`, `glab mr view --web`, `glab mr diff`, `glab mr merge` y `glab mr approve`.
- **Issues:** `glab issue list`, `glab issue create`, `glab issue view ${number}` y `glab issue close ${number}`.
- **CI:** `glab ci status`, `glab ci view`, `glab ci trace` y `glab ci run`.
- **Releases:** `glab release list`, `glab release create ${tag}` y `glab release delete ${tag}`.

### 4. Riesgo

| Riesgo | GitHub CLI | GitLab CLI |
| --- | --- | --- |
| `caution` | `repo create`, `pr create`, `pr merge`, `pr review --approve`, `issue create`, `issue close`, `workflow run`, `release create` | `mr create`, `mr merge`, `mr approve`, `issue create`, `issue close`, `ci run`, `release create` |
| `destructive` | `release delete` | `release delete` |
| `safe` | el resto | el resto |

- **`gh pr merge --squash --delete-branch`:** es `caution` aunque borre la rama. La rama ya está fusionada, así que no se pierde trabajo.
- **`glab mr merge`:** su descripción indica que, con un pipeline en curso, programa la fusión en vez de hacerla al momento.

### 5. Autenticación y navegador

- **Login:** `gh auth login` y `glab auth login` son interactivos. La extensión solo escribe el comando, y el usuario elige en la terminal entre el navegador o un token. La extensión no lee ni guarda credenciales.
- **`--web` y `gh browse`:** la descripción indica que abren el navegador.

### 6. Parámetros y traducciones

- **Etiquetas reutilizadas:** `version` (para `${tag}`), `name` (para `${workflow}`) y `url` (añadida en la 3.5c).
- **Etiquetas nuevas en el generador:** `repo` ("Repositorio") y `number` ("Número"), si no existen.
- **Placeholders:** el código no se traduce. Ejemplos: `owner/repo`, `123`, `v1.0.0`, `ci.yml`.
- **Estilo:** igual que en las categorías actuales.

## Risks / Trade-offs

- **Detección limitada:** muchos repositorios de GitHub no tienen carpeta `.github`. Se acepta, porque leer `.git/config` va contra la regla de no leer contenido.
- **Comandos que actúan en el servidor:** escribir el comando no lo ejecuta, y `caution` lo marca. Además, `gh` y `glab` piden confirmación en `release delete`.
- **Cambios de la CLI:** `gh` y `glab` añaden opciones con frecuencia, pero los subcomandos elegidos son estables desde hace años.
- **Traducción:** son unos 44 comandos en 11 idiomas. El test impide huecos, pero no valida la calidad; la prueba en F5 repasa al menos el español.
