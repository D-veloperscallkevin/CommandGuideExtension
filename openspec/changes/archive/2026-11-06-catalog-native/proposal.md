## Why

El catálogo no tiene comandos de C/C++, CMake, Go ni Rust. Quien compila con `gcc`, `cmake`, `go` o `cargo` no encuentra sus comandos, y su proyecto no aparece en "En este proyecto".

Fase del roadmap: **Fase 3 (v1.x)**, change 3.4b. Es la segunda mitad de la 3.4, que se dividió en 3.4a `catalog-jvm-dotnet` (ya fusionado) y esta.

## What Changes

- **Cuatro categorías nuevas** en la sección `languages`, cada una con al menos 15 comandos traducidos a los 11 idiomas y con enlace `docs`:
  - **`c-cpp`**: `gcc`, `g++`, `clang` y `clang++` (compilar, depuración, optimizado, objeto y enlazado), ejecutar el binario, `make` (con el aviso de Windows), `gdb`, `clang-format` y `clang-tidy`;
  - **`cmake`**: configurar (`-S . -B build`, tipo de build, `-G Ninja`), compilar (`--build`, `--config`, `--parallel`, `--target`), `clean`, `--install`, presets, `ctest`, `--fresh` y `-L`;
  - **`go`**: `mod init`, `mod tidy`, `get`, `run`, `build`, `test` (con `-run`, `-cover` y `-race`), `vet`, `fmt`, `install`, `env`, `clean -modcache`, `work init` y la compilación cruzada;
  - **`rust`**: `cargo` (`new`, `init`, `build`, `run`, `check`, `test`, `clippy`, `fmt`, `add`, `remove`, `update`, `doc`, `clean`, `install`, `tree`), `rustup` (`update`, `toolchain install`, `default`, `target add`, `component add`, `show`) y `rustc --version`.
- **Binario por shell.** El comando que ejecuta el programa compilado se escribe distinto en cada shell:

  | Shell | Ejemplo |
  | --- | --- |
  | bash, zsh | `./app` |
  | PowerShell | `.\app.exe` |
  | cmd | `app.exe` |

- **Compilación cruzada de Go por shell.** Las variables `GOOS` y `GOARCH` se fijan con la sintaxis de cada shell:

  | Shell | Ejemplo |
  | --- | --- |
  | bash, zsh | `GOOS=linux GOARCH=amd64 go build` |
  | PowerShell | `$env:GOOS="linux"; $env:GOARCH="amd64"; go build` |
  | cmd | `set GOOS=linux&& set GOARCH=amd64&& go build` |

  En PowerShell y cmd las variables siguen fijadas en esa terminal, y la descripción lo avisa.
- **Solo GCC y Clang.** El compilador de Microsoft (`cl`) queda fuera; las descripciones indican MinGW, MSYS2 o LLVM para Windows. Los comandos de `make` avisan de que en Windows se instala con MSYS2 o MinGW (`mingw32-make`).
- **Señales `detect`:**
  - `*.c`, `*.cpp`, `*.h` y `*.hpp` → `c-cpp`. Un `Makefile` no detecta C/C++, porque también lo usan proyectos de Go, Python y otros;
  - `CMakeLists.txt`, `CMakePresets.json` y `CMakeUserPresets.json` → `cmake`;
  - `go.mod`, `go.sum` y `go.work` → `go`;
  - `Cargo.toml`, `Cargo.lock`, `rust-toolchain.toml` y `rust-toolchain` → `rust`.
- **Riesgo:**
  - `destructive`: `make clean`, `cmake --build … --target clean`, `go clean -modcache` y `cargo clean`;
  - `caution`: `cmake --install`, `go get -u`, `cargo update`, `cargo install` y `rustup default`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `command-catalog`: "Contenido mínimo del catálogo empaquetado" incluye las 4 categorías nuevas, su orden y las reglas del binario y de la compilación cruzada de Go por shell.
- `project-detection`: "Señales del proyecto" añade las señales de C/C++, CMake, Go y Rust.

## Impact

- **Catálogo:** `catalog/c-cpp.json`, `cmake.json`, `go.json` y `rust.json`, nuevos.
- **Tests:**
  - `test/unit/catalog/content.test.ts`: lista de categorías, binario y `GOOS` por shell, y los `clean` como `destructive`;
  - `test/unit/project/detect.test.ts`: señales nuevas, incluido que un `Makefile` solo no detecta nada;
  - `src/test/extension.test.ts`: lista de categorías.
- **Docs:** README (herramientas y tabla de señales), CHANGELOG y ROADMAP (3.4b ✅).
- **Código:** ninguno.
- **Mensajes webview↔extensión:** sin cambios.
- **Dependencias:** ninguna nueva.
- **Tamaño:** unos 220 KB más de JSON, unos 50 KB comprimidos en el `.vsix`.
