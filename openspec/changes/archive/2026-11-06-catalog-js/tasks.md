# Tasks

## 1. Categorías nuevas

Para cada categoría:
- comprobar los comandos en la documentación oficial (Context7 o la web oficial);
- escribir el JSON con `section: "languages"`, `order`, `icon` y `detect` según la decisión 1 del design, al menos 15 comandos traducidos a los 11 idiomas, `risk` según la decisión 4 y `docs`;
- verificar con `pnpm run test:unit`: schema, reglas, mínimo de comandos, traducción completa e iconos.

- [x] 1.1 `catalog/yarn.json`, con avisos de "Yarn 2 o superior" donde corresponda (decisión 2).
- [x] 1.2 `catalog/bun.json`.
- [x] 1.3 `catalog/deno.json`.
- [x] 1.4 `catalog/typescript.json`.
- [x] 1.5 `catalog/version-managers.json`: nvm, fnm, volta, corepack y pyenv, con las variantes de Windows de la decisión 3. Debe cumplir los escenarios de fnm en PowerShell y bash, nvm LTS y desinstalar como `destructive`.

## 2. Tests

- [x] 2.1 En `test/unit/catalog/content.test.ts`:
  - actualizar la lista y el orden de las 11 categorías;
  - añadir casos para el ejemplo de activar fnm en `bash` y en `powershell`;
  - añadir el caso de `nvm install --lts` en `bash` frente a `nvm install lts` en `powershell` y `cmd`;
  - comprobar que todo comando de `version-managers` que desinstala es `destructive`.
- [x] 2.2 En `test/unit/project/detect.test.ts`, añadir los escenarios:
  - Yarn y TypeScript (`tsconfig.build.json`);
  - Deno sin `package.json`;
  - `.python-version`;
  - actualizar "señales nuevas", porque `.nvmrc` ahora también detecta `version-managers`.

## 3. Documentación y verificación

- [x] 3.1 Actualizar:
  - el README: herramientas incluidas en "Usage" y tabla de señales;
  - el CHANGELOG, en `[Unreleased]`;
  - el ROADMAP: dividir la fila 3.3 en 3.3a `catalog-js` ✅ y 3.3b `catalog-python`.

  Ejecutar `pnpm run verify`, `pnpm run release:package` (comprobar el tamaño del `.vsix`) y `openspec validate catalog-js --strict`.

## 4. Prueba manual

- [x] 4.1 Dar al autor la lista de comprobación en F5:
  - las 5 categorías en "Lenguajes y entornos", en el orden de la decisión 1;
  - detección en vivo creando `yarn.lock`, `deno.json` y `tsconfig.json` en la raíz;
  - ejemplos de fnm y nvm con PowerShell y con Git Bash como terminal activa;
  - la búsqueda de `tsc watch` y `bun test`;
  - un comando `destructive` pide confirmación;
  - repaso de los textos en español.

  Resultado (2026-11-06): todo correcto en F5 (orden de las 5 categorías, detección en vivo, ejemplos de fnm y nvm en PowerShell y Git Bash, búsqueda, confirmación de destructive y textos en español).
