# Tasks

## 1. Categorías nuevas y gestores de versiones

Pasos para cada categoría:
1. Comprobar los comandos en la documentación oficial (Context7 o la web oficial).
2. Escribir el JSON con:
   - `section: "languages"`;
   - `order`, `icon` y `detect` según la decisión 1 del design;
   - al menos 15 comandos traducidos a los 11 idiomas;
   - `risk` según la decisión 6;
   - `docs` en cada comando.
3. Verificar con `pnpm run test:unit`: schema, reglas, mínimo de comandos, traducción completa e iconos.

- [x] 1.1 `catalog/php.json`.
- [x] 1.2 `catalog/ruby.json`.
- [x] 1.3 `catalog/dart.json`.
- [x] 1.4 `catalog/flutter.json`, con el aviso de macOS en `flutter build ios`.
- [x] 1.5 `catalog/swift.json`, con el aviso de macOS en `xcodebuild` y `xcrun`.
- [x] 1.6 `catalog/version-managers.json`:
  - rbenv y asdf con el aviso de bash/zsh (decisión 2);
  - asdf con la sintaxis de la 0.16 (decisión 4);
  - mise con la activación por shell y el aviso de cmd (decisión 3);
  - `.ruby-version`, `.tool-versions`, `mise.toml` y `.mise.toml` en `detect`.

## 2. Tests

- [x] 2.1 En `test/unit/catalog/content.test.ts`:
  - actualizar la lista y el orden de las 28 categorías;
  - añadir el caso de la activación de mise en `bash`, `zsh` y `powershell`;
  - comprobar que ningún comando de asdf usa `asdf local` ni `asdf global`;
  - comprobar que los comandos con `xcodebuild` o `xcrun`, y `flutter build ios`, avisan de macOS en español;
  - comprobar que `gem uninstall`, `flutter clean` y `swift package clean` son `destructive`.
- [x] 2.2 En `test/unit/project/detect.test.ts`, añadir los escenarios:
  - Laravel;
  - Rails con `.ruby-version`;
  - Flutter;
  - paquete de Swift;
  - `.tool-versions` y `mise.toml` en varias carpetas.
- [x] 2.3 En `src/test/extension.test.ts`, actualizar la lista de categorías del test de integración.

## 3. Documentación y verificación

- [x] 3.1 Actualizar:
  - el README: herramientas incluidas en "Usage" y tabla de señales;
  - el CHANGELOG, en `[Unreleased]`;
  - el ROADMAP: dividir la fila 3.5 en 3.5a `catalog-app-langs` ✅, 3.5b `catalog-functional` (Elixir, Erlang, Haskell, Scala, Clojure y OCaml) y 3.5c `catalog-scripting` (R, Lua, Zig, Julia y Perl).

  Después, ejecutar:
  - `pnpm run verify`;
  - `pnpm run release:package`, comprobando el tamaño del `.vsix`;
  - `openspec validate catalog-app-langs --strict`.

## 4. Prueba manual

- [x] 4.1 Dar al autor la lista de comprobación en F5:
  - las 5 categorías aparecen al final de "Lenguajes y entornos", en el orden de la decisión 1;
  - detección en vivo:
    - `composer.json` → `php`;
    - `Gemfile` → `ruby`;
    - `pubspec.yaml` → `dart` y `flutter`;
    - `Package.swift` → `swift`;
    - `.tool-versions` → Gestores de versiones;
  - la activación de mise en PowerShell, cmd y Git Bash como terminal activa;
  - el aviso de macOS en Swift → `xcodebuild` y en Flutter → `build ios`, y el de bash/zsh en rbenv y asdf;
  - el comando se escribe en la terminal sin ejecutarse (`sendText(cmd, false)`, como el resto);
  - la búsqueda de `composer require`, `bundle exec` y `flutter run`;
  - un comando `destructive` (`flutter clean`) pide confirmación con `devcommands.confirmDestructive` activo;
  - repaso de los textos en español.

  Resultado (2026-11-06): todo correcto en F5 (orden de las 5 categorías, detección en vivo, activación de mise por shell, avisos de macOS y de bash/zsh, búsqueda y confirmación de `flutter clean` con `devcommands.confirmDestructive` activo).
