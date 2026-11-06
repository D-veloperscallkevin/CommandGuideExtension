## Why

El catálogo no tiene comandos de Python. Quien trabaje con python, pip, venv, pipx, poetry, uv o conda no encuentra sus comandos, y su proyecto no aparece en "En este proyecto" salvo por `.python-version` (Gestores de versiones).

Es la segunda mitad del lote 3.3, que se dividió en dos PR: la 3.3a `catalog-js` ya está fusionada.

Fase del roadmap: **Fase 3 (v1.x)**, change 3.3b.

## What Changes

- **Cuatro categorías nuevas** en la sección `languages`, cada una con al menos 15 comandos traducidos a los 11 idiomas y con enlace `docs`:
  - **`python`**: intérprete (archivo, módulo, versión, servidor HTTP), entornos virtuales con `venv` (crear, activar, desactivar), pip con `python -m pip` (install, `-r requirements.txt`, `-e .`, upgrade, uninstall, freeze, list, show, cache) y pipx (install, run, list, upgrade-all, uninstall);
  - **`poetry`**: new, init, install, add, add al grupo dev, remove, update, lock, run, show, build, publish, env…;
  - **`uv`**: init, add, remove, sync, lock, run, tree, venv, python install/list/pin, tool install, `uvx`, pip, build, cache…;
  - **`conda`**: create, activate, deactivate, install, remove, update, list, env list/export/create/update/remove, search, clean….
- **Variantes por shell en `python`.** El catálogo distingue shells, no sistemas operativos:
  - bash y zsh siguen la convención POSIX (Linux, macOS, WSL): `python3` y `source .venv/bin/activate`;
  - PowerShell y cmd siguen la de Windows: `python`, `.venv\Scripts\Activate.ps1` y `.venv\Scripts\activate.bat`;
  - la descripción de los comandos afectados avisa que en Git Bash sobre Windows la ruta es `.venv/Scripts/activate` y el intérprete suele ser `python`.
- **pip siempre como `python -m pip`** (`python3 -m pip` en bash y zsh), como recomienda su documentación, para usar el pip del intérprete correcto.
- **Señales `detect`:**
  - `pyproject.toml`, `requirements*.txt`, `setup.py`, `setup.cfg`, `Pipfile` y `.python-version` → `python`;
  - `poetry.lock` → `poetry`;
  - `uv.lock` → `uv`;
  - `environment.yml` y `environment.yaml` → `conda`.

  `.python-version` sigue detectando también `version-managers`.
- **Riesgo:** `destructive` para borrar cachés (`pip cache purge`, `poetry cache clear`, `uv cache clean`, `conda clean`) y para eliminar entornos o versiones (`poetry env remove`, `uv python uninstall`, `conda env remove`). `caution` para publicar, cambiar la configuración global o sobrescribir archivos (`pip freeze > requirements.txt`).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `command-catalog`: "Contenido mínimo del catálogo empaquetado" incluye las 4 categorías nuevas, su orden y las variantes por shell de `python`.
- `project-detection`: "Señales del proyecto" añade las señales de Python, y `.python-version` detecta `python` además de `version-managers`.

## Impact

- **Catálogo:** `catalog/python.json`, `poetry.json`, `uv.json` y `conda.json`, nuevos.
- **Tests:**
  - `test/unit/catalog/content.test.ts`: lista y orden de las 15 categorías, ejemplos de activar el venv y de pip por shell, riesgo de cachés y entornos;
  - `test/unit/project/detect.test.ts`: señales nuevas y `.python-version`;
  - `src/test/extension.test.ts`: lista de categorías del test de integración.
- **Docs:** README (herramientas y tabla de señales), CHANGELOG y ROADMAP (3.3b ✅).
- **Código:** ninguno.
- **Mensajes webview↔extensión:** sin cambios.
- **Dependencias:** ninguna nueva.
- **Tamaño:** unos 200 KB más de JSON, unos 40 KB comprimidos en el `.vsix`.
