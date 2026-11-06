# Tasks

## 1. Categorías nuevas

Para cada categoría:
- comprobar los comandos en la documentación oficial (Context7 o la web oficial);
- escribir el JSON con `section: "languages"`, `order`, `icon` y `detect` según la decisión 1 del design, al menos 15 comandos traducidos a los 11 idiomas, `risk` según la decisión 5 y `docs`;
- verificar con `pnpm run test:unit`: schema, reglas, mínimo de comandos, traducción completa e iconos.

- [x] 1.1 `catalog/python.json`: intérprete, venv, pip y pipx, con las variantes de shell de la decisión 2 y pip como módulo (decisión 3). Debe cumplir los escenarios de activar el venv, de instalar `requirements.txt` y de "pip nunca a secas", y llevar el aviso de Git Bash en los comandos con `python3` o `.venv/bin`.
- [x] 1.2 `catalog/poetry.json`, con la sintaxis de Poetry 2 (`env activate` en lugar de `shell`).
- [x] 1.3 `catalog/uv.json`.
- [x] 1.4 `catalog/conda.json`.

## 2. Tests

- [x] 2.1 En `test/unit/catalog/content.test.ts`:
  - actualizar la lista y el orden de las 15 categorías;
  - añadir el caso de activar el venv en `powershell`, `cmd`, `bash` y `zsh`;
  - añadir el caso de `pip install -r requirements.txt` en `bash` frente a `powershell` y `cmd`;
  - comprobar que ningún comando de `python` usa `pip` a secas, en `command` ni en sus variantes;
  - comprobar que los comandos de `python`, `poetry`, `uv` y `conda` que borran cachés, entornos o versiones son `destructive`.
- [x] 2.2 En `test/unit/project/detect.test.ts`:
  - añadir los escenarios Poetry, uv, `requirements-dev.txt` y `environment.yml`;
  - actualizar "Versión de Python fijada": `.python-version` detecta `python` y `version-managers`.
- [x] 2.3 En `src/test/extension.test.ts`, actualizar la lista de categorías del test de integración.

## 3. Documentación y verificación

- [x] 3.1 Actualizar:
  - el README: herramientas incluidas en "Usage" y tabla de señales;
  - el CHANGELOG, en `[Unreleased]`;
  - el ROADMAP: marcar la 3.3b `catalog-python` con ✅.

  Ejecutar `pnpm run verify`, `pnpm run release:package` (comprobar el tamaño del `.vsix`) y `openspec validate catalog-python --strict`.

## 4. Prueba manual

- [x] 4.1 Dar al autor la lista de comprobación en F5:
  - las 4 categorías al final de "Lenguajes y entornos", en el orden de la decisión 1;
  - detección en vivo creando `pyproject.toml`, `poetry.lock`, `uv.lock` y `environment.yml` en la raíz;
  - el ejemplo de activar el venv y el de `pip install -r` con PowerShell, con cmd y con Git Bash como terminal activa (en Git Bash, la variante POSIX con el aviso en la descripción);
  - el comando se escribe en la terminal sin ejecutarse (`sendText(cmd, false)`, como el resto);
  - la búsqueda de `venv`, `uv sync` y `conda activate`;
  - un comando `destructive` pide confirmación;
  - repaso de los textos en español.

  Resultado (2026-11-06): todo correcto en F5 (orden de las 4 categorías, detección en vivo, ejemplos de venv y pip en PowerShell, cmd y Git Bash, comandos escritos sin ejecutar, búsqueda, confirmación de destructive y textos en español).
