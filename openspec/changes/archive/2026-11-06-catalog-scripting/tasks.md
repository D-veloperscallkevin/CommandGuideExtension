# Tasks

## 1. Categorías nuevas

Para cada categoría:
1. Comprobar los comandos en la documentación oficial (Context7 o la web oficial).
2. Escribir el JSON con:
   - `section: "languages"`, y `order`, `icon` y `detect` según la decisión 1 del design;
   - al menos 15 comandos traducidos a los 11 idiomas;
   - `risk` según la decisión 6;
   - `docs` en cada comando.
3. Verificar con `pnpm run test:unit`.

Tareas:
- [x] 1.1 `catalog/r.json`:
  - código en línea de la decisión 2;
  - `R.exe` en PowerShell (decisión 2b).
- [x] 1.2 `catalog/lua.json`, con el aviso de `lua5.4`.
- [x] 1.3 `catalog/zig.json`:
  - aviso de Zig 0.17;
  - borrado de la salida en cada shell.
- [x] 1.4 `catalog/julia.json`, con el código en línea de la decisión 2.
- [x] 1.5 `catalog/perl.json`, con el aviso de `gmake`.

## 2. Tests

- [x] 2.1 `test/unit/catalog/content.test.ts`:
  - lista y orden de las 39 categorías;
  - código en línea de R y Julia:
    - entre comillas dobles, sin comillas dobles dentro;
    - sin variantes de shell;
  - `Pkg.add(ARGS)` en `bash` y `powershell`;
  - `R CMD check` en `powershell` (`R.exe`) y `bash`;
  - borrado de la salida de Zig en `bash`, `powershell` y `cmd`;
  - avisos en español de Zig y Perl;
  - `luarocks remove` y el borrado de Zig son `destructive`.
- [x] 2.2 `test/unit/project/detect.test.ts`:
  - escenarios de un paquete de R con renv, un rock de Lua, Zig, Julia y Perl con cpanfile;
  - un `Makefile` solo sigue sin detectar nada.
- [x] 2.3 `src/test/extension.test.ts`: lista de categorías del test de integración.

## 3. Documentación y verificación

- [x] 3.1 Actualizar la documentación:
  - README: herramientas incluidas y tabla de señales;
  - CHANGELOG: en `[Unreleased]`;
  - ROADMAP: marcar la 3.5c con ✅.

  Después, ejecutar:
  - `pnpm run verify`;
  - `pnpm run release:package`, y comprobar el tamaño del `.vsix`;
  - `openspec validate catalog-scripting --strict`.

## 4. Prueba manual

- [x] 4.1 Dar al autor la lista de comprobación para F5:
  - las 5 categorías aparecen después de OCaml, en el orden de la decisión 1;
  - detección en vivo:
    - `DESCRIPTION` → `r`;
    - `.luarc.json` → `lua`;
    - `build.zig` → `zig`;
    - `Project.toml` → `julia`;
    - `cpanfile` → `perl`;
  - en PowerShell, cmd y Git Bash:
    - el código en línea de R y Julia es idéntico;
    - borrar la salida de Zig;
  - los avisos de Zig, Lua y Perl;
  - el comando se escribe sin ejecutarse;
  - buscar `renv`, `luarocks install` y `zig build`;
  - borrar la salida de Zig pide confirmación;
  - repaso de los textos en español.

  Resultado (2026-11-06): todo correcto en F5 (orden de las 5 categorías, detección en vivo, código en línea idéntico en PowerShell, cmd y Git Bash, `R.exe` en PowerShell, borrado de Zig por shell, avisos de Zig, Lua y Perl, búsqueda y confirmación del borrado de Zig).
