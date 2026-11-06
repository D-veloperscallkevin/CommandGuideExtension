## Why

El catálogo solo cubre npm, pnpm y Node.js dentro del ecosistema JavaScript. Quien use Yarn, Bun, Deno o TypeScript, o cambie de versión de Node.js o Python con un gestor de versiones, no encuentra sus comandos y su proyecto no aparece en "En este proyecto".

Ya existen la base de secciones (3.1) y la de señales en el catálogo (3.2), así que este es el primer lote de contenido.

Fase del roadmap: **Fase 3 (v1.x)**, change 3.3a.

El ROADMAP agrupaba JavaScript y Python en un único change 3.3. Se divide en dos para que cada PR sea revisable:
- **3.3a `catalog-js`**: este change;
- **3.3b `catalog-python`**: python con pip y pipx, poetry, uv y conda.

## What Changes

- **Cinco categorías nuevas** en la sección `languages`, cada una con al menos 15 comandos traducidos a los 11 idiomas:
  - **`yarn`**: install, add, add -D, remove, run, dlx, up, why, info, workspaces, cache…;
  - **`bun`**: install, add, add -d, remove, run, x, test, build, init, create, upgrade…;
  - **`deno`**: run con permisos, task, test, fmt, lint, check, compile, add, install, upgrade…;
  - **`typescript`**: `tsc` para compilar, vigilar, comprobar tipos sin emitir, crear `tsconfig.json`, build de proyectos…;
  - **`version-managers`**: nvm, fnm, volta, corepack y pyenv, para instalar, usar, listar y fijar versiones de Node.js y Python.
- **Variantes por shell** donde la sintaxis cambia:
  - activar `fnm` en PowerShell y en cmd;
  - nvm-windows frente a nvm en bash y zsh;
  - variables de entorno en un comando.
- **Señales `detect`:**
  - `yarn.lock` y `.yarnrc.yml` → `yarn`;
  - `bun.lock`, `bun.lockb` y `bunfig.toml` → `bun`;
  - `deno.json`, `deno.jsonc` y `deno.lock` → `deno`;
  - `tsconfig*.json` → `typescript`;
  - `.nvmrc`, `.node-version` y `.python-version` → `version-managers`.
- **Riesgo:** `caution` o `destructive` donde corresponde, por ejemplo al desinstalar versiones o limpiar cachés.
- **Corrección de la spec:** `command-catalog` todavía tiene el requisito "Catálogo empaquetado sin acceso a disco ni red", que contradice "Catálogo empaquetado cargado bajo demanda" desde la 3.1. Se elimina.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `command-catalog`:
  - "Contenido mínimo del catálogo empaquetado" incluye las 5 categorías nuevas, su orden y sus variantes por shell;
  - se elimina el requisito obsoleto "Catálogo empaquetado sin acceso a disco ni red".
- `project-detection`: "Señales del proyecto" añade las señales de las categorías nuevas.

## Impact

- **Catálogo:** `catalog/yarn.json`, `bun.json`, `deno.json`, `typescript.json` y `version-managers.json`, nuevos.
- **Tests:** `test/unit/catalog/content.test.ts` (lista de categorías y casos de variantes) y `test/unit/project/detect.test.ts` (señales nuevas).
- **Docs:**
  - README: lista de herramientas y tabla de señales;
  - CHANGELOG;
  - ROADMAP: la fila 3.3 se divide en 3.3a y 3.3b.
- **Código:** ninguno. Desde la 3.1 y la 3.2 basta con añadir los JSON.
- **Mensajes webview↔extensión:** sin cambios.
- **Dependencias:** ninguna nueva.
- **Tamaño:** unos 250 KB más de JSON, unos 50 KB comprimidos en el `.vsix`.
