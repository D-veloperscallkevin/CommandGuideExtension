## Context

- **Cómo se añade una categoría:** basta un `catalog/<id>.json` con `section`, `detect` y los comandos. El build lo copia a `dist/catalog/` y sus señales entran en el bundle. No hay que tocar código.
- **Tests que ya vigilan el contenido:**
  - schema y `checkCatalogRules`;
  - al menos 15 comandos por categoría;
  - traducción completa a 11 idiomas;
  - iconos Codicon existentes;
  - `docs` en cada comando;
  - la lista de categorías en `content.test.ts` y en `src/test/extension.test.ts`.
- **Orden:** en `languages` el último es rust (62).
- **Variantes y avisos ya usados:**
  - la activación de fnm declara una variante por shell, y el ejemplo de mise sigue el mismo patrón;
  - sdkman no lleva variantes y avisa en la descripción, y rbenv y asdf siguen ese patrón;
  - la cita de valores (`src/params/escape.ts`) ya cubre los parámetros nuevos.
- **Generador:** los JSON se escriben con el script local de los lotes anteriores; el script no se versiona.

## Goals / Non-Goals

**Goals:**
- Comandos útiles del día a día de PHP, Ruby, Dart, Flutter y Swift, con la sintaxis de su documentación actual.
- Gestores de versiones multilenguaje (asdf, mise) y rbenv junto a nvm, pyenv y sdkman.
- Ejemplos que funcionen tal cual en cada shell, o que avisen cuando la herramienta no existe en ese sistema (macOS) o en ese shell (rbenv, asdf).

**Non-Goals:**
- **Frameworks:** Laravel (`artisan`), Rails (`rails`), Symfony y Vapor son de la 3.7. Aquí solo entran los lenguajes y sus gestores de paquetes.
- **CocoaPods y fastlane:** son de la 3.13 (`catalog-gamedev-mobile`).
- **Instaladores** (`curl … | sh` de mise, rbenv o asdf; el instalador del SDK de Flutter): ejecutan scripts remotos.
- **rbenv-win y uru:** tienen otra sintaxis. rbenv lleva el aviso de bash/zsh, como sdkman.
- **Lenguajes de la 3.5b y la 3.5c.**

## Decisions

### 1. Categorías, orden, icono y señales

| id | order | icon | detect |
| --- | --- | --- | --- |
| `php` | 64 | `globe` | `composer.json`, `composer.lock`, `*.php` |
| `ruby` | 66 | `ruby` | `Gemfile`, `Gemfile.lock`, `Rakefile`, `*.gemspec`, `.ruby-version` |
| `dart` | 68 | `symbol-event` | `pubspec.yaml`, `pubspec.lock` |
| `flutter` | 69 | `device-mobile` | `pubspec.yaml` |
| `swift` | 70 | `bracket-dot` | `Package.swift`, `*.xcodeproj`, `*.xcworkspace` |

- Todas van en `languages`. Los cinco iconos existen en `@vscode/codicons` (comprobado en `codicon.csv`):
  - `globe` por la web;
  - `ruby` por su nombre;
  - `symbol-event` por la flecha de Dart;
  - `device-mobile` por las apps móviles;
  - `bracket-dot` porque no hay un icono de Swift.
- **`*.php` en la raíz detecta PHP**, porque muchos proyectos sin Composer tienen `index.php` en la raíz.
- **`pubspec.yaml` detecta `dart` y `flutter`.** Un proyecto Flutter siempre es Dart, y distinguir uno de Dart puro exigiría leer el contenido de `pubspec.yaml`, cosa que la detección no hace. Quien trabaja solo con Dart verá también Flutter. Es aceptable, porque las dos categorías sirven.
- **`.ruby-version` detecta `ruby` y `version-managers`**, igual que `.python-version` detecta `python` y `version-managers`.
- **`.tool-versions`, `mise.toml` y `.mise.toml` detectan solo `version-managers`.** Su contenido decide los lenguajes, y la detección no lo lee.
- **`Package.resolved` no detecta nada**, porque siempre acompaña a `Package.swift`.

### 2. Avisos de sistema y de shell

| Aviso | Comandos | Motivo |
| --- | --- | --- |
| Solo macOS | `xcodebuild -list`, `xcodebuild build`, `xcrun simctl list`, `flutter build ios` | Xcode solo existe en macOS |
| Solo bash y zsh | todos los de rbenv y asdf | son funciones de shell POSIX; en Windows nativo no existen |
| cmd no se activa | la activación de mise | mise no puede activarse en cmd; se usan los *shims* (`%LOCALAPPDATA%\mise\shims` en el `Path`) |

- Los avisos van al final de la descripción, en los 11 idiomas, con un texto común por tipo de aviso, como el de make en la 3.4b.
- `swift build` y los demás comandos de SwiftPM sí funcionan en Linux y Windows: no llevan aviso.

### 3. Activación de mise por shell

Comprobado en la documentación de mise (`mise.jdx.dev/shell-setup.html`).

| Shell | Ejemplo |
| --- | --- |
| bash | `eval "$(mise activate bash)"` |
| zsh | `eval "$(mise activate zsh)"` |
| PowerShell | `(&mise activate pwsh) \| Out-String \| Invoke-Expression` |
| cmd | sin variante: cmd no se puede activar |

- **cmd:** como no hay variante, el ejemplo muestra el de bash. La descripción explica que en cmd hay que añadir los *shims* al `Path`.
- **PowerShell:** mise solo actualiza el entorno al cambiar de carpeta en PowerShell 7 o superior. La descripción lo menciona.

### 4. asdf 0.16 o superior

