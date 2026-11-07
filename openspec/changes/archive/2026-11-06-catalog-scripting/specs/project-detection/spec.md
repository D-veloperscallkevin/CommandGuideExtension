## MODIFIED Requirements

### Requirement: Señales del proyecto
La extensión SHALL detectar las categorías del proyecto a partir de los patrones de detección que declara cada categoría del catálogo incluido en su campo `detect`. Solo SHALL comprobar si existen entradas, sean archivos o carpetas, en la raíz de cada carpeta del workspace. MUST NOT leer su contenido ni buscar más allá del nivel que indique el patrón.

Un patrón SHALL tener una de estas formas:
- un nombre exacto de la raíz, como `go.mod` o `.git`;
- un nombre de la raíz con uno o más comodines `*`, donde `*` equivale a cualquier secuencia de caracteres salvo `/`, como `*.csproj`;
- una ruta fija de un nivel, `carpeta/nombre`, sin comodines, como `prisma/schema.prisma`.

La comparación con los nombres de la raíz MUST NOT distinguir entre mayúsculas y minúsculas, para que el resultado sea el mismo en Windows, macOS y Linux. Una categoría SHALL detectarse cuando al menos uno de sus patrones coincide en al menos una carpeta.

Las señales SHALL ser:
- `.git` → `git`;
- `package.json`, `.nvmrc` o `.node-version` → `node`;
- `pnpm-lock.yaml` o `pnpm-workspace.yaml` → `pnpm`;
- `package-lock.json` o `npm-shrinkwrap.json` → `npm`;
- `Dockerfile`, `Containerfile`, `compose.yaml`, `compose.yml`, `docker-compose.yml`, `docker-compose.yaml` o `.dockerignore` → `docker`;
- `yarn.lock` o `.yarnrc.yml` → `yarn`;
- `bun.lock`, `bun.lockb` o `bunfig.toml` → `bun`;
- `deno.json`, `deno.jsonc` o `deno.lock` → `deno`;
- cualquier `tsconfig*.json` (`tsconfig.json`, `tsconfig.build.json`…) → `typescript`;
- `.nvmrc`, `.node-version`, `.python-version`, `.sdkmanrc`, `.ruby-version`, `.tool-versions`, `mise.toml` o `.mise.toml` → `version-managers`;
- `pyproject.toml`, cualquier `requirements*.txt` (`requirements.txt`, `requirements-dev.txt`…), `setup.py`, `setup.cfg`, `Pipfile` o `.python-version` → `python`;
- `poetry.lock` → `poetry`;
- `uv.lock` → `uv`;
- `environment.yml` o `environment.yaml` → `conda`;
- `pom.xml`, `build.gradle`, `build.gradle.kts` o `.java-version` → `java`;
- `pom.xml` o `mvnw` → `maven`;
- `build.gradle`, `build.gradle.kts`, `settings.gradle`, `settings.gradle.kts` o `gradlew` → `gradle`;
- cualquier `*.csproj`, `*.fsproj`, `*.sln` o `*.slnx`, o `global.json` → `dotnet`;
- cualquier `*.c`, `*.cpp`, `*.h` o `*.hpp` → `c-cpp`;
- `CMakeLists.txt`, `CMakePresets.json` o `CMakeUserPresets.json` → `cmake`;
- `go.mod`, `go.sum` o `go.work` → `go`;
- `Cargo.toml`, `Cargo.lock`, `rust-toolchain.toml` o `rust-toolchain` → `rust`;
- `composer.json`, `composer.lock` o cualquier `*.php` → `php`;
- `Gemfile`, `Gemfile.lock`, `Rakefile`, cualquier `*.gemspec` o `.ruby-version` → `ruby`;
- `pubspec.yaml` o `pubspec.lock` → `dart`;
- `pubspec.yaml` → `flutter`;
- `Package.swift`, o cualquier `*.xcodeproj` o `*.xcworkspace` → `swift`;
- `mix.exs`, `mix.lock` o `.formatter.exs` → `elixir`;
- `rebar.config`, `rebar.lock` o cualquier `*.erl` → `erlang`;
- cualquier `*.cabal` o `*.hs`, `cabal.project`, `stack.yaml` o `stack.yaml.lock` → `haskell`;
- `build.sbt`, `project.scala` o cualquier `*.scala` → `scala`;
- `deps.edn` o `project.clj` → `clojure`;
- `dune-project`, cualquier `*.opam` o `.ocamlformat` → `ocaml`;
- `DESCRIPTION`, cualquier `*.Rproj` o `*.R`, `renv.lock` o `.Rprofile` → `r`;
- cualquier `*.rockspec` o `*.lua`, `.luarc.json` o `.luacheckrc` → `lua`;
- `build.zig`, `build.zig.zon` o cualquier `*.zig` → `zig`;
- `Project.toml`, `JuliaProject.toml`, `Manifest.toml` o cualquier `*.jl` → `julia`;
- `cpanfile`, `cpanfile.snapshot`, `Makefile.PL`, `Build.PL`, `dist.ini` o cualquier `*.pl` o `*.pm` → `perl`.

