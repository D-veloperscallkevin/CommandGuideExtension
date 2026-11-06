## Context

- **Cómo se añade una categoría** desde la 3.1 y la 3.2: basta un `catalog/<id>.json` con `section`, `detect` y los comandos. El build lo copia a `dist/catalog/` y sus señales entran en el bundle. No hay que tocar código.
- **Tests que ya vigilan el contenido:** schema (Ajv) y `checkCatalogRules`, al menos 15 comandos por categoría, traducción completa a 11 idiomas, iconos Codicon existentes, `docs` en cada comando y la lista de categorías en `content.test.ts` y en el test de integración `src/test/extension.test.ts`.
- **Orden:** `order` ordena las categorías dentro de su sección (empates por `id`). La lista global de `getCategories()` usa el mismo número, así que los tests la ven ordenada por `order` sin mirar la sección. En `languages` hoy van npm (20), pnpm (25), yarn (26), bun (27), node (30), deno (32), typescript (35) y version-managers (38). Docker es 40, en `infra`.
- **Variantes por shell:** `shells` tiene claves `bash`, `zsh`, `powershell` y `cmd`. No hay variante por sistema operativo: Git Bash y WSL cuentan como `bash`.
- **Generador:** los JSON de la 3.3a se escribieron con un script local que aplica el formato del catálogo (sangría de 2 espacios, listas de cadenas en línea, orden de claves). Se reutiliza el mismo enfoque; el script no se versiona.

## Goals / Non-Goals

**Goals:**
- Comandos útiles del día a día de Python y de cada herramienta, con la sintaxis de su documentación actual.
- Ejemplos correctos en PowerShell y cmd en Windows, y en bash y zsh en Linux, macOS y WSL.
- Que el proyecto abierto muestre estas categorías en "En este proyecto".

**Non-Goals:**
- **Instaladores** (`curl … | sh`, `irm … | iex`, el instalador de Miniconda): ejecutan scripts remotos.
- **Variantes por sistema operativo** en el schema (por ejemplo, bash en Windows frente a bash en Linux). Decidido con el autor: se avisa en la descripción.
- **pipenv, hatch, pdm, pytest, ruff, black, mypy:** quedan para lotes posteriores (calidad de código o frameworks).
- **pyenv:** ya está en `version-managers` desde la 3.3a.
- **Leer `pyproject.toml`** para saber si usa Poetry, uv o hatch: la detección no lee contenido.

## Decisions

### 1. Categorías, orden, icono y señales

| id | order | icon | detect |
| --- | --- | --- | --- |
| `python` | 42 | `python` | `pyproject.toml`, `requirements*.txt`, `setup.py`, `setup.cfg`, `Pipfile`, `.python-version` |
| `poetry` | 44 | `book` | `poetry.lock` |
| `uv` | 45 | `rocket` | `uv.lock` |
| `conda` | 47 | `beaker` | `environment.yml`, `environment.yaml` |

Todas van en la sección `languages`, después de version-managers. Con los números elegidos, la lista global queda: git, npm, pnpm, yarn, bun, node, deno, typescript, version-managers, docker, python, poetry, uv, conda, terminal. En el panel, Docker sigue en su sección, así que el usuario ve las cuatro nuevas al final de "Lenguajes y entornos".

- No caben entre 38 y 40 sin renumerar categorías existentes, lo que tocaría JSON ya revisados sin cambiar nada visible. Por eso van de 42 en adelante.
- `python` es un Codicon existente (comprobado en la lista del paquete `@vscode/codicons`). `book` alude a "poesía", `rocket` a la velocidad de uv y `beaker` al uso científico de conda.
- `pyproject.toml` solo detecta `python`, porque lo usan Poetry, uv, hatch y setuptools por igual. Poetry y uv se detectan por su lockfile.
- `Pipfile` detecta `python` aunque no haya categoría de pipenv: es un proyecto Python.
- `environment.yml` solo detecta `conda`: también puede describir entornos sin Python (R, por ejemplo).

### 2. Convención de shells en `python`

Decidido con el autor: bash y zsh siguen la convención POSIX; PowerShell y cmd, la de Windows.

| Comando | `command` (bash, zsh) | `powershell` | `cmd` |
| --- | --- | --- | --- |
| Intérprete | `python3 …` | `python …` | `python …` |
| pip | `python3 -m pip …` | `python -m pip …` | `python -m pip …` |
| Crear venv | `python3 -m venv .venv` | `python -m venv .venv` | `python -m venv .venv` |
| Activar venv | `source .venv/bin/activate` | `.venv\Scripts\Activate.ps1` | `.venv\Scripts\activate.bat` |
| Desactivar | `deactivate` | `deactivate` | `deactivate` |

