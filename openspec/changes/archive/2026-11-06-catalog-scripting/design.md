## Context

- **Mecanismo:** como en las 3.3–3.5b, basta un `catalog/<id>.json` por categoría con `section`, `detect` y los comandos. No hay que tocar código.
- **Tests de contenido existentes:**
  - schema;
  - al menos 15 comandos por categoría;
  - los 11 idiomas;
  - iconos válidos;
  - `docs` en cada comando;
  - la lista de categorías.
- **Orden:** en `languages`, la última categoría es ocaml (78).
- **Variantes por shell:** el borrado de carpetas de Terminal (`rm -rf` / `Remove-Item -Recurse -Force` / `rmdir /s /q`) es el modelo para borrar la salida de Zig.
- **Avisos:** make en `c-cpp`, Clojure CLI y Scala CLI ya avisan en la descripción. Los avisos de Zig, Lua y Perl siguen ese patrón.
- **Generador:** los JSON se escriben con el script local de los lotes anteriores, que no se versiona.
- **Comprobado al preparar el change:**
  - **Zig:**
    - la versión estable actual es la 0.17.1 (ziglang.org/download, 2026-11-02);
    - la guía del sistema de compilación usa `zig build run`, `zig build test`, `-Doptimize=…`, `zig-out` y `.zig-cache`;
    - las notas de la 0.17 mantienen `zig init` y `zig fetch --save`;
    - `translate-c` pasa a un paquete externo, así que no se incluye.
  - **Strawberry Perl:** incluye `gmake` en `C:\Strawberry\c\bin`.

## Goals / Non-Goals

**Goals:**
- Comandos del día a día de R, Lua, Zig, Julia y Perl, con la sintaxis de su documentación actual.
- Ejemplos que funcionen tal cual en los cuatro shells, o que avisen si el nombre del binario cambia.

**Non-Goals:**
- **Frameworks:** Shiny, Plumber, LÖVE, Mojolicious y Dancer van en la 3.7.
- **Instaladores remotos:** los `curl … | sh` o scripts de PowerShell de juliaup, rig, Zig y cpanminus ejecutan scripts remotos.
- **Raku:** no está en el ROADMAP.
- **`zig translate-c`:** en Zig 0.17 queda obsoleto en favor de un paquete externo.
- **Gestores de versiones de Lua y Perl** (hererocks, perlbrew, plenv): no funcionan en PowerShell ni en cmd, y mise ya los cubre en `version-managers`.

## Decisions

### 1. Categorías, orden, icono y señales

| id | order | icon | detect |
| --- | --- | --- | --- |
| `r` | 80 | `graph` | `DESCRIPTION`, `*.Rproj`, `renv.lock`, `.Rprofile`, `*.R` |
| `lua` | 81 | `circle-filled` | `*.rockspec`, `.luarc.json`, `.luacheckrc`, `*.lua` |
| `zig` | 82 | `sparkle` | `build.zig`, `build.zig.zon`, `*.zig` |
| `julia` | 83 | `symbol-numeric` | `Project.toml`, `JuliaProject.toml`, `Manifest.toml`, `*.jl` |
| `perl` | 84 | `regex` | `cpanfile`, `cpanfile.snapshot`, `Makefile.PL`, `Build.PL`, `dist.ini`, `*.pl`, `*.pm` |

- **Iconos:** los cinco existen en `codicon.csv` y no los usa ninguna otra categoría.
  - `graph`: R es un lenguaje de estadística y gráficos.
  - `circle-filled`: la luna del logo de Lua.
  - `sparkle`: el rayo de Zig.
  - `symbol-numeric`: el cálculo numérico de Julia.
  - `regex`: las expresiones regulares de Perl.
- **Señales con nombre genérico que sí se usan:**
  - `DESCRIPTION` es el archivo obligatorio de un paquete de R. Ningún otro ecosistema común lo pone en la raíz.
  - `Project.toml` y `Manifest.toml` son de Julia. La comparación no distingue mayúsculas, pero ningún otro ecosistema común usa esos nombres.
  - `Makefile.PL` y `Build.PL` son de Perl. Un `Makefile` solo sigue sin detectar nada.
  - `.luarc.json` es la configuración de lua-language-server.