Un `Makefile` MUST NOT detectar ninguna categoría, porque lo usan proyectos de muchos lenguajes. `Makefile.PL`, en cambio, es exclusivo de Perl y detecta `perl`.

Una misma entrada MAY detectar varias categorías: `.nvmrc` y `.node-version` detectan `node` y `version-managers`, `.python-version` detecta `python` y `version-managers`, `.ruby-version` detecta `ruby` y `version-managers`, `pom.xml` detecta `java` y `maven`, y `pubspec.yaml` detecta `dart` y `flutter`.

Con varias carpetas en el workspace, las categorías detectadas SHALL ser la unión de las de todas. La categoría `terminal` MUST NOT detectarse nunca. Sin carpetas abiertas, no SHALL detectarse ninguna categoría. Las categorías propias del usuario MUST NOT detectarse. Si no se puede leer la raíz de una carpeta o falla una comprobación (por ejemplo, por falta de permisos), SHALL tratarse como si la entrada no existiera, sin aviso al usuario. La detección MUST NOT necesitar leer los archivos del catálogo, que solo se cargan bajo demanda.

#### Scenario: Proyecto con pnpm y Docker
- **WHEN** la raíz de la única carpeta contiene `package.json`, `pnpm-lock.yaml` y `Dockerfile`
- **THEN** las categorías detectadas son `node`, `pnpm` y `docker`

#### Scenario: Repositorio Git
- **WHEN** la raíz contiene la carpeta `.git`
- **THEN** `git` está entre las categorías detectadas

#### Scenario: Multi-root
- **WHEN** una carpeta del workspace contiene `package-lock.json` y otra contiene `compose.yaml`
- **THEN** las categorías detectadas son `npm` y `docker`

#### Scenario: Solo en subcarpetas
- **WHEN** `package.json` solo existe en `webview-ui/` y no en la raíz
- **THEN** `node` no se detecta

#### Scenario: Sin carpeta abierta
- **WHEN** VS Code no tiene ninguna carpeta abierta
- **THEN** no se detecta ninguna categoría

#### Scenario: Patrón con comodín
- **WHEN** una categoría declara `"detect": ["*.csproj"]` y la raíz contiene `Api.csproj`
- **THEN** esa categoría está entre las detectadas

#### Scenario: Comodín solo en la raíz
- **WHEN** una categoría declara `"detect": ["*.csproj"]` y `Api.csproj` solo existe en `src/Api/`
- **THEN** esa categoría no se detecta

#### Scenario: Ruta de un nivel
- **WHEN** una categoría declara `"detect": ["prisma/schema.prisma"]` y la raíz contiene la carpeta `prisma` con el archivo `schema.prisma`
- **THEN** esa categoría está entre las detectadas

