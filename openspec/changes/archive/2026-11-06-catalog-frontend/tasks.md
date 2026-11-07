# Tasks

## 1. Categorías nuevas

Para cada categoría:
1. Comprobar los comandos en la documentación oficial (Context7 o la web oficial).
2. Escribir el JSON con:
   - `section: "frameworks"`, y `order`, `icon` y `detect` según la decisión 1 del design;
   - al menos 8 comandos traducidos a los 11 idiomas;
   - el aviso de pnpm, Yarn y Bun en cada comando `npx` o `npm create` (decisión 3);
   - `risk` según la decisión 5;
   - `docs` en cada comando.
3. Verificar con `pnpm run test:unit`.

Tareas:
- [x] 1.1 `catalog/vite.json`.
- [x] 1.2 `catalog/nextjs.json`, sin `next lint`.
- [x] 1.3 `catalog/angular.json`.
- [x] 1.4 `catalog/vue.json`.
- [x] 1.5 `catalog/astro.json`.
- [x] 1.6 `catalog/nuxt.json`, con `npx nuxt` en vez de `nuxi`.
- [x] 1.7 `catalog/sveltekit.json`.

## 2. Tests

- [x] 2.1 `test/unit/catalog/content.test.ts`:
  - mínimo por sección: 8 en `frameworks` y 15 en las demás;
  - lista y orden de las 48 categorías, con las 7 nuevas al final;
  - las 7 nuevas van en la sección `frameworks`;
  - `npm create vite@latest` es igual en `bash` y en `powershell`;
  - todo comando de `frameworks` que empieza por `npx` o `npm create` lleva el aviso en español;
  - ningún comando de `nextjs` usa `next lint`;
  - `ng update @angular/core @angular/cli` y `nuxt upgrade` son `caution`, y `nuxt cleanup` es `destructive`.
- [x] 2.2 `test/unit/project/detect.test.ts`:
  - `package.json`, `next.config.ts` y `tsconfig.json` detectan `nextjs`, `node` y `typescript`;
  - `svelte.config.js` y `vite.config.ts` detectan `sveltekit` y `vite`;
  - `angular.json` detecta solo `angular`;
  - `package.json` solo detecta solo `node`.
- [x] 2.3 `src/test/extension.test.ts`: lista de categorías del test de integración.

## 3. Documentación y verificación

- [x] 3.1 Actualizar la documentación:
  - README: herramientas incluidas y tabla de señales;
  - CHANGELOG: en `[Unreleased]`;
  - ROADMAP: dividir la 3.7 en 3.7a–3.7d y marcar la 3.7a con ✅.

  Después, ejecutar:
  - `pnpm run verify`;
  - `pnpm run release:package`, y comprobar el tamaño del `.vsix`;
  - `openspec validate catalog-frontend --strict`.

## 4. Prueba manual

- [x] 4.1 Dar al autor la lista de comprobación para F5:
  - la sección "Frameworks" aparece después de "Control de versiones", con las 7 categorías en orden;
  - detección en vivo:
    - crear `vite.config.ts` → `vite`;
    - crear `angular.json` → `angular`;
    - crear `nuxt.config.ts` → `nuxt`;
  - en PowerShell, cmd y Git Bash, `npm create vite@latest` es idéntico;
  - el aviso de pnpm, Yarn y Bun se ve en las descripciones;
  - los parámetros (`${port}`, `${name}`, `${integration}`) se rellenan;
  - `nuxt cleanup` pide confirmación;
  - repaso de los textos en español.

  Resultado (2026-11-06): todo correcto en F5 (sección "Frameworks" con las 7 categorías en orden, detección en vivo de `vite.config.ts`, `angular.json` y `nuxt.config.ts`, `npm create vite@latest` idéntico en PowerShell, cmd y Git Bash, aviso de pnpm, Yarn y Bun, parámetros, confirmación de `nuxt cleanup`, riesgo `caution` y búsqueda).
