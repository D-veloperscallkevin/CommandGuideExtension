## Context

- **Cómo se añade una categoría:** basta un `catalog/<id>.json` con `section`, `detect` y los comandos. El build lo copia a `dist/catalog/` y sus señales entran en el bundle. No hay que tocar código.
- **Tests que ya vigilan el contenido:**
  - schema y `checkCatalogRules`;
  - al menos 15 comandos por categoría;
  - traducción completa a 11 idiomas;
  - iconos Codicon existentes;
  - `docs` en cada comando;
  - la lista de categorías en `content.test.ts` y en `src/test/extension.test.ts`.
- **Orden:** en `languages` el último es dotnet (56). Terminal es 50, en `tools`, así que en la lista global va antes de Java.
- **Variantes por shell:** claves `bash`, `zsh`, `powershell` y `cmd`; no hay variante por sistema operativo. La 3.4a ya usa variantes para el wrapper de Maven y Gradle.
- **Generador:** los JSON se escriben con el script local de las 3.3 y 3.4a, que aplica el formato del catálogo. El script no se versiona.

## Goals / Non-Goals

**Goals:**
- Comandos útiles del día a día de C/C++, CMake, Go y Rust, con la sintaxis de su documentación actual.
- Ejemplos que funcionen tal cual en PowerShell y cmd en Windows, y en bash y zsh en Linux, macOS y WSL, sobre todo los que cambian entre shells: ejecutar el binario y la compilación cruzada de Go.
- Que el proyecto abierto muestre estas categorías en "En este proyecto".

**Non-Goals:**
- **MSVC (`cl`, `link`, `nmake`):** decidido con el autor. Solo funciona en la Developer PowerShell o el Developer Command Prompt. Los proyectos de Visual Studio se cubren con CMake (`--config Release`).
- **Instaladores** (`curl … | sh` de rustup, instaladores de Go o MSYS2): ejecutan scripts remotos o son gráficos.
- **Otros sistemas de build** (Meson, Bazel, Ninja suelto, Autotools `./configure`): Ninja solo aparece como generador de CMake (`-G Ninja`). Los demás, para lotes posteriores si hay demanda.
- **Gestores de paquetes de C/C++** (vcpkg, Conan): fuera de este lote.
- **Gestores de versiones de Go** (g, goenv, gvm): poco extendidos; `go install golang.org/dl/goX.Y@latest` tampoco entra.
- **`valgrind` y `perf`:** solo existen en Linux.

## Decisions

### 1. Categorías, orden, icono y señales

| id | order | icon | detect |
| --- | --- | --- | --- |
| `c-cpp` | 57 | `chip` | `*.c`, `*.cpp`, `*.h`, `*.hpp` |
| `cmake` | 58 | `tools` | `CMakeLists.txt`, `CMakePresets.json`, `CMakeUserPresets.json` |
| `go` | 60 | `symbol-structure` | `go.mod`, `go.sum`, `go.work` |
| `rust` | 62 | `flame` | `Cargo.toml`, `Cargo.lock`, `rust-toolchain.toml`, `rust-toolchain` |

- **Ubicación:** todas van en `languages`. En el panel aparecen al final de "Lenguajes y entornos", después de .NET.
- **Iconos:** los cuatro existen en `@vscode/codicons` (comprobado en `codicon.csv`):
  - `chip` por el código nativo;
  - `tools` por el sistema de build;
  - `symbol-structure` por los `struct` de Go;
  - `flame` por Rust ("blazingly fast"), porque `gear` ya lo usa Gradle.
- **Makefile no detecta nada:** decidido con el autor. Un Makefile aparece también en proyectos de Go, Python, Node o documentación, y mostraría C/C++ por error.
- **`CMakeLists.txt` no detecta `c-cpp`:** casi siempre hay fuentes `.c` o `.cpp` en la raíz o en `src/`. Si están en `src/`, el usuario ve CMake y busca C/C++ en la lista. Así se evita que un proyecto CMake de otro lenguaje (Fortran, CUDA) muestre C/C++.
- **Extensiones que no entran:** `.cc`, `.cxx` y `.hh`. Son menos comunes en la raíz y se pueden añadir sin código si alguien lo pide.

### 2. Ejecutar el binario por shell

Decidido con el autor. GCC con MinGW y Clang en Windows añaden `.exe` al nombre de `-o app`.

