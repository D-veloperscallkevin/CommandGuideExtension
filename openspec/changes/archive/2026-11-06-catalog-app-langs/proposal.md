## Why

El catálogo no tiene comandos de PHP, Ruby, Dart, Flutter ni Swift. Quien trabaje con Composer, Bundler, `flutter` o `swift package` no encuentra sus comandos, y su proyecto no aparece en "En este proyecto". Los gestores de versiones multilenguaje (asdf y mise) y rbenv tampoco están.

Fase del roadmap: **Fase 3 (v1.x)**, change 3.5a.

El ROADMAP agrupa en un único change 3.5 quince lenguajes y asdf/mise: unas 16 categorías y más de 250 comandos. Se divide en tres PR, como la 3.3 y la 3.4:
- **3.5a `catalog-app-langs`**: este change;
- **3.5b `catalog-functional`**: Elixir, Erlang, Haskell, Scala, Clojure y OCaml;
- **3.5c `catalog-scripting`**: R, Lua, Zig, Julia y Perl.

## What Changes

- **Cinco categorías nuevas** en la sección `languages`, cada una con al menos 15 comandos traducidos a los 11 idiomas y con enlace `docs`:
  - **`php`**:
    - `php -v`, `php -S` (servidor integrado), `php -a`, `php -l`, `php -m` y `php --ini`;
    - `composer install`, `require`, `require --dev`, `remove`, `update`, `outdated`, `dump-autoload`, `create-project` y `run-script`;
  - **`ruby`**:
    - `ruby -v`, ejecutar un archivo e `irb`;
    - `gem install`, `gem list` y `gem uninstall`;
    - `bundle install`, `add`, `update`, `exec`, `outdated` e `init`;
    - `rake -T` y `rake <tarea>`;
  - **`dart`**: `create`, `run`, `test`, `format`, `analyze`, `fix --apply`, `pub get`, `pub add`, `pub remove`, `pub upgrade`, `pub outdated`, `compile exe` y `doc`;
  - **`flutter`**:
    - `doctor`, `devices`, `create`, `run`, `run -d chrome` y `test`;
    - `build apk`, `appbundle`, `web` e `ios`;
    - `pub get`, `clean`, `upgrade`, `analyze` y `emulators`;
  - **`swift`**:
    - `swift --version`, `package init`, `build`, `build -c release`, `run`, `test`, `package resolve`, `package update`, `package clean` y `repl`;
    - `xcodebuild -list`, `xcodebuild build` y `xcrun simctl list`.
- **Gestores de versiones:**
  - **rbenv:** `install`, `local`, `global`, `versions` y `uninstall`;
  - **asdf**, con la sintaxis de asdf 0.16 o superior: `plugin add`, `install`, `set`, `set -u` y `list`;
  - **mise:** activar, `use`, `install`, `ls` y `uninstall`.
- **Avisos en la descripción**, en los 11 idiomas:
  - `xcodebuild`, `xcrun` y `flutter build ios` solo funcionan en macOS;
  - rbenv y asdf no funcionan en PowerShell ni en cmd;
  - activar mise no es posible en cmd, donde se usan los *shims*.
- **Activación de mise por shell**, como la de fnm:

  | Shell | Ejemplo |
  | --- | --- |
  | bash | `eval "$(mise activate bash)"` |
  | zsh | `eval "$(mise activate zsh)"` |
  | PowerShell | `(&mise activate pwsh) \| Out-String \| Invoke-Expression` |

- **Señales `detect`:**
  - `composer.json`, `composer.lock` y `*.php` → `php`;
  - `Gemfile`, `Gemfile.lock`, `Rakefile`, `*.gemspec` y `.ruby-version` → `ruby`;
  - `pubspec.yaml` y `pubspec.lock` → `dart`;
  - `pubspec.yaml` → `flutter`;
  - `Package.swift`, `*.xcodeproj` y `*.xcworkspace` → `swift`;
  - `.ruby-version`, `.tool-versions`, `mise.toml` y `.mise.toml` → `version-managers`.
- **Riesgo:**
  - `destructive`: `gem uninstall`, `flutter clean`, `swift package clean`, `rbenv uninstall` y `mise uninstall`;
  - `caution`: `composer update`, `bundle update`, `dart fix --apply`, `dart pub upgrade`, `flutter upgrade`, `swift package update`, `rbenv global`, `asdf set -u` y `gem install`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `command-catalog`: "Contenido mínimo del catálogo empaquetado" incluye las 5 categorías nuevas, su orden, los avisos de macOS, de rbenv y de asdf, y la activación de mise por shell.
- `project-detection`: "Señales del proyecto" añade las señales de PHP, Ruby, Dart, Flutter, Swift, `.ruby-version`, `.tool-versions` y `mise.toml`.

## Impact

- **Catálogo:**
  - `catalog/php.json`, `ruby.json`, `dart.json`, `flutter.json` y `swift.json`, nuevos;
  - `catalog/version-managers.json` gana los comandos de rbenv, asdf y mise y sus señales.
- **Tests:**
  - `test/unit/catalog/content.test.ts`: lista de categorías, activación de mise, avisos y riesgo;
  - `test/unit/project/detect.test.ts`: señales nuevas;
  - `src/test/extension.test.ts`: lista de categorías.
- **Docs:** README (herramientas y tabla de señales), CHANGELOG y ROADMAP (3.5 se divide en 3.5a ✅, 3.5b y 3.5c).
- **Código:** ninguno.
- **Mensajes webview↔extensión:** sin cambios.
- **Dependencias:** ninguna nueva.
- **Tamaño:** unos 280 KB más de JSON, unos 60 KB comprimidos en el `.vsix`.
