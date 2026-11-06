## Context

- **Mecanismo:** como en las 3.3–3.5a, basta un `catalog/<id>.json` por categoría con `section`, `detect` y los comandos. No hay que tocar código.
- **Tests de contenido existentes:**
  - schema;
  - al menos 15 comandos por categoría;
  - los 11 idiomas;
  - iconos válidos;
  - `docs` en cada comando;
  - la lista de categorías.
- **Orden:** en `languages`, la última categoría es swift (70).
- **Variantes por shell:** fnm, mise y la compilación cruzada de Go ya declaran una variante por shell. opam y `iex` siguen el mismo patrón.
- **Avisos:** sdkman, rbenv y asdf ya avisan en la descripción. El aviso de Clojure CLI sigue ese patrón.
- **Generador:** los JSON se escriben con el script local de los lotes anteriores, que no se versiona.

## Goals / Non-Goals

**Goals:**
- Comandos del día a día de Elixir, Erlang, Haskell, Scala, Clojure y OCaml, con la sintaxis de su documentación actual.
- Ejemplos que funcionen tal cual en cada shell (opam, `iex`), o que avisen si no funcionan (Clojure CLI en cmd).

**Non-Goals:**
- **Frameworks:** Phoenix (`mix phx.*`), Play y Mill van en la 3.7.
- **Babashka.**
- **Instaladores remotos:** los `curl … | sh` o scripts de PowerShell de ghcup, coursier u opam ejecutan scripts remotos.
- **`ghcup tui`:** su disponibilidad en Windows depende de la versión. Se usa `ghcup list`, que funciona en todos los sistemas.
- **Lenguajes de la 3.5c.**

## Decisions

### 1. Categorías, orden, icono y señales

| id | order | icon | detect |
| --- | --- | --- | --- |
| `elixir` | 72 | `combine` | `mix.exs`, `mix.lock`, `.formatter.exs` |
| `erlang` | 73 | `server-process` | `rebar.config`, `rebar.lock`, `*.erl` |
| `haskell` | 74 | `symbol-operator` | `*.cabal`, `cabal.project`, `stack.yaml`, `stack.yaml.lock`, `*.hs` |
| `scala` | 76 | `type-hierarchy` | `build.sbt`, `project.scala`, `*.scala` |
| `clojure` | 77 | `symbol-parameter` | `deps.edn`, `project.clj` |
| `ocaml` | 78 | `squirrel` | `dune-project`, `*.opam`, `.ocamlformat` |

- **Iconos:** los seis existen en `codicon.csv` y no los usa ninguna otra categoría.
  - `combine`: el operador `|>` de Elixir.
  - `server-process`: los procesos de BEAM.
  - `symbol-operator`: `>>=`.
  - `type-hierarchy`: el sistema de tipos de Scala.
  - `symbol-parameter`: los paréntesis de Lisp.
  - `squirrel`: el animal más cercano a un camello.
- **Señales que no se usan:**
  - `package.yaml` (hpack) no detecta Haskell: el nombre es genérico, y todo proyecto hpack tiene también `stack.yaml` o un `*.cabal` generado.
  - `*.sc` no detecta Scala: esa extensión también la usan otros lenguajes.
- **`.formatter.exs`:** solo lo usa Elixir, así que sirve como señal.

### 2. Variantes por shell

**Cargar el entorno de opam** (comprobado en ocaml.org: "Installing OCaml" y "OCaml on Windows"):

| Shell | Ejemplo |
| --- | --- |
| bash | `eval $(opam env)` |
| zsh | sin variante: usa la de bash |
| PowerShell | `(& opam env) -split '\r?\n' \| ForEach-Object { Invoke-Expression $_ }` |
| cmd | `for /f "tokens=*" %i in ('opam env') do @%i` |

- La descripción explica que hay que repetirlo en cada terminal nueva y tras cambiar de switch.
- **Contenido del JSON:**
  - `'\r?\n'` contiene una barra invertida, que en el JSON se escribe escapada.
  - `%i` es la sintaxis de cmd interactivo. El ejemplo se escribe en la terminal y no en un `.bat`, así que es correcta.

**`iex` en PowerShell:**
- `iex` es el alias integrado de `Invoke-Expression`, así que el comando no abriría Elixir.
- Los dos comandos que abren `iex` (`iex` e `iex -S mix`) declaran `shells.powershell` con `iex.bat`.
- bash, zsh y cmd usan `iex`.

### 3. Aviso de Clojure CLI

- **Qué hace:** en Windows, `clj` y `clojure` se instalan como módulo de PowerShell (ClojureTools) y no existen en cmd.
- **Texto:** los comandos de Clojure CLI terminan su descripción con un aviso común en los 11 idiomas. En español: "En Windows funciona en PowerShell, no en cmd."
- **Sin aviso:**
  - Leiningen (`lein`), porque funciona en todos los shells con `lein.bat`;
  - bash y zsh, donde Clojure CLI funciona sin problemas.