| Shell | Forma | Motivo |
| --- | --- | --- |
| bash, zsh | `./app` | los ejecutables del directorio actual necesitan `./` |
| PowerShell | `.\app.exe` | PowerShell no ejecuta archivos del directorio actual sin `.\` |
| cmd | `app.exe` | cmd busca primero en el directorio actual |

- Los comandos de compilación usan `-o ${output}` con placeholder `app` en todos los shells. Escribir `-o app` en Windows produce `app.exe`.
- En Git Bash sobre Windows, `./app` también funciona, porque bash resuelve `app.exe`.
- La misma regla vale para `gdb`: `gdb ./app` en bash, `gdb .\app.exe` en PowerShell y `gdb app.exe` en cmd.

### 3. make

- Los comandos de make van en `c-cpp`: `make`, `make -j`, `make ${target}`, `make -n` y `make clean` (destructive).
- Su descripción avisa, en los 11 idiomas, de que en Windows make se instala con MSYS2 o MinGW, donde se llama `mingw32-make`.
- No llevan variante de PowerShell ni de cmd: el nombre depende de cómo se instaló y no del shell.

### 4. Compilación cruzada de Go por shell

Decidido con el autor.

| Shell | Ejemplo |
| --- | --- |
| bash, zsh | `GOOS=${os} GOARCH=${arch} go build` |
| PowerShell | `$env:GOOS="${os}"; $env:GOARCH="${arch}"; go build` |
| cmd | `set GOOS=${os}&& set GOARCH=${arch}&& go build` |

- **Placeholders:** `linux` y `amd64`.
- **En cmd, `&&` va pegado al valor:** con un espacio delante, la variable guardaría ese espacio final.
- **Aviso:** en PowerShell y cmd las variables siguen fijadas en esa terminal. Lo avisa la descripción, en los 11 idiomas: los siguientes `go build` también compilarán para ese sistema hasta cerrar la terminal.
- **Comillas:** la plantilla de PowerShell lleva las comillas dobles fijas (`$env:GOOS="${os}"`), y eso es correcto. `quoteContexts` (`src/params/escape.ts`) detecta que `${os}` está dentro de comillas dobles, y `escapeValue` solo escapa los caracteres especiales, sin añadir comillas. En bash y cmd el `${os}` está fuera de comillas, y un valor simple como `linux` se escribe tal cual.

### 5. Contenido de cada categoría

Lista de partida. Cada comando se comprueba en la documentación oficial (Context7 o la web oficial) antes de escribirlo; si no se confirma, no entra.

- **`c-cpp`:**
  - versiones: `gcc --version`;
  - compilar: `gcc ${file} -o ${output}`, `g++ -std=c++20 -Wall -Wextra ${file} -o ${output}`, `clang ${file} -o ${output}` y `clang++ -std=c++20 ${file} -o ${output}`;
  - variantes de compilación: con depuración (`-g`), optimizado (`-O2`), solo el objeto (`-c`) y enlazar objetos (`g++ *.o -o ${output}`);
  - ejecutar el binario (decisión 2);
  - make: `make`, `make -j`, `make ${target}`, `make -n` y `make clean`;
  - herramientas: `gdb` (decisión 2), `clang-format -i ${file}` y `clang-tidy ${file}`.
- **`cmake`:**
  - versión: `cmake --version`;
  - configurar: `cmake -S . -B build`, `-DCMAKE_BUILD_TYPE=Release`, `-G Ninja` y `cmake --fresh -S . -B build`;
  - compilar: `cmake --build build`, `--config Release`, `--parallel` y `--target ${target}`;
  - borrar lo compilado: `cmake --build build --target clean`;
  - instalar: `cmake --install build`;
  - presets: `cmake --list-presets` y `cmake --preset ${preset}`;
  - tests: `ctest --test-dir build --output-on-failure`;
  - caché: `cmake -L build`.
- **`go`:**
  - versión: `go version`;
  - módulos: `go mod init ${module}`, `go mod tidy`, `go get ${package}` y `go get -u ./...`;
  - ejecutar y compilar: `go run .`, `go build`, `go build -o ${output}` y la compilación cruzada (decisión 4);
  - tests: `go test ./...`, `go test -run ${name} ./...`, `go test -cover ./...` y `go test -race ./...`;
  - calidad: `go vet ./...` y `go fmt ./...`;
  - herramientas: `go install ${package}@latest`, `go env` y `go clean -modcache`;
  - workspaces: `go work init`;
  - documentación: `go doc ${package}`.
- **`rust`:**
  - cargo: `new`, `init`, `build`, `build --release`, `run`, `check`, `test`, `test ${name}`, `clippy`, `fmt`, `add ${package}`, `remove ${package}`, `update`, `doc --open`, `clean`, `install ${package}` y `tree`;
  - rustup: `update`, `toolchain install ${version}`, `default ${version}`, `target add ${target}`, `component add ${component}` y `show`;
  - rustc: `rustc --version`.

### 6. Riesgo

- **`destructive`:** borrar la salida o la caché de compilación, es decir, `make clean`, `cmake --build build --target clean`, `go clean -modcache` y `cargo clean`.
- **`caution`:**
  - `cmake --install` (escribe en carpetas del sistema o en el prefijo de instalación);
  - `go get -u` y `cargo update` (cambian las versiones de las dependencias);
  - `go install` y `cargo install` (instalan binarios para el usuario);
  - `rustup default` (cambia la toolchain de todos los proyectos);
  - `cmake --fresh` (borra la caché de CMake del directorio de build).
- **`safe`:** el resto.

### 7. Parámetros, placeholders y traducciones

- **Nombres de parámetro:** se reutilizan los habituales (`file`, `package`, `module`, `name`, `version`, `outdir`) y se añaden `output`, `target`, `preset`, `component`, `os` y `arch`.
- **Placeholders:** el código no se traduce (`main.c`, `app`, `github.com/user/app`, `x86_64-unknown-linux-gnu`, `linux`, `amd64`) y lleva el mismo valor en los 11 idiomas.
- **Estilo:** el de las categorías actuales: título corto en imperativo, descripción de una línea y `tags` con sinónimos en cada idioma.

### 8. Mensajes webview↔extensión y dependencias

- **Mensajes:** sin cambios. Las categorías nuevas viajan en el mensaje `catalog` igual que las actuales.
- **Dependencias:** ninguna nueva.

## Risks / Trade-offs

- **Fuentes solo en `src/`:** un proyecto C sin CMake y sin fuentes en la raíz no se detecta. Es aceptable: la detección solo mira la raíz, y la categoría sigue visible en la lista.
- **make en Windows:** el ejemplo `make` no funciona en PowerShell si solo hay `mingw32-make`. Mitigación: el aviso en la descripción. Como nada se ejecuta solo, el usuario ve el comando antes de pulsar Enter.
- **Variables de Go en PowerShell y cmd:** quedan fijadas en la terminal. Mitigación: el aviso en la descripción.
- **Volumen de traducción:** unos 80 comandos en 11 idiomas. El test impide huecos, pero no valida la calidad. La prueba en F5 y la revisión del PR miran al menos `es` y `en`.