- La descripción de los comandos con `python3` o `.venv/bin` añade, en los 11 idiomas, que en Git Bash sobre Windows se usa `python` y `.venv/Scripts/activate`.
- La de activar en PowerShell avisa de que, si la política de ejecución bloquea el script, hay que permitirlo antes (`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`). Ese comando no entra en el catálogo: cambia una configuración de seguridad del sistema.
- No se usa el lanzador `py` de Windows: solo existe con el instalador de python.org, y `python` funciona también con el de Microsoft Store.
- Los comandos de pipx, poetry, uv y conda son iguales en todos los shells y no llevan variantes, salvo que la documentación indique otra cosa al comprobarlos.

### 3. pip como módulo

Decidido con el autor: siempre `python3 -m pip` / `python -m pip`. Es lo que recomienda la documentación de pip y evita usar el pip de otro intérprete cuando el PATH no coincide. Un test comprueba que ningún comando de `python` empieza por `pip `.

### 4. Contenido de cada categoría

Lista de partida. Cada comando se comprueba en la documentación oficial (Context7 o la web oficial) antes de escribirlo; si no se confirma, no entra.

- **`python`:** versión; ejecutar archivo; ejecutar módulo (`-m`); crear venv; activar; desactivar; pip install, `install -r requirements.txt`, `install -e .`, `install --upgrade`, `install --upgrade pip`, uninstall, `freeze > requirements.txt`, `list --outdated`, show, `cache purge`; `-m http.server`; pipx install, run, list, upgrade-all, uninstall.
- **`poetry`:** new, init, install, add, `add --group dev`, remove, update, lock, run, `show --tree`, `show --outdated`, build, publish, `env info`, `env use`, `env list`, `env remove`, `env activate` (Poetry 2 sustituye `poetry shell`), check, `cache clear`.
- **`uv`:** init, add, `add --dev`, remove, sync, lock, `lock --upgrade`, run, tree, venv, `python install`, `python list`, `python pin`, `python uninstall`, `tool install`, `uvx`, `pip install`, `pip compile`, export, build, publish, `self update`, `cache clean`.
- **`conda`:** `create -n … python=…`, activate, deactivate, install, remove, `update --all`, list, `env list`, `env export > environment.yml`, `env create -f environment.yml`, `env update -f … --prune`, `env remove -n …`, search, info, `clean --all`, `config --add channels conda-forge`.

### 5. Riesgo

- **`destructive`:**
  - borrar cachés: `pip cache purge`, `poetry cache clear`, `uv cache clean`, `conda clean --all`;
  - borrar entornos o versiones: `poetry env remove`, `uv python uninstall`, `conda env remove`.
- **`caution`:**
  - sobrescribir archivos: `pip freeze > requirements.txt`, `conda env export > environment.yml`;
  - publicar: `poetry publish`, `uv publish`;
  - cambiar la configuración global o actualizar mucho de golpe: `conda config --add channels`, `conda update --all`, `uv self update`, `pip install --upgrade pip`, `pipx upgrade-all`, `poetry update`, `uv lock --upgrade`;
  - desinstalar paquetes: `pip uninstall`, `pipx uninstall`.
- **`safe`:** el resto.

### 6. Parámetros, placeholders y traducciones

Se reutilizan los nombres de parámetro habituales (`package`, `file`, `version`, `name`, `tool`) y se añaden los que hagan falta (`module`, `port`). Los placeholders de código no se traducen (`requests`, `main.py`, `3.13`, `8000`) y llevan el mismo valor en los 11 idiomas. Los textos siguen el estilo de las categorías actuales: título corto en imperativo, descripción de una línea y `tags` con sinónimos en cada idioma. Los títulos de pipx llevan el prefijo "pipx: ", como los de Gestores de versiones.

### 7. Mensajes webview↔extensión y dependencias

- **Mensajes:** sin cambios. Las categorías nuevas viajan en el mensaje `catalog` igual que las actuales.
- **Dependencias:** ninguna nueva.

## Risks / Trade-offs

- **Git Bash en Windows recibe la variante POSIX.** `python3` y `.venv/bin/activate` pueden no existir ahí. Mitigación: el aviso en la descripción. Como el comando nunca se ejecuta solo, el usuario lo corrige antes de pulsar Enter.
- **`python3` en Windows con PowerShell:** no aplica, porque PowerShell recibe `python`.
- **`>` en PowerShell 5.1 escribe UTF-16** al redirigir `pip freeze`. pip lee los archivos de requisitos detectando el BOM, así que funciona. Se comprueba en la prueba manual.
- **Herramientas que cambian rápido** (uv, Poetry 2). Mitigación: comprobación contra la documentación actual y enlace `docs` en cada comando.
- **Volumen de traducción:** unos 80 comandos en 11 idiomas. El test impide huecos, pero no valida la calidad. La prueba en F5 y la revisión del PR miran al menos `es` y `en`.