### 4. Contenido de cada categoría

Es la lista de partida. Cada comando se comprueba en la documentación oficial (Context7 o la web oficial) antes de escribirlo, y lo que no se confirma no entra.

- **`elixir`:**
  - REPL: `elixir -v`, `iex` e `iex -S mix`;
  - proyecto: `mix new ${name}`, `mix compile`, `mix run`, `mix test`, `mix format` y `mix clean`;
  - dependencias: `mix deps.get`, `mix deps.update --all`, `mix deps.clean --all`, `mix hex.info ${package}` y `mix hex.outdated`;
  - despliegue: `MIX_ENV=prod mix release`.
    - El prefijo `MIX_ENV=prod` es sintaxis de bash, así que este comando lleva variantes para PowerShell (`$env:MIX_ENV="prod"; mix release`) y cmd (`set MIX_ENV=prod&& mix release`), igual que la compilación cruzada de Go.
    - La descripción avisa de que en PowerShell y cmd la variable se queda en la terminal.
- **`erlang`:**
  - `erl` y `erlc ${file}`;
  - rebar3: `rebar3 new app ${name}`, `compile`, `shell`, `eunit`, `ct`, `dialyzer`, `release`, `tar`, `upgrade --all`, `tree`, `clean` y `as prod release`.
- **`haskell`:**
  - compilador: `ghc ${file}`, `ghci` y `runghc ${file}`;
  - Cabal: `cabal init`, `build`, `run`, `test`, `repl`, `update`, `install ${package}` y `clean`;
  - Stack: `stack new ${name}`, `build`, `run`, `test`, `ghci` y `clean`;
  - ghcup: `ghcup list`, `ghcup install ghc ${version}` y `ghcup set ghc ${version}`.
- **`scala`:**
  - sbt: `sbt compile`, `run`, `test`, `"testOnly ${class}"`, `console`, `~compile`, `package`, `clean`, `reload` y `sbt new scala/scala3.g8`;
  - Scala CLI: `scala run .`, `scala test .`, `scala repl`, `scala compile .` y `scala --power package .`;
  - coursier: `cs setup`, `cs install ${tool}` y `cs list`.
  - **Cita de `testOnly`:** el comando de sbt va entre comillas dobles, que funcionan en los cuatro shells. El parámetro va dentro de esas comillas y solo se escapa.
- **`clojure`:**
  - Clojure CLI: `clj`, `clojure -M -m ${module}`, `clojure -X:test`, `clojure -T:build uber`, `clojure -Spath` y `clojure -X:deps tree`;
  - Leiningen: `lein new app ${name}`, `run`, `test`, `repl`, `uberjar`, `deps :tree`, `check` y `clean`.
- **`ocaml`:**
  - opam: `opam init`, `opam switch create ${name} ${version}`, `opam switch remove ${name}`, `opam install ${package}`, `opam remove ${package}`, `opam update`, `opam upgrade`, cargar el entorno (decisión 2) y `opam install . --deps-only`;
  - Dune: `dune init project ${name}`, `dune build`, `dune build --watch`, `dune exec ${name}`, `dune test`, `dune fmt` y `dune clean`;
  - REPL: `utop`.

### 5. Riesgo

- **`destructive`:**
  - `mix deps.clean --all`;
  - los `clean` de Mix, rebar3, Cabal, Stack, sbt, Leiningen y Dune;
  - `opam switch remove`, que borra el compilador y todos sus paquetes.
- **`caution`:**
  - `mix deps.update --all` y `rebar3 upgrade --all`;
  - `ghcup set ghc`, porque cambia el GHC por defecto;
  - `cs install`;
  - `opam remove` y `opam upgrade`;
  - `opam init`, porque modifica el perfil del shell.
- **`safe`:** el resto.

### 6. Parámetros y traducciones

- **Parámetros:** se reutilizan las etiquetas existentes: `file`, `package`, `name`, `version`, `tool`, `module` y `class`.
- **Placeholders:** el código no se traduce y lleva el mismo valor en los 11 idiomas. Ejemplos: `my_app`, `hello.hs`, `ghc 9.10.1`, `MySpec`, `my_app.core`, `5.3.0`.
- **Estilo:** igual que en las categorías actuales.

## Risks / Trade-offs

- **`*.hs` y `*.scala` en la raíz:** son raros en proyectos grandes, pero frecuentes en scripts sueltos. Se aceptan, igual que `*.php` y `*.c`.
- **El ejemplo de opam en cmd con `%i`:** solo funciona escrito en la terminal; en un `.bat` haría falta `%%i`. Mitigación: la extensión siempre escribe el comando en la terminal.
- **Scala CLI como `scala`:** en instalaciones anteriores a Scala 3.5, `scala` es el REPL antiguo. Mitigación: la descripción indica que hace falta Scala 3.5 o posterior.
- **Traducción:** son unos 110 comandos en 11 idiomas. El test impide huecos, pero no valida la calidad; la prueba en F5 repasa al menos el español.