- **Señales que no se usan:**
  - `init.lua` no es necesario, porque ya lo cubre `*.lua`;
  - `*.t` (tests de Perl) es una extensión demasiado genérica.

### 2. Código en línea con una sola forma

- **Problema:** las comillas simples no son de cita en cmd, y PowerShell 5.1 pierde las comillas dobles escapadas al pasarlas a un programa nativo. No hay una forma con comillas dobles dentro del código que funcione en los cuatro shells.
- **Solución:**
  - el código va entre comillas dobles;
  - dentro, solo se usan comillas simples (R las admite como cadenas) o ninguna (Julia);
  - los nombres de paquete van como argumentos al final, fuera de las comillas.

| Comando | Ejemplo (igual en los cuatro shells) |
| --- | --- |
| Instalar un paquete de CRAN | `Rscript -e "install.packages(commandArgs(TRUE), repos='https://cloud.r-project.org')" dplyr` |
| renv: instalar | `Rscript -e "renv::install(commandArgs(TRUE))" dplyr` |
| renv: restaurar | `Rscript -e "renv::restore()"` |
| Julia: añadir | `julia --project -e "using Pkg; Pkg.add(ARGS)" Example` |
| Julia: instanciar | `julia --project -e "using Pkg; Pkg.instantiate()"` |
| Julia: crear paquete | `julia -e "using Pkg; Pkg.generate(ARGS[1])" MyPkg` |

- **Parámetros:** el `${package}` queda fuera de las comillas, así que el escapado normal de parámetros basta.
- **Sin interacción:** `repos=` evita que R pregunte por el mirror de CRAN.
- **Comandos de R incluidos** (todos con `Rscript -e`): `update.packages(ask=FALSE, repos=…)`, `devtools::test()`, `devtools::document()` y `renv::init()`, `snapshot()`, `status()` y `update()`.

### 2b. R en PowerShell

- En PowerShell, `r` es el alias integrado de `Invoke-History`, y los alias no distinguen mayúsculas: `R --version` repetiría el último comando.
- Los comandos que empiezan por `R` (`R`, `R --version`, `R CMD build`, `R CMD check`, `R CMD INSTALL`) declaran `shells.powershell` con `R.exe`, igual que `iex.bat` en Elixir.
- `Rscript` no choca con ningún alias y no lleva variante.

### 3. Borrar la salida de Zig

| Shell | Ejemplo |
| --- | --- |
| bash | `rm -rf zig-out .zig-cache` |
| zsh | sin variante: usa la de bash |
| PowerShell | `Remove-Item -Recurse -Force zig-out, .zig-cache` |
| cmd | `rmdir /s /q zig-out .zig-cache` |

- Zig no tiene un `zig build clean`, así que se borran las dos carpetas.
- El comando es `destructive`.

### 4. Avisos

- **Zig:**
  - **Afecta a:** `zig init`, `zig fetch --save ${url}` y `zig build -Doptimize=ReleaseFast`.
  - **Texto en español:** " Sigue Zig 0.17; en otras versiones puede cambiar."
- **Lua:**
  - **Afecta a:** los comandos que usan `lua` o `luac`.
  - **Texto en español:** " En algunas instalaciones el intérprete se llama lua5.4 o lua54."
- **Perl:**
  - **Afecta a:** `make test`.
  - **Texto en español:** " En Windows con Strawberry Perl, make se llama gmake."
  - **Comando relacionado:** `perl -V:make` muestra qué make usa la instalación.

### 5. Contenido de cada categoría

Es la lista de partida. Cada comando se comprueba en la documentación oficial (Context7 o la web oficial) antes de escribirlo, y lo que no se confirma no entra.

