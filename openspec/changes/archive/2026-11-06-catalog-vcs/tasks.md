# Tasks

## 1. Categorías nuevas

Para cada categoría:
1. Comprobar los comandos en la documentación oficial (Context7 o la web oficial).
2. Escribir el JSON con:
   - `section: "vcs"`, y `order`, `icon` y `detect` según la decisión 1 del design;
   - al menos 15 comandos traducidos a los 11 idiomas;
   - `risk` según la decisión 4;
   - `docs` en cada comando.
3. Verificar con `pnpm run test:unit`.

Tareas:
- [x] 1.1 `catalog/github-cli.json`.
- [x] 1.2 `catalog/gitlab-cli.json`, con el aviso de la fusión automática en `glab mr merge`.

## 2. Tests

- [x] 2.1 `test/unit/catalog/content.test.ts`:
  - lista y orden de las 41 categorías, con `github-cli` y `gitlab-cli` justo después de `git`;
  - `gh pr create --fill` es igual en `bash` y en `powershell`;
  - ningún comando de `github-cli` ni de `gitlab-cli` declara `shells` ni contiene `repo delete`;
  - `gh pr merge` y `glab mr merge` son `caution`;
  - los dos `release delete` son `destructive`.
- [x] 2.2 `test/unit/project/detect.test.ts`:
  - `.git` con `.github` detecta `git` y `github-cli`;
  - `.git` con `.gitlab-ci.yml` detecta `git` y `gitlab-cli`;
  - `.git` solo detecta `git`.
- [x] 2.3 `src/test/extension.test.ts`: lista de categorías del test de integración.

## 3. Documentación y verificación

- [x] 3.1 Actualizar la documentación:
  - README: herramientas incluidas y tabla de señales;
  - CHANGELOG: en `[Unreleased]`;
  - ROADMAP: marcar la 3.6 con ✅.

  Después, ejecutar:
  - `pnpm run verify`;
  - `pnpm run release:package`, y comprobar el tamaño del `.vsix`;
  - `openspec validate catalog-vcs --strict`.

## 4. Prueba manual

- [x] 4.1 Dar al autor la lista de comprobación para F5:
  - GitHub CLI y GitLab CLI aparecen en "Control de versiones" después de Git;
  - detección en vivo:
    - crear la carpeta `.github` → `github-cli`;
    - crear `.gitlab-ci.yml` → `gitlab-cli`;
  - en PowerShell, cmd y Git Bash, `gh pr create --fill` es idéntico;
  - el comando se escribe sin ejecutarse;
  - buscar `pr create`, `mr merge` y `release`;
  - `gh release delete` pide confirmación;
  - repaso de los textos en español.

  Resultado (2026-11-06): todo correcto en F5 (orden en "Control de versiones", detección en vivo de `.github` y `.gitlab-ci.yml`, `gh pr create --fill` idéntico en PowerShell, cmd y Git Bash, parámetros, búsqueda, confirmación de `release delete` y riesgo `caution` al fusionar).
