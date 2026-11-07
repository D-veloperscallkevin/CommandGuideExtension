## Why

El catálogo no tiene comandos de R, Lua, Zig, Julia ni Perl. Quien trabaje con `Rscript`, `renv`, `luarocks`, `zig build`, `Pkg` de Julia, `cpanm` o `carton` no encuentra sus comandos, y su proyecto no aparece en "En este proyecto".

Fase del roadmap: **Fase 3 (v1.x)**, change 3.5c. Es la última parte de la 3.5, dividida en 3.5a `catalog-app-langs` y 3.5b `catalog-functional` (ya fusionadas) y 3.5c `catalog-scripting` (este change).

## What Changes

- **Cinco categorías nuevas** en la sección `languages`, después de OCaml. Cada una tiene al menos 15 comandos traducidos a los 11 idiomas y con enlace `docs`:
  - **`r`:**
    - intérprete: `R --version`, `R` y `Rscript ${file}`;
    - paquetes de CRAN: instalar y actualizar todos;
    - paquetes propios: `R CMD build .`, `R CMD check`, `R CMD INSTALL .`, `devtools::test()` y `devtools::document()`;
    - renv: `init`, `install`, `snapshot`, `restore`, `status` y `update`.
  - **`lua`:**
    - intérprete: `lua -v`, `lua`, `lua ${file}` y `luac -p`;
    - LuaRocks: `init`, `install`, `install --local`, `remove`, `list`, `search`, `show`, `make`, `pack`, `test` y `config`.
  - **`zig`:**
    - proyecto: `zig version`, `zig init`, `zig build`, `zig build run`, `zig build test`, `zig build -Doptimize=ReleaseFast` y `zig build --help`;
    - archivo suelto: `zig run`, `zig test`, `zig fmt .` y `zig ast-check`;
    - dependencias y herramientas: `zig fetch --save`, `zig env`, `zig targets` y `zig cc`;
    - borrar `zig-out` y `.zig-cache`.
  - **`julia`:**
    - intérprete: `julia --version`, `julia`, `julia ${file}` y `julia --project`;
    - Pkg: `add`, `rm`, `instantiate`, `update`, `status`, `test`, `gc` y `generate`;
    - juliaup: `status`, `add`, `default` y `update`.
  - **`perl`:**
    - intérprete y documentación: `perl -v`, `perl ${file}`, `perl -c`, `perldoc ${module}` y `perldoc -f`;
    - módulos: `cpan`, `cpanm` y `cpanm --installdeps .`;
    - Carton: `install`, `exec` y `bundle`;
    - tests: `prove -lr t`;
    - módulos con MakeMaker: `perl Makefile.PL`, `make test` y `perl -V:make`;
    - calidad: `perltidy` y `perlcritic`.
- **Código en línea:** los comandos `Rscript -e` y `julia -e` usan una única forma que funciona en bash, zsh, PowerShell y cmd:
  - el código va entre comillas dobles, sin comillas dobles dentro;
  - el nombre del paquete se pasa como argumento (`commandArgs(TRUE)` en R, `ARGS` en Julia).

  Ejemplo: `julia --project -e "using Pkg; Pkg.add(ARGS)" Example`.
- **Variantes por shell:** borrar la salida de Zig usa la sintaxis de cada shell, como el borrado de carpetas de Terminal.
- **Avisos** en los 11 idiomas:
  - Zig: los comandos que cambian entre versiones (`init`, `fetch` y las opciones `-D`) indican que siguen Zig 0.17;
  - Lua: en algunas instalaciones el intérprete se llama `lua5.4` o `lua54`;
  - Perl: en Windows con Strawberry Perl, `make` se llama `gmake`.
- **Señales `detect`:**

  | Señales | Categoría |
  | --- | --- |
  | `DESCRIPTION`, `*.Rproj`, `renv.lock`, `.Rprofile`, `*.R` | `r` |
  | `*.rockspec`, `.luarc.json`, `.luacheckrc`, `*.lua` | `lua` |
  | `build.zig`, `build.zig.zon`, `*.zig` | `zig` |
  | `Project.toml`, `JuliaProject.toml`, `Manifest.toml`, `*.jl` | `julia` |
  | `cpanfile`, `cpanfile.snapshot`, `Makefile.PL`, `Build.PL`, `dist.ini`, `*.pl`, `*.pm` | `perl` |

- **Riesgo:**
  - **`destructive`:** borrar la salida de Zig y `luarocks remove`.
  - **`caution`:** actualizar todos los paquetes de R, `renv::update()`, `Pkg.update()`, `Pkg.rm`, `Pkg.gc()`, `juliaup default` y `cpan`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- **`command-catalog`:** el requisito "Contenido mínimo del catálogo empaquetado" incluye:
  - las 5 categorías nuevas y su orden;
  - la forma única del código en línea;
  - la variante por shell para borrar la salida de Zig;
  - los avisos de Zig, Lua y Perl.
- **`project-detection`:** el requisito "Señales del proyecto" añade las señales de las 5 categorías.

## Impact

- **Catálogo:** se añaden cinco archivos: `catalog/r.json`, `lua.json`, `zig.json`, `julia.json` y `perl.json`.
- **Tests:**
  - `test/unit/catalog/content.test.ts`: orden de las categorías, código en línea, variantes, avisos y riesgo;
  - `test/unit/project/detect.test.ts`: escenarios de detección;
  - `src/test/extension.test.ts`: lista de categorías.
- **Docs:**
  - README: herramientas incluidas y tabla de señales;
  - CHANGELOG;
  - ROADMAP: 3.5c ✅.
- **Sin cambios:** código, mensajes entre webview y extensión, y dependencias.
- **Tamaño:** unos 270 KB más de JSON, unos 60 KB comprimidos en el `.vsix`.