- **`r`:**
  - intérprete: `R --version`, `R` y `Rscript ${file}`;
  - paquetes: instalar desde CRAN y actualizar todos;
  - desarrollo de paquetes: `R CMD build .`, `R CMD check ${file}` (el `.tar.gz`), `R CMD INSTALL .`, `devtools::test()` y `devtools::document()`;
  - renv: `init`, `install`, `snapshot`, `restore`, `status` y `update`.
- **`lua`:**
  - intérprete: `lua -v`, `lua`, `lua ${file}` y `luac -p ${file}`;
  - LuaRocks: `luarocks init`, `install ${package}`, `install --local ${package}`, `remove ${package}`, `list`, `search ${package}`, `show ${package}`, `make`, `pack ${package}`, `test` y `config`.
- **`zig`:**
  - proyecto: `zig version`, `zig init`, `zig build`, `zig build run`, `zig build test`, `zig build -Doptimize=ReleaseFast` y `zig build --help`;
  - archivo suelto: `zig run ${file}`, `zig test ${file}`, `zig fmt .` y `zig ast-check ${file}`;
  - dependencias y herramientas: `zig fetch --save ${url}`, `zig env`, `zig targets` y `zig cc ${file}`;
  - borrar la salida (decisión 3).
- **`julia`:**
  - intérprete: `julia --version`, `julia`, `julia ${file}` y `julia --project`;
  - Pkg (decisión 2): `add`, `rm`, `instantiate`, `update`, `status`, `test`, `gc` y `generate`;
  - juliaup: `juliaup status`, `juliaup add ${version}`, `juliaup default ${version}` y `juliaup update`.
- **`perl`:**
  - intérprete: `perl -v`, `perl ${file}` y `perl -c ${file}`;
  - documentación: `perldoc ${module}` y `perldoc -f ${name}`;
  - módulos: `cpan ${module}`, `cpanm ${module}` y `cpanm --installdeps .`;
  - Carton: `carton install`, `carton exec ${command}` y `carton bundle`;
  - tests: `prove -lr t`;
  - MakeMaker: `perl Makefile.PL`, `make test` y `perl -V:make`;
  - calidad: `perltidy ${file}` y `perlcritic ${file}`.

### 6. Riesgo

- **`destructive`:**
  - borrar la salida de Zig;
  - `luarocks remove`, igual que `gem uninstall`.
- **`caution`:**
  - actualizar todos los paquetes de R y `renv::update()`;
  - `Pkg.update()`;
  - `Pkg.rm`, que solo quita el paquete de `Project.toml`;
  - `Pkg.gc()`, que solo borra versiones que no usa ningún entorno;
  - `juliaup default`, porque cambia la versión por defecto;
  - `cpan`, porque la primera vez configura CPAN de forma interactiva.
- **`safe`:** el resto.

### 7. Parámetros y traducciones

- **Parámetros:** se reutilizan las etiquetas existentes: `file`, `package`, `name`, `version`, `module`, `command` y `url`. Si `url` no existe, se añade a `LABELS` del generador.
- **Placeholders:** el código no se traduce y lleva el mismo valor en los 11 idiomas. Ejemplos: `dplyr`, `luasocket`, `Example`, `Mojolicious`, `1.11`, `main.zig`.
- **Estilo:** igual que en las categorías actuales.

## Risks / Trade-offs

- **`*.R`, `*.pl` y `*.lua` en la raíz:**
  - la comparación sin mayúsculas hace que `*.r` también detecte R;
  - `*.pl` coincide con Prolog;
  - los scripts sueltos son frecuentes.

  Se acepta, igual que `*.php` y `*.hs`.
- **`DESCRIPTION` o `Project.toml` en proyectos que no son de R ni de Julia:** es raro. Una detección de más solo añade una categoría a "En este proyecto".
- **Zig cambia rápido:** el aviso indica la versión de referencia. Al salir la 0.18, un change de mantenimiento revisará los comandos.
- **`devtools` y `renv` no vienen con R:** la descripción indica que hay que instalarlos antes.
- **Traducción:** son unos 85 comandos en 11 idiomas. El test impide huecos, pero no valida la calidad; la prueba en F5 repasa al menos el español.