#### Scenario: Ruta de un nivel sin el archivo
- **WHEN** una categoría declara `"detect": ["prisma/schema.prisma"]` y la raíz contiene la carpeta `prisma` vacía
- **THEN** esa categoría no se detecta

#### Scenario: Mayúsculas en Linux y en Windows
- **WHEN** la raíz contiene `dockerfile` en minúsculas, tanto en un sistema de archivos que distingue mayúsculas (Linux, bash) como en uno que no (Windows, PowerShell)
- **THEN** `docker` está entre las categorías detectadas en los dos casos

#### Scenario: Señales nuevas de las categorías existentes
- **WHEN** la raíz contiene solo `.nvmrc`, `pnpm-workspace.yaml` y `Containerfile`
- **THEN** las categorías detectadas son `node`, `version-managers`, `pnpm` y `docker`

#### Scenario: Raíz ilegible
- **WHEN** no se puede listar la raíz de una carpeta del workspace y otra carpeta contiene `.git`
- **THEN** las categorías detectadas son solo `git`, sin aviso al usuario

#### Scenario: Activación sin cargar el catálogo
- **WHEN** la extensión se activa en un proyecto con `package.json`
- **THEN** `node` se detecta y los archivos del catálogo siguen sin leerse

#### Scenario: Proyecto con Yarn y TypeScript
- **WHEN** la raíz contiene `package.json`, `yarn.lock` y `tsconfig.build.json`
- **THEN** las categorías detectadas son `node`, `yarn` y `typescript`

#### Scenario: Proyecto de Deno sin package.json
- **WHEN** la raíz contiene solo `deno.json`
- **THEN** la única categoría detectada es `deno`

#### Scenario: Versión de Python fijada
- **WHEN** la raíz contiene solo `.python-version`
- **THEN** las categorías detectadas son `python` y `version-managers`

#### Scenario: Proyecto con Poetry
- **WHEN** la raíz contiene `pyproject.toml` y `poetry.lock`
- **THEN** las categorías detectadas son `python` y `poetry`

#### Scenario: Proyecto con uv en Windows y en Linux
- **WHEN** la raíz contiene `pyproject.toml`, `uv.lock` y `.python-version`, tanto en Windows con PowerShell como en Linux con bash
- **THEN** las categorías detectadas son `python`, `uv` y `version-managers` en los dos casos

#### Scenario: Requisitos con sufijo
- **WHEN** la raíz contiene solo `requirements-dev.txt`
- **THEN** la única categoría detectada es `python`

#### Scenario: Entorno de conda
- **WHEN** la raíz contiene solo `environment.yml`
- **THEN** la única categoría detectada es `conda`

#### Scenario: Proyecto Maven con wrapper
- **WHEN** la raíz contiene `pom.xml` y `mvnw`
- **THEN** las categorías detectadas son `java` y `maven`

#### Scenario: Proyecto Gradle con Kotlin en Windows y en Linux
- **WHEN** la raíz contiene `build.gradle.kts`, `settings.gradle.kts` y `gradlew`, tanto en Windows con PowerShell como en Linux con bash
- **THEN** las categorías detectadas son `java` y `gradle` en los dos casos

#### Scenario: Solución de .NET
- **WHEN** la raíz contiene `App.sln` y `global.json`
- **THEN** la única categoría detectada es `dotnet`

#### Scenario: Proyecto de C#
- **WHEN** la raíz contiene solo `Api.csproj`
- **THEN** la única categoría detectada es `dotnet`

#### Scenario: Versión de Java fijada con sdkman
- **WHEN** la raíz contiene solo `.sdkmanrc`
- **THEN** la única categoría detectada es `version-managers`

#### Scenario: Proyecto de C++ con CMake
- **WHEN** la raíz contiene `CMakeLists.txt` y `main.cpp`
- **THEN** las categorías detectadas son `c-cpp` y `cmake`

#### Scenario: Makefile solo
- **WHEN** la raíz contiene solo `Makefile`
- **THEN** no se detecta ninguna categoría

