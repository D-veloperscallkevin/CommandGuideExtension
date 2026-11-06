# Tasks

## 1. Categorías nuevas

Para cada categoría:
- comprobar los comandos en la documentación oficial (Context7 o la web oficial);
- escribir el JSON con:
  - `section: "languages"`, y `order`, `icon` y `detect` según la decisión 1 del design;
  - al menos 15 comandos traducidos a los 11 idiomas;
  - `risk` según la decisión 6;
  - `docs` en cada comando;
- verificar con `pnpm run test:unit`: schema, reglas, mínimo de comandos, traducción completa e iconos.

- [x] 1.1 `catalog/c-cpp.json`:
  - el binario por shell de la decisión 2, también en `gdb`;
  - el aviso de make en Windows de la decisión 3;
  - ningún comando de `cl`.
- [x] 1.2 `catalog/cmake.json`.
- [x] 1.3 `catalog/go.json`, con la compilación cruzada por shell y su aviso (decisión 4).
- [x] 1.4 `catalog/rust.json`, con cargo, rustup y rustc.

## 2. Tests

- [x] 2.1 En `test/unit/catalog/content.test.ts`:
  - actualizar la lista y el orden de las 23 categorías;
  - añadir el caso del binario: `./app` en `bash` y `zsh`, `.\app.exe` en `powershell` y `app.exe` en `cmd`;
  - añadir el caso de la compilación cruzada de Go en `bash`, `powershell` y `cmd`;
  - comprobar que ningún comando de `c-cpp` empieza por `cl `;
  - comprobar que los `clean` de `c-cpp`, `cmake` y `rust`, y `go clean -modcache`, son `destructive`.
- [x] 2.2 En `test/unit/project/detect.test.ts`, añadir los escenarios:
  - C++ con CMake;
  - `Makefile` solo, que no detecta nada;
  - Go con Makefile;
  - Rust.
- [x] 2.3 En `src/test/extension.test.ts`, actualizar la lista de categorías del test de integración.

## 3. Documentación y verificación

- [x] 3.1 Actualizar:
  - el README: herramientas incluidas en "Usage" y tabla de señales;
  - el CHANGELOG, en `[Unreleased]`;
  - el ROADMAP: marcar la fila 3.4b `catalog-native` con ✅.

  Ejecutar `pnpm run verify`, `pnpm run release:package` (comprobar el tamaño del `.vsix`) y `openspec validate catalog-native --strict`.

## 4. Prueba manual

- [x] 4.1 Dar al autor la lista de comprobación en F5:
  - las 4 categorías al final de "Lenguajes y entornos", en el orden de la decisión 1;
  - detección en vivo:
    - `main.cpp` en la raíz → `c-cpp`;
    - `CMakeLists.txt` → `cmake`;
    - `go.mod` → `go`;
    - `Cargo.toml` → `rust`;
    - un `Makefile` solo no detecta nada;
  - los ejemplos del binario y de la compilación cruzada de Go con PowerShell, con cmd y con Git Bash como terminal activa;
  - el aviso de make en Windows;
  - el comando se escribe en la terminal sin ejecutarse (`sendText(cmd, false)`, como el resto);
  - la búsqueda de `cargo build`, `cmake --build` y `go test`;
  - un comando `destructive` (`cargo clean`) pide confirmación;
  - repaso de los textos en español.

  Resultado (2026-11-06): todo correcto en F5 (orden de las categorías, detección en vivo de C/C++, CMake, Go y Rust, Makefile solo sin detección, binario y compilación cruzada de Go por shell en PowerShell, cmd y Git Bash, avisos de make y de las variables de Go, envío sin ejecutar, búsqueda, confirmación de cargo clean con devcommands.confirmDestructive activo y textos en español).