`asdf local` y `asdf global` desaparecieron en asdf 0.16 (comprobado en `asdf-vm.com/guide/upgrading-to-v0-16.html`). Los comandos de asdf son:
- `asdf plugin add ${name}`;
- `asdf install ${name} ${version}`;
- `asdf set ${name} ${version}`, que escribe en el `.tool-versions` del directorio actual;
- `asdf set -u ${name} ${version}`, que escribe en el del home (caution);
- `asdf list ${name}`.

Un test comprueba que ningún comando usa `asdf local` ni `asdf global`.

### 5. Contenido de cada categoría

Es la lista de partida. Cada comando se comprueba en la documentación oficial (Context7 o la web oficial) antes de escribirlo; si no se confirma, no entra.

- **`php`:**
  - intérprete: `php -v`, `php ${file}`, `php -S localhost:${port}`, `php -a`, `php -l ${file}`, `php -m` y `php --ini`;
  - Composer: `composer install`, `composer require ${package}`, `composer require --dev ${package}`, `composer remove ${package}`, `composer update`, `composer outdated --direct`, `composer dump-autoload`, `composer create-project ${package} ${folder}`, `composer run-script ${script}` y `composer validate`.
- **`ruby`:**
  - intérprete: `ruby -v`, `ruby ${file}` e `irb`;
  - gemas: `gem install ${package}`, `gem list` y `gem uninstall ${package}`;
  - Bundler: `bundle install`, `bundle add ${package}`, `bundle update`, `bundle exec ${command}`, `bundle outdated`, `bundle init` y `bundle config set --local path vendor/bundle`;
  - Rake: `rake -T` y `rake ${task}`.
- **`dart`:**
  - proyecto: `dart create ${name}`, `dart run`, `dart test`, `dart format .`, `dart analyze` y `dart fix --apply`;
  - paquetes: `dart pub get`, `dart pub add ${package}`, `dart pub add dev:${package}`, `dart pub remove ${package}`, `dart pub upgrade` y `dart pub outdated`;
  - compilación y documentación: `dart compile exe ${file}`, `dart doc` y `dart --version`.
- **`flutter`:**
  - entorno: `flutter doctor`, `flutter devices` y `flutter emulators`;
  - desarrollo: `flutter create ${name}`, `flutter run`, `flutter run -d chrome`, `flutter test` y `flutter analyze`;
  - compilación: `flutter build apk`, `flutter build appbundle`, `flutter build web` y `flutter build ios`;
  - paquetes y mantenimiento: `flutter pub get`, `flutter pub add ${package}`, `flutter clean`, `flutter upgrade` y `flutter --version`.
- **`swift`:**
  - SwiftPM: `swift --version`, `swift package init --type executable`, `swift build`, `swift build -c release`, `swift run`, `swift test`, `swift test --filter ${name}`, `swift package resolve`, `swift package update`, `swift package clean` y `swift repl`;
  - Xcode, solo macOS: `xcodebuild -list`, `xcodebuild -scheme ${name} build` y `xcrun simctl list devices`.
- **`version-managers`:**
  - rbenv: `rbenv install ${version}`, `rbenv local ${version}`, `rbenv global ${version}`, `rbenv versions` y `rbenv uninstall ${version}`;
  - asdf: los cinco de la decisión 4;
  - mise: la activación de la decisión 3, `mise use ${tool}@${version}`, `mise install`, `mise ls` y `mise uninstall ${tool}@${version}`.
  - Los títulos llevan el prefijo de la herramienta ("rbenv: ", "asdf: ", "mise: "), como los demás gestores.

### 6. Riesgo

- **`destructive`:** `gem uninstall`, `flutter clean`, `swift package clean`, `rbenv uninstall` y `mise uninstall`. El test actual de "desinstalar es destructive" ya cubre rbenv y mise.
- **`caution`:**
  - actualizan dependencias: `composer update`, `bundle update`, `dart pub upgrade`, `swift package update` y `flutter upgrade`;
  - reescriben código: `dart fix --apply`;
  - cambian la configuración global: `rbenv global` y `asdf set -u`;
  - instalan en el sistema: `gem install`.
- **`safe`:** el resto.

### 7. Parámetros, placeholders y traducciones

- **Parámetros:** se reutilizan los habituales: `file`, `package`, `name`, `version`, `tool`, `folder`, `port`, `script` y `task`. Se añade `command` para `bundle exec`.
- **Placeholders:** el código no se traduce y lleva el mismo valor en los 11 idiomas. Ejemplos: `index.php`, `laravel/laravel`, `rails`, `rspec`, `3.3.6`, `ruby`, `node@22`.
- **Estilo:** igual que en las categorías actuales: título corto en imperativo, descripción de una línea y `tags` con sinónimos en cada idioma.

### 8. Mensajes webview↔extensión y dependencias

- **Mensajes:** sin cambios. Las categorías nuevas viajan en el mensaje `catalog` igual que las actuales.
- **Dependencias:** ninguna nueva.

## Risks / Trade-offs

- **Dart puro muestra también Flutter.** Lo explica la decisión 1, y se acepta.
- **El ejemplo de activación de mise en cmd muestra el de bash**, porque cmd no tiene variante. Para mitigarlo, la descripción explica cómo usar los *shims*. Como nada se ejecuta solo, el usuario ve el comando antes de pulsar Enter.
- **Versiones antiguas de asdf** (anteriores a la 0.16) no tienen `asdf set`. Para mitigarlo, la descripción indica que hace falta asdf 0.16 o superior.
- **`version-managers` crece hasta unos 45 comandos.** La búsqueda y los prefijos "rbenv: ", "asdf: " y "mise: " los mantienen localizables. Si molesta, puede dividirse más adelante sin cambiar código.
- **Volumen de traducción:** unos 100 comandos en 11 idiomas. El test impide huecos, pero no valida la calidad. La prueba en F5 y la revisión del PR miran al menos `es` y `en`.
