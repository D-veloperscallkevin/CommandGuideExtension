## Why

El catálogo no tiene comandos de Elixir, Erlang, Haskell, Scala, Clojure ni OCaml. Quien trabaje con `mix`, `rebar3`, `cabal`, `stack`, `sbt`, `lein` u `opam` no encuentra sus comandos, y su proyecto no aparece en "En este proyecto".

Fase del roadmap: **Fase 3 (v1.x)**, change 3.5b. Es la segunda parte de la 3.5, dividida en 3.5a `catalog-app-langs` (ya fusionada), 3.5b `catalog-functional` (este change) y 3.5c `catalog-scripting`.

## What Changes

- **Seis categorías nuevas** en la sección `languages`, después de Swift. Cada una tiene al menos 15 comandos traducidos a los 11 idiomas y con enlace `docs`:
  - **`elixir`:**
    - `elixir -v`, `iex` e `iex -S mix`;
    - Mix: `new`, `deps.get`, `deps.update --all`, `deps.clean --all`, `compile`, `run`, `test`, `format`, `clean`, `hex.info`, `hex.outdated` y `release`.
  - **`erlang`:**
    - `erl` y `erlc`;
    - rebar3: `new app`, `compile`, `shell`, `eunit`, `ct`, `dialyzer`, `release`, `tar`, `upgrade --all`, `tree` y `clean`.
  - **`haskell`:**
    - `ghc`, `ghci` y `runghc`;
    - Cabal: `init`, `build`, `run`, `test`, `repl`, `update`, `install` y `clean`;
    - Stack: `new`, `build`, `run`, `test`, `ghci` y `clean`;
    - ghcup: `list`, `install ghc` y `set ghc`.
  - **`scala`:**
    - sbt: `compile`, `run`, `test`, `testOnly`, `console`, `~compile`, `package`, `clean`, `reload` y `new`;
    - Scala CLI: `run`, `test`, `repl`, `compile` y `package`;
    - coursier: `cs setup`, `cs install` y `cs list`.
  - **`clojure`:**
    - Clojure CLI: `clj`, `clojure -M -m`, `clojure -X:test`, `clojure -T:build`, `clojure -Spath` y `clojure -X:deps tree`;
    - Leiningen: `new`, `run`, `test`, `repl`, `uberjar`, `deps :tree`, `check` y `clean`.
  - **`ocaml`:**
    - opam: `init`, `switch create`, `switch remove`, `install`, `remove`, `update`, `upgrade` y cargar el entorno;
    - Dune: `init project`, `build`, `build --watch`, `exec`, `test`, `fmt` y `clean`;
    - `utop`.
- **Variantes por shell:**
  - **Cargar el entorno de opam:**

    | Shell | Comando |
    | --- | --- |
    | bash y zsh | `eval $(opam env)` |
    | PowerShell | `(& opam env) -split '\r?\n' \| ForEach-Object { Invoke-Expression $_ }` |
    | cmd | `for /f "tokens=*" %i in ('opam env') do @%i` |

  - **`iex` en PowerShell:** usa `iex.bat`, porque en PowerShell `iex` es el alias de `Invoke-Expression`.
- **Aviso:** los comandos de `clj` y `clojure` avisan, en los 11 idiomas, de que en Windows funcionan en PowerShell pero no en cmd.
- **Señales `detect`:**

  | Señales | Categoría |
  | --- | --- |
  | `mix.exs`, `mix.lock`, `.formatter.exs` | `elixir` |
  | `rebar.config`, `rebar.lock`, `*.erl` | `erlang` |
  | `*.cabal`, `*.hs`, `cabal.project`, `stack.yaml`, `stack.yaml.lock` | `haskell` |
  | `build.sbt`, `project.scala`, `*.scala` | `scala` |
  | `deps.edn`, `project.clj` | `clojure` |
  | `dune-project`, `*.opam`, `.ocamlformat` | `ocaml` |

- **Riesgo:**
  - **`destructive`:**
    - `mix deps.clean --all` y `opam switch remove`;
    - los `clean` de Mix, rebar3, Cabal, Stack, sbt, Leiningen y Dune.
  - **`caution`:** `mix deps.update --all`, `rebar3 upgrade --all`, `ghcup set ghc`, `cs install`, `opam remove` y `opam upgrade`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- **`command-catalog`:** el requisito "Contenido mínimo del catálogo empaquetado" incluye:
  - las 6 categorías nuevas y su orden;
  - las variantes por shell de opam y de `iex`;
  - el aviso de Clojure CLI en cmd.
- **`project-detection`:** el requisito "Señales del proyecto" añade las señales de las 6 categorías.

## Impact

- **Catálogo:** se añaden seis archivos: `catalog/elixir.json`, `erlang.json`, `haskell.json`, `scala.json`, `clojure.json` y `ocaml.json`.
- **Tests:**
  - `test/unit/catalog/content.test.ts`: orden de las categorías, variantes, avisos y riesgo;
  - `test/unit/project/detect.test.ts`: escenarios de detección;
  - `src/test/extension.test.ts`: lista de categorías.
- **Docs:**
  - README: herramientas incluidas y tabla de señales;
  - CHANGELOG;
  - ROADMAP: 3.5b ✅.
- **Sin cambios:** código, mensajes entre webview y extensión, y dependencias.
- **Tamaño:** unos 330 KB más de JSON, unos 70 KB comprimidos en el `.vsix`.
