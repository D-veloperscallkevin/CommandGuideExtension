# Tasks

## 1. Entorno reproducible

- [x] 1.1 Crear `.nvmrc` con `24`. Verificar que `node -v` local es 24.x y que el archivo contiene solo `24`
- [x] 1.2 Crear `.gitattributes` según D5 y ejecutar `git add --renormalize .`. Verificar que `git status` no muestra archivos modificados por la normalización y que `git ls-files --eol` sigue indicando `i/lf` en todos los archivos de texto

## 2. Build completo desde la raíz

- [x] 2.1 Añadir a `package.json` los scripts `build:webview` y `lint:webview`, y encadenar `npm run build:webview` al final de `package` (D3). Verificar que, tras borrar `dist/`, `npm run package` genera `dist/extension.js` y `dist/webview/index.html`, y que `npm run lint:webview` pasa
- [x] 2.2 Añadir `.github/**`, `.nvmrc` y `.gitattributes` a `.vscodeignore`. Verificar con `npx @vscode/vsce ls` que no aparecen y que `dist/webview/index.html` sí

## 3. Workflow de CI

- [x] 3.1 Consultar la última major estable de `actions/checkout`, `actions/setup-node` y `actions/cache` (`gh api repos/actions/<name>/releases/latest`) y anotarlas para el workflow. Verificar que las tres versiones están anotadas en el resumen de la tarea
- [x] 3.2 Crear `.github/workflows/ci.yml` con el trigger, `concurrency`, `permissions`, el job matriz `checks` (pasos de D2, `xvfb-run -a` solo en Linux) y el job `ci-ok` (D1). Verificar que el YAML parsea sin errores (por ejemplo con `npx --yes yaml-lint` o equivalente) y que los nombres de scripts usados existen en `package.json`
- [ ] 3.3 Subir la rama, abrir el PR a `develop` y verificar en `gh pr checks` que `checks (ubuntu-latest)`, `checks (windows-latest)`, `checks (macos-latest)` y `ci-ok` terminan en verde. Si algún SO falla, corregirlo dentro de este change antes de seguir
- [ ] 3.4 Verificar el escenario de fallo: un commit temporal en el PR que rompe un test unitario hace que falle `ci-ok`. Después revertirlo y confirmar que vuelve a verde

## 4. Protección de ramas

- [ ] 4.1 Con `ci-ok` ya visto por GitHub, leer el ruleset 26278428 con GET y hacer PUT añadiendo la regla `required_status_checks` con `ci-ok` e `integration_id: 15368` (D6). Verificar con un GET posterior que siguen `deletion`, `non_fast_forward` y `pull_request`, y que aparece `required_status_checks`
- [ ] 4.2 Verificar en el PR que GitHub muestra `ci-ok` como "Required" (`gh pr checks` o `gh pr view --json statusCheckRollup`)

## 5. Documentación

- [ ] 5.1 Actualizar `docs/ROADMAP.md`: el prerrequisito pasa a "Node 24 LTS (ver `.nvmrc`)", el paso 8 del setup menciona el check `ci-ok`, y `ci-setup` (0.2) queda ✅ en la tabla de la Fase 0. Verificar leyendo las secciones modificadas
- [ ] 5.2 Añadir a `CHANGELOG.md` en `[Unreleased]`, bajo "Added", la entrada "CI en GitHub Actions (Windows, Linux, macOS) obligatoria para fusionar; el build de producción incluye el webview". Verificar que el archivo tiene la entrada

## 6. Verificación final

- [ ] 6.1 Ejecutar en local `npm run check-types`, `npm run lint`, `npm run lint:webview`, `npm run test:unit`, `npm run package` y `npm test`, todo en verde. Confirmar en el PR que `ci-ok` está en verde y es obligatorio. Ejecutar `openspec validate ci-setup --strict` sin errores