#### Scenario: Proyecto de Go con Makefile en Windows y en Linux
- **WHEN** la raíz contiene `go.mod`, `go.sum` y `Makefile`, tanto en Windows con PowerShell como en Linux con bash
- **THEN** la única categoría detectada es `go` en los dos casos

#### Scenario: Proyecto de Rust
- **WHEN** la raíz contiene `Cargo.toml`, `Cargo.lock` y `rust-toolchain.toml`
- **THEN** la única categoría detectada es `rust`

#### Scenario: Proyecto Laravel
- **WHEN** la raíz contiene `composer.json`, `composer.lock` y `artisan`
- **THEN** la única categoría detectada es `php`

#### Scenario: Proyecto Rails con versión de Ruby fijada
- **WHEN** la raíz contiene `Gemfile`, `Gemfile.lock`, `Rakefile` y `.ruby-version`
- **THEN** las categorías detectadas son `ruby` y `version-managers`

#### Scenario: Proyecto Flutter en Windows y en Linux
- **WHEN** la raíz contiene `pubspec.yaml` y `pubspec.lock`, tanto en Windows con PowerShell como en Linux con bash
- **THEN** las categorías detectadas son `dart` y `flutter` en los dos casos

#### Scenario: Paquete de Swift
- **WHEN** la raíz contiene solo `Package.swift`
- **THEN** la única categoría detectada es `swift`

#### Scenario: Versiones fijadas con asdf o mise
- **WHEN** una carpeta del workspace contiene solo `.tool-versions` y otra contiene solo `mise.toml`
- **THEN** la única categoría detectada es `version-managers`

#### Scenario: Proyecto Phoenix
- **WHEN** la raíz contiene `mix.exs`, `mix.lock` y `.formatter.exs`
- **THEN** la única categoría detectada es `elixir`

#### Scenario: Proyecto rebar3
- **WHEN** la raíz contiene `rebar.config` y `rebar.lock`
- **THEN** la única categoría detectada es `erlang`

#### Scenario: Proyecto Haskell con Stack
- **WHEN** la raíz contiene `stack.yaml`, `stack.yaml.lock`, `package.yaml` y `my-app.cabal`
- **THEN** la única categoría detectada es `haskell`

#### Scenario: Proyecto sbt
- **WHEN** la raíz contiene `build.sbt` y la carpeta `project`
- **THEN** la única categoría detectada es `scala`

#### Scenario: Proyecto Clojure con deps.edn y Leiningen
- **WHEN** la raíz contiene `deps.edn` y `project.clj`
- **THEN** la única categoría detectada es `clojure`

#### Scenario: Proyecto Dune
- **WHEN** la raíz contiene `dune-project`, `my_lib.opam` y `.ocamlformat`, tanto en Windows con PowerShell como en Linux con bash
- **THEN** la única categoría detectada es `ocaml` en los dos casos

#### Scenario: Paquete de R con renv
- **WHEN** la raíz contiene `DESCRIPTION`, `renv.lock` y `my-pkg.Rproj`
- **THEN** la única categoría detectada es `r`

#### Scenario: Rock de Lua
- **WHEN** la raíz contiene `my-lib-1.0-1.rockspec` y `.luacheckrc`
- **THEN** la única categoría detectada es `lua`

#### Scenario: Proyecto Zig en Windows y en Linux
- **WHEN** la raíz contiene `build.zig`, `build.zig.zon` y la carpeta `zig-out`, con la terminal en PowerShell o en bash
- **THEN** la única categoría detectada es `zig`

#### Scenario: Proyecto Julia
- **WHEN** la raíz contiene `Project.toml` y `Manifest.toml`
- **THEN** la única categoría detectada es `julia`

#### Scenario: Proyecto Perl con cpanfile y MakeMaker
- **WHEN** la raíz contiene `cpanfile`, `cpanfile.snapshot`, `Makefile.PL` y `Makefile`
- **THEN** la única categoría detectada es `perl`
