# Tasks

## 1. Entorno reproducible

- [x] 1.1 Crear `.nvmrc` con `24`. Verificar que `node -v` local es 24.x y que el archivo contiene solo `24`
- [x] 1.2 Crear `.gitattributes` según D8 y ejecutar `git add --renormalize .`. Verificar que `git status` no muestra archivos modificados por la normalización y que `git ls-files --eol` sigue indicando `i/lf` en todos los archivos de texto

## 2. Build completo desde la raíz

- [x] 2.1 Añadir a `package.json` los scripts `build:webview` y `lint:webview`, y encadenar `build:webview` al final de `package`. Verificar que, tras borrar `dist/`, el build de producción genera `dist/extension.js` y `dist/webview/index.html`, y que `lint:webview` pasa
- [x] 2.2 Añadir `.github/**`, `.nvmrc` y `.gitattributes` a `.vscodeignore`. Verificar con `npx @vscode/vsce ls` que no aparecen y que `dist/webview/index.html` sí

## 3. Migración a pnpm

- [x] 3.1 Instalar la última versión estable de pnpm (`npm i -g pnpm`), añadir `packageManager` al `package.json` de la raíz, crear `pnpm-workspace.yaml` (D10), convertir los lockfiles con `pnpm import`, borrar los dos `package-lock.json` y los `node_modules`, y reinstalar. Verificar que `pnpm install --frozen-lockfile` termina sin errores, que solo existe `pnpm-lock.yaml` y que las versiones de `vitest`, `ajv`, `esbuild` y `vite` coinciden con las de antes
- [x] 3.2 Verificar el bloqueo de scripts de dependencias: al quitar temporalmente `esbuild` de `allowBuilds`, `pnpm install` falla nombrando esbuild. Restaurarlo y comprobar que la instalación vuelve a pasar. Verificar también que `pnpm install --frozen-lockfile` falla con una dependencia añadida a `package.json` sin actualizar el lockfile (revertirlo después)
- [x] 3.3 Pasar a pnpm los scripts `build:webview` y `lint:webview` (`pnpm --filter webview-ui run …`), el `spawnSync` de `scripts/verify.mjs` y `.githooks/pre-push`. Verificar que `pnpm run verify` termina con `✔ verify OK`, y repetir las comprobaciones de las tareas 4.2 y 4.3 con pnpm

## 4. Comando de verificación

- [x] 4.1 Crear `scripts/verify.mjs` (D1) y el script `"verify": "node scripts/verify.mjs"`, y añadir `scripts/**` a `.vscodeignore`. Verificar que `verify` ejecuta los seis pasos en orden y termina con `✔ verify OK` y código 0
- [x] 4.2 Verificar la comprobación de Node: con `.nvmrc` cambiado temporalmente a `22`, `verify` falla antes del typecheck indicando "esperado 22, encontrado 24". Restaurar `.nvmrc`
- [x] 4.3 Verificar la parada en el primer fallo: con un test unitario roto temporalmente, `verify` imprime `✖ verify falló en: test:unit`, no ejecuta `package` ni `test`, y sale con código distinto de 0. Restaurar el test

## 5. Hook pre-push

- [x] 5.1 Crear `.githooks/pre-push` (D2) y marcarlo ejecutable con `git update-index --chmod=+x .githooks/pre-push`. Verificar que `git ls-files -s .githooks/pre-push` muestra el modo `100755`
- [x] 5.2 Crear `scripts/install-hooks.mjs` (D3) y el script `"prepare": "node scripts/install-hooks.mjs"`. Verificar que, con `ignore-scripts=true` todavía en `~/.npmrc`, tras `git config --unset core.hooksPath`, borrar los `node_modules` (equivalente a un clon nuevo) y `pnpm install --frozen-lockfile`, `git config core.hooksPath` devuelve `.githooks`. Nota: pnpm omite los scripts, incluido `prepare`, cuando la instalación está "Already up to date", así que la prueba debe partir sin `node_modules`. Verificar también que en una copia sin `.git` (carpeta temporal en el scratchpad) `node scripts/install-hooks.mjs` sale con 0 sin configurar nada
- [x] 5.3 Verificar que el hook bloquea: con un test unitario roto temporalmente, `git push --dry-run origin HEAD` termina con error y muestra el fallo de `test:unit`. Restaurar el test y comprobar que el mismo comando pasa

## 6. Retirada de Actions y plantilla de PR

- [x] 6.1 Borrar `.github/workflows/ci.yml` (D7). Verificar que `.github/workflows/` ya no existe en la rama
- [x] 6.2 Crear `.github/pull_request_template.md` con el checklist de D6. Verificar que existe y contiene las tres casillas

## 7. Verificación en Linux (WSL)

- [ ] 7.1 Validar el procedimiento D5 una vez en el Ubuntu de WSL: clon en `~/`, Node 24, pnpm, `xvfb` y las librerías de sistema que hagan falta, y `pnpm install --frozen-lockfile && xvfb-run -a pnpm run verify` en verde sobre `feature/ci-setup`. Anotar en D5 los paquetes `apt` que finalmente hicieron falta

## 8. Documentación

- [ ] 8.1 Actualizar `docs/ROADMAP.md`:
  - el prerrequisito pasa a "Node 24 LTS (ver `.nvmrc`) y pnpm (`npm i -g pnpm`)";
  - "Proceso" y la tabla del flujo de ramas pasan de "CI" a "`pnpm run verify` (hook pre-push) y WSL en releases";
  - el paso 8 del setup protege las ramas sin check de CI;
  - la puerta de la Fase 0 pasa a ser "verificación local obligatoria antes del push";
  - la fila 0.2 refleja el nuevo alcance (incluido pnpm) y queda ✅;
  - 1.8 `release-pipeline` pasa a script local (`vsce package --no-dependencies`, control de 2 MB);
  - 2.9 `marketplace-release` pasa a publicación manual con `vsce publish --no-dependencies` y `ovsx publish`;
  - el paso 5 del ciclo de cada change dice "verify en verde";
  - se añade el procedimiento de WSL al cierre de fase.

  Verificar con `grep -n "CI\|npm " docs/ROADMAP.md` que no quedan referencias a CI en la nube ni a comandos npm del proyecto (salvo la instalación global de pnpm y la parte histórica del setup)
- [x] 8.2 Actualizar `catalog/README.md` (`pnpm run test:unit`) y la entrada de `CHANGELOG.md` en `[Unreleased]` → "Added": "Verificación local obligatoria antes de cada push (`pnpm run verify` + hook pre-push); migración a pnpm; el build de producción incluye el webview". Verificar que ninguno de los dos archivos menciona `npm run` ni GitHub Actions

## 9. Verificación final

- [ ] 9.1 Hacer push de la rama (el propio hook ejecuta `verify` y debe pasar), actualizar el título y la descripción del PR #3 al nuevo alcance, y ejecutar `openspec validate ci-setup --strict` sin errores
