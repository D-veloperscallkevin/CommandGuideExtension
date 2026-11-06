# Tasks

## 1. Categorías nuevas

Para cada categoría:
1. Comprobar los comandos en la documentación oficial (Context7 o la web oficial).
2. Escribir el JSON con:
   - `section: "languages"`, y `order`, `icon` y `detect` según la decisión 1 del design;
   - al menos 15 comandos traducidos a los 11 idiomas;
   - `risk` según la decisión 5;
   - `docs` en cada comando.
3. Verificar con `pnpm run test:unit`.

Tareas:
- [x] 1.1 `catalog/elixir.json`:
  - `iex.bat` en PowerShell;
  - variantes de `MIX_ENV=prod mix release`.
- [x] 1.2 `catalog/erlang.json`.
- [x] 1.3 `catalog/haskell.json`.
- [x] 1.4 `catalog/scala.json`, con `testOnly` entre comillas dobles.
- [x] 1.5 `catalog/clojure.json`, con el aviso de cmd en Clojure CLI.
- [x] 1.6 `catalog/ocaml.json`, con la carga del entorno de opam en cada shell.

## 2. Tests

- [x] 2.1 `test/unit/catalog/content.test.ts`:
  - lista y orden de las 34 categorías;
  - opam en `bash`, `powershell` y `cmd`;
  - `iex -S mix` en `powershell` y `bash`;
  - aviso de Clojure CLI en español;
  - los `clean` de Mix, rebar3, Cabal, Stack, sbt, Leiningen y Dune son `destructive`.
- [x] 2.2 `test/unit/project/detect.test.ts`: escenarios de Phoenix, rebar3, Stack, sbt, Clojure y Dune.
- [x] 2.3 `src/test/extension.test.ts`: lista de categorías del test de integración.

## 3. Documentación y verificación

- [x] 3.1 Actualizar la documentación:
  - README: herramientas incluidas y tabla de señales;
  - CHANGELOG: en `[Unreleased]`;
  - ROADMAP: marcar la 3.5b con ✅.

  Después, ejecutar:
  - `pnpm run verify`;
  - `pnpm run release:package`, y comprobar el tamaño del `.vsix`;
  - `openspec validate catalog-functional --strict`.

## 4. Prueba manual

- [x] 4.1 Dar al autor la lista de comprobación para F5:
  - las 6 categorías aparecen después de Swift, en el orden de la decisión 1;
  - detección en vivo:
    - `mix.exs` → `elixir`;
    - `rebar.config` → `erlang`;
    - `stack.yaml` → `haskell`;
    - `build.sbt` → `scala`;
    - `deps.edn` → `clojure`;
    - `dune-project` → `ocaml`;
  - en PowerShell, cmd y Git Bash:
    - cargar el entorno de opam;
    - `iex -S mix`;
  - el aviso de Clojure CLI;
  - el comando se escribe sin ejecutarse;
  - buscar `mix deps.get`, `stack build` y `dune build`;
  - `dune clean` pide confirmación;
  - repaso de los textos en español.

  Resultado (2026-11-06): todo correcto en F5 (orden de las 6 categorías, detección en vivo, opam env, `iex.bat` y `MIX_ENV` por shell, aviso de Clojure CLI, `testOnly` entre comillas, búsqueda y confirmación de `dune clean`).
