## MODIFIED Requirements

### Requirement: Contenido mínimo del catálogo empaquetado
El catálogo empaquetado SHALL contener al menos 5 categorías. Cada categoría de la sección `frameworks` SHALL contener al menos 8 comandos, y cada categoría de las demás secciones SHALL contener al menos 15. Incluirá como mínimo las categorías `git`, `github-cli`, `gitlab-cli`, `npm`, `pnpm`, `yarn`, `bun`, `node`, `deno`, `typescript`, `version-managers`, `docker`, `python`, `poetry`, `uv`, `conda`, `terminal`, `java`, `maven`, `gradle`, `dotnet`, `c-cpp`, `cmake`, `go`, `rust`, `php`, `ruby`, `dart`, `flutter`, `swift`, `elixir`, `erlang`, `haskell`, `scala`, `clojure`, `ocaml`, `r`, `lua`, `zig`, `julia`, `perl`, `vite`, `nextjs`, `angular`, `vue`, `astro`, `nuxt`, `sveltekit`, `nestjs`, `laravel`, `django`, `rails`, `spring-boot`, `symfony` y `fastapi`.

Los comandos de `terminal` SHALL declarar:
- `shells.powershell` siempre que su sintaxis en PowerShell difiera de la variante POSIX;
- `shells.cmd` siempre que su sintaxis en cmd difiera de la variante POSIX.

Los comandos de `version-managers` SHALL declarar `shells.powershell` y `shells.cmd` cuando la herramienta o su sintaxis cambie en Windows:
- activar `fnm` o `mise` en la sesión;
- nvm, que en Windows es nvm-windows y usa otros subcomandos u opciones.

Los comandos de `python` siguen la convención POSIX en `bash` y `zsh` (Linux, macOS y WSL) y la de Windows en `powershell` y `cmd`:
- el intérprete SHALL ser `python3` en `command` y `python` en `shells.powershell` y `shells.cmd`;
- pip SHALL invocarse como módulo del intérprete (`python3 -m pip` y `python -m pip`), nunca como `pip` a secas;
- activar un entorno virtual SHALL ser `source .venv/bin/activate` en `command`, `.venv\Scripts\Activate.ps1` en `shells.powershell` y `.venv\Scripts\activate.bat` en `shells.cmd`;
- la descripción de los comandos que usan `python3` o `.venv/bin` SHALL avisar, en los 11 idiomas, que en Git Bash sobre Windows se usa `python` y `.venv/Scripts/activate`.

Los comandos de `maven` y `gradle` que usan el wrapper del proyecto SHALL escribirlo según el shell:
- `./mvnw …` y `./gradlew …` en `command` (bash y zsh);
- `.\mvnw …` y `.\gradlew …` en `shells.powershell`;
- `mvnw …` y `gradlew …` en `shells.cmd`.

Los comandos que crean el wrapper usan la herramienta instalada globalmente (`mvn` o `gradle`) y no llevan variantes.

Los comandos de sdkman SHALL ir en `version-managers`, y su descripción SHALL avisar, en los 11 idiomas, de que sdkman no funciona en PowerShell ni en cmd (solo en bash y zsh, incluidos WSL y Git Bash).

Los comandos de rbenv y asdf SHALL ir en `version-managers` con el mismo aviso que sdkman: no funcionan en PowerShell ni en cmd. Los de asdf SHALL usar la sintaxis de asdf 0.16 o superior (`asdf set`, nunca `asdf local` ni `asdf global`).

Los comandos de mise SHALL ir en `version-managers`. El que activa mise en la sesión SHALL declarar la variante de cada shell:
- `eval "$(mise activate bash)"` en `command` (bash);
- `eval "$(mise activate zsh)"` en `shells.zsh`;
- `(&mise activate pwsh) | Out-String | Invoke-Expression` en `shells.powershell`.

Su descripción SHALL avisar, en los 11 idiomas, de que cmd no se puede activar y usa los *shims* de mise.

Los comandos de `swift` que usan `xcodebuild` o `xcrun`, y el de `flutter` que compila para iOS, SHALL avisar en su descripción, en los 11 idiomas, de que solo funcionan en macOS.

El comando de `ocaml` que carga el entorno de opam en la sesión SHALL declarar la variante de cada shell:
- `eval $(opam env)` en `command` (bash y zsh);
- `(& opam env) -split '\r?\n' | ForEach-Object { Invoke-Expression $_ }` en `shells.powershell`;
- `for /f "tokens=*" %i in ('opam env') do @%i` en `shells.cmd`.

Los comandos de `elixir` que abren `iex` SHALL usar `iex.bat` en `shells.powershell`, porque en PowerShell `iex` es el alias de `Invoke-Expression`.

Los comandos de `clojure` que usan `clj` o `clojure` SHALL avisar en su descripción, en los 11 idiomas, de que en Windows funcionan en PowerShell pero no en cmd.

Los comandos de `r` y `julia` que ejecutan código en línea (`Rscript -e` o `julia -e`) SHALL usar una única forma, válida en bash, zsh, PowerShell y cmd, sin variantes por shell:
- el código SHALL ir entre comillas dobles y MUST NOT contener comillas dobles;
- los nombres de paquete SHALL pasarse como argumentos después del código (`commandArgs(TRUE)` en R, `ARGS` en Julia), nunca dentro de él.

Los comandos de `r` que empiezan por `R` (`R`, `R --version`, `R CMD …`) SHALL usar `R.exe` en `shells.powershell`, porque en PowerShell `r` es el alias de `Invoke-History`. `Rscript` no lleva variante.

El comando de `zig` que borra la salida de compilación SHALL declarar la variante de cada shell:
- `rm -rf zig-out .zig-cache` en `command` (bash y zsh);
- `Remove-Item -Recurse -Force zig-out, .zig-cache` en `shells.powershell`;
- `rmdir /s /q zig-out .zig-cache` en `shells.cmd`.

Los comandos de `zig` que usan `zig init`, `zig fetch` u opciones `-D` de `zig build` SHALL avisar en su descripción, en los 11 idiomas, de que siguen Zig 0.17 y pueden cambiar en otras versiones.

Los comandos de `lua` que usan el intérprete `lua` o `luac` SHALL avisar en su descripción, en los 11 idiomas, de que en algunas instalaciones se llama `lua5.4` o `lua54`.

Los comandos de `perl` que usan `make` SHALL avisar en su descripción, en los 11 idiomas, de que en Windows con Strawberry Perl se llama `gmake`.

Las categorías `github-cli` y `gitlab-cli` SHALL ir en la sección `vcs`, después de `git`. Sus comandos SHALL funcionar igual en bash, zsh, PowerShell y cmd, sin variantes por shell, y MUST NOT incluir textos libres entre comillas (`--title`, `--body`, `--notes`): se usan `--fill`, `--generate-notes` o el modo interactivo.

El riesgo de los comandos de `github-cli` y `gitlab-cli` SHALL ser:
- `caution` si publican o cambian algo en GitHub o GitLab: crear un repositorio, una PR, una MR o un issue; fusionar; aprobar; cerrar un issue; lanzar un workflow o un pipeline; publicar una release;
- `destructive` si borran una release;
- `safe` si solo consultan, abren el navegador o cambian la copia local (`checkout`).

Ningún comando SHALL borrar un repositorio (`gh repo delete`, `glab repo delete`).

Las categorías `vite`, `nextjs`, `angular`, `vue`, `astro`, `nuxt` y `sveltekit` SHALL ir en la sección `frameworks`. Sus comandos de JavaScript SHALL usar npm: `npm create …` para crear proyectos y `npx …` para las CLI del proyecto, sin variantes por gestor de paquetes. La descripción de cada comando que empieza por `npx` o `npm create` SHALL indicar, en los 11 idiomas, el equivalente con pnpm, Yarn y Bun (`pnpm dlx`, `yarn dlx` y `bunx`, o `pnpm create`, `yarn create` y `bun create`).

Las categorías `nestjs`, `laravel`, `django`, `rails`, `spring-boot`, `symfony` y `fastapi` SHALL ir en la sección `frameworks`, detrás de las de frontend. Sus comandos SHALL seguir las formas de las categorías de su lenguaje:
- `nestjs` SHALL usar `npx` con el aviso de pnpm, Yarn y Bun;
- `django` SHALL usar `python3 manage.py …` con la variante `python manage.py …` en `powershell` y `cmd`;
- `rails` SHALL usar `bin/rails …` con la variante `ruby bin\rails …` en `powershell` y `cmd`;
- `spring-boot` SHALL ofrecer cada acción con `./mvnw` y con `./gradlew`, con las variantes de los wrappers de `maven` y `gradle`; en `powershell`, un argumento que empieza por `-` y contiene un punto SHALL ir entre comillas dobles, y `curl` SHALL escribirse `curl.exe`;
- `laravel`, `symfony` y `fastapi` SHALL usar la misma forma en todos los shells.

Las categorías `expo`, `react-native`, `ionic`, `electron` y `tauri` SHALL ir en la sección `frameworks`, detrás de las de backend. `expo` SHALL incluir los comandos de EAS, `ionic` SHALL reunir la CLI de Ionic y la de Capacitor, y `electron` SHALL cubrir Electron Forge. Sus comandos SHALL ser iguales en todos los shells:
- las CLI del proyecto (Expo, React Native, Capacitor, Electron Forge y Tauri) SHALL usarse con `npx`, con el aviso de pnpm, Yarn y Bun, y no con `npm run …`;
- las CLI globales `eas` e `ionic` SHALL usarse sin `npx`, y su categoría SHALL incluir el comando que las instala con `npm install -g`.

Los comandos de estas categorías que compilan, abren o arrancan el proyecto de iOS SHALL avisar en su descripción, en los 11 idiomas, de que solo funcionan en macOS. Los que publican fuera del equipo (`eas submit`, `eas update`, `electron-forge publish`) o cambian las dependencias o la configuración del proyecto SHALL declarar `risk: caution`. `npx expo prebuild --clean` SHALL declarar `risk: destructive`, y su descripción SHALL avisar de que borra las carpetas `android` e `ios`.

Los comandos de `frameworks` que aplican migraciones, cargan datos de prueba (`seed`), regeneran claves o añaden paquetes con recetas que modifican la configuración SHALL declarar `risk: caution`. Los que deshacen migraciones o vacían o borran la base de datos SHALL declarar `risk: destructive`, y su descripción SHALL avisar de que se pierden datos.

Los comandos de `frameworks` que actualizan o migran el proyecto, o que añaden integraciones modificando su configuración, SHALL declarar `risk: caution`. Los que borran cachés o salidas generadas SHALL declarar `risk: destructive`.

Los comandos de `c-cpp` que ejecutan el programa compilado SHALL escribirlo según el shell:
- `./app` en `command` (bash y zsh);
- `.\app.exe` en `shells.powershell`;
- `app.exe` en `shells.cmd`.

Los comandos de `c-cpp` SHALL usar GCC o Clang, nunca el compilador de Microsoft (`cl`). Los comandos de `make` SHALL avisar en su descripción, en los 11 idiomas, de que en Windows make se instala con MSYS2 o MinGW (`mingw32-make`).

El comando de `go` que compila para otro sistema SHALL fijar `GOOS` y `GOARCH` con la sintaxis de cada shell:
- `GOOS=… GOARCH=… go build` en `command` (bash y zsh);
- `$env:GOOS="…"; $env:GOARCH="…"; go build` en `shells.powershell`;
- `set GOOS=…&& set GOARCH=…&& go build` en `shells.cmd`.

Su descripción SHALL avisar, en los 11 idiomas, de que en PowerShell y cmd las variables quedan fijadas en esa terminal.

Todo comando del catálogo empaquetado SHALL corresponder a la sintaxis documentada por su herramienta, y SHALL declarar `risk: destructive` si borra versiones instaladas, entornos, cachés o archivos del proyecto sin posibilidad de deshacerlo.

#### Scenario: Categorías del catálogo empaquetado
- **WHEN** se cargan las categorías del catálogo empaquetado
- **THEN** están `git`, `github-cli`, `gitlab-cli`, `npm`, `pnpm`, `yarn`, `bun`, `node`, `deno`, `typescript`, `version-managers`, `docker`, `python`, `poetry`, `uv`, `conda`, `terminal`, `java`, `maven`, `gradle`, `dotnet`, `c-cpp`, `cmake`, `go`, `rust`, `php`, `ruby`, `dart`, `flutter`, `swift`, `elixir`, `erlang`, `haskell`, `scala`, `clojure`, `ocaml`, `r`, `lua`, `zig`, `julia`, `perl`, `vite`, `nextjs`, `angular`, `vue`, `astro`, `nuxt`, `sveltekit`, `nestjs`, `laravel`, `django`, `rails`, `spring-boot`, `symfony`, `fastapi`, `expo`, `react-native`, `ionic`, `electron` y `tauri`, en ese orden

#### Scenario: Categoría con pocos comandos
- **WHEN** una categoría del catálogo empaquetado que no es de la sección `frameworks` tiene menos de 15 comandos
- **THEN** los tests del catálogo fallan nombrando la categoría y su número de comandos

#### Scenario: Framework con pocos comandos
- **WHEN** una categoría de la sección `frameworks` tiene menos de 8 comandos
- **THEN** los tests del catálogo fallan nombrando la categoría y su número de comandos

#### Scenario: Framework con entre 8 y 14 comandos
- **WHEN** una categoría de la sección `frameworks` tiene 8 comandos
- **THEN** los tests del catálogo la aceptan

#### Scenario: Ejemplo de Terminal en Windows
- **WHEN** el shell es `powershell` y se muestra el comando de Terminal que borra una carpeta
- **THEN** el ejemplo usa la sintaxis de PowerShell (`Remove-Item -Recurse -Force …`) y no `rm -rf`

#### Scenario: Ejemplo de Terminal en cmd
- **WHEN** el shell es `cmd` y se muestra el comando de Terminal que borra una carpeta
- **THEN** el ejemplo usa la sintaxis de cmd (`rmdir /s /q …`) y no `rm -rf` ni `Remove-Item`

#### Scenario: Ejemplo de Terminal en bash
- **WHEN** el shell es `bash` y se muestra el comando de Terminal que borra una carpeta
- **THEN** el ejemplo es la variante POSIX (`rm -rf …`)

#### Scenario: Activar fnm en PowerShell y en bash
- **WHEN** se muestra el comando de `version-managers` que activa fnm en la sesión
- **THEN** en `bash` el ejemplo es `eval "$(fnm env --use-on-cd --shell bash)"` y en `zsh` es `eval "$(fnm env --use-on-cd --shell zsh)"`
- **AND** en `powershell` es `fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression`

#### Scenario: Instalar la versión LTS de Node.js con nvm
- **WHEN** se muestra el comando de `version-managers` que instala la LTS de Node.js con nvm
- **THEN** en `bash` el ejemplo es `nvm install --lts`
- **AND** en `powershell` y `cmd` es `nvm install lts` (nvm-windows)

#### Scenario: Desinstalar una versión
- **WHEN** un comando de `version-managers` desinstala una versión de Node.js, de Python, de Java, de Ruby o de una herramienta de mise
- **THEN** declara `risk: destructive`

#### Scenario: Activar el entorno virtual en PowerShell, cmd y bash
- **WHEN** se muestra el comando de `python` que activa el entorno virtual `.venv`
- **THEN** en `powershell` el ejemplo es `.venv\Scripts\Activate.ps1` y en `cmd` es `.venv\Scripts\activate.bat`
- **AND** en `bash` y `zsh` es `source .venv/bin/activate`

#### Scenario: Instalar los requisitos con pip
- **WHEN** se muestra el comando de `python` que instala `requirements.txt`
- **THEN** en `bash` el ejemplo es `python3 -m pip install -r requirements.txt`
- **AND** en `powershell` y `cmd` es `python -m pip install -r requirements.txt`

#### Scenario: pip nunca a secas
- **WHEN** un comando de `python` usa pip
- **THEN** su `command` empieza por `python3 -m pip` y sus variantes de `powershell` y `cmd` por `python -m pip`

#### Scenario: Borrar cachés o entornos de Python
- **WHEN** un comando de `python`, `poetry`, `uv` o `conda` borra una caché, un entorno o una versión de Python instalada
- **THEN** declara `risk: destructive`

#### Scenario: Compilar con el wrapper de Gradle en PowerShell, cmd y bash
- **WHEN** se muestra el comando de `gradle` que compila el proyecto
- **THEN** en `powershell` el ejemplo es `.\gradlew build` y en `cmd` es `gradlew build`
- **AND** en `bash` y `zsh` es `./gradlew build`

#### Scenario: Empaquetar con el wrapper de Maven en PowerShell y bash
- **WHEN** se muestra el comando de `maven` que empaqueta el proyecto
- **THEN** en `powershell` el ejemplo es `.\mvnw package` y en `cmd` es `mvnw package`
- **AND** en `bash` es `./mvnw package`

#### Scenario: Wrapper en todos los comandos de compilación
- **WHEN** un comando de `maven` o `gradle` empieza por `./mvnw` o `./gradlew`
- **THEN** declara `shells.powershell` con `.\mvnw` o `.\gradlew` y `shells.cmd` con `mvnw` o `gradlew`

#### Scenario: Borrar la salida de compilación
- **WHEN** un comando de `maven`, `gradle`, `dotnet`, `c-cpp`, `cmake` o `rust` borra la salida de compilación (`clean`)
- **THEN** declara `risk: destructive`

#### Scenario: Ejecutar el binario compilado en PowerShell, cmd y bash
- **WHEN** se muestra el comando de `c-cpp` que ejecuta el programa compilado
- **THEN** en `powershell` el ejemplo es `.\app.exe` y en `cmd` es `app.exe`
- **AND** en `bash` y `zsh` es `./app`

#### Scenario: Compilación cruzada de Go en PowerShell, cmd y bash
- **WHEN** se muestra el comando de `go` que compila para Linux en amd64
- **THEN** en `bash` y `zsh` el ejemplo es `GOOS=linux GOARCH=amd64 go build`
- **AND** en `powershell` es `$env:GOOS="linux"; $env:GOARCH="amd64"; go build`
- **AND** en `cmd` es `set GOOS=linux&& set GOARCH=amd64&& go build`

#### Scenario: Sin el compilador de Microsoft
- **WHEN** se recorren los comandos de `c-cpp`
- **THEN** ninguno empieza por `cl `

#### Scenario: Activar mise en bash, zsh y PowerShell
- **WHEN** se muestra el comando de `version-managers` que activa mise en la sesión
- **THEN** en `bash` el ejemplo es `eval "$(mise activate bash)"` y en `zsh` es `eval "$(mise activate zsh)"`
- **AND** en `powershell` es `(&mise activate pwsh) | Out-String | Invoke-Expression`

#### Scenario: asdf con la sintaxis actual
- **WHEN** se recorren los comandos de asdf en `version-managers`
- **THEN** ninguno usa `asdf local` ni `asdf global`

#### Scenario: Comandos solo de macOS
- **WHEN** un comando de `swift` usa `xcodebuild` o `xcrun`, o el comando de `flutter` compila para iOS
- **THEN** su descripción en español avisa de que solo funciona en macOS

#### Scenario: Borrar dependencias o salida de PHP, Ruby, Flutter y Swift
- **WHEN** se muestran `gem uninstall`, `flutter clean` o `swift package clean`
- **THEN** declaran `risk: destructive`

#### Scenario: Cargar el entorno de opam en cada shell
- **WHEN** se muestra el comando de `ocaml` que carga el entorno de opam
- **THEN** en `bash` el ejemplo es `eval $(opam env)`
- **AND** en `powershell` es `(& opam env) -split '\r?\n' | ForEach-Object { Invoke-Expression $_ }`
- **AND** en `cmd` es `for /f "tokens=*" %i in ('opam env') do @%i`

#### Scenario: iex en PowerShell
- **WHEN** se muestra el comando de `elixir` que abre `iex` con el proyecto (`iex -S mix`) y la terminal activa es PowerShell
- **THEN** el ejemplo es `iex.bat -S mix`
- **AND** en `bash` y en `cmd` es `iex -S mix`

#### Scenario: Clojure CLI en Windows
- **WHEN** un comando de `clojure` usa `clj` o `clojure`
- **THEN** su descripción en español avisa de que en Windows no funciona en cmd

#### Scenario: Borrar la salida de compilación de los lenguajes funcionales
- **WHEN** se muestran `mix clean`, `rebar3 clean`, `cabal clean`, `stack clean`, `sbt clean`, `lein clean` o `dune clean`
- **THEN** declaran `risk: destructive`

#### Scenario: Borrar la caché de módulos de Go
- **WHEN** se muestra el comando de `go` que borra la caché de módulos (`go clean -modcache`)
- **THEN** declara `risk: destructive`

#### Scenario: Código en línea de R y Julia en todos los shells
- **WHEN** un comando de `r` usa `Rscript -e` o un comando de `julia` usa `julia -e` o `julia --project -e`
- **THEN** el código va entre comillas dobles y no contiene comillas dobles
- **AND** el comando no declara variantes de `powershell` ni de `cmd`

#### Scenario: Añadir un paquete de Julia en PowerShell y bash
- **WHEN** se muestra el comando de `julia` que añade un paquete al proyecto, en `bash` o en `powershell`
- **THEN** el ejemplo es `julia --project -e "using Pkg; Pkg.add(ARGS)" Example` en los dos

#### Scenario: R en PowerShell
- **WHEN** se muestra el comando de `r` que comprueba un paquete (`R CMD check`) y la terminal activa es PowerShell
- **THEN** el ejemplo empieza por `R.exe CMD check`
- **AND** en `bash` y en `cmd` empieza por `R CMD check`

#### Scenario: Borrar la salida de Zig en cada shell
- **WHEN** se muestra el comando de `zig` que borra la salida de compilación
- **THEN** en `bash` el ejemplo es `rm -rf zig-out .zig-cache`
- **AND** en `powershell` es `Remove-Item -Recurse -Force zig-out, .zig-cache`
- **AND** en `cmd` es `rmdir /s /q zig-out .zig-cache`
- **AND** declara `risk: destructive`

#### Scenario: Versión de referencia de Zig
- **WHEN** un comando de `zig` usa `zig init` o `zig fetch`
- **THEN** su descripción en español indica que sigue Zig 0.17

#### Scenario: make en Strawberry Perl
- **WHEN** un comando de `perl` usa `make`
- **THEN** su descripción en español avisa de que en Strawberry Perl se llama `gmake`

#### Scenario: Quitar un rock de Lua
- **WHEN** se muestra `luarocks remove`
- **THEN** declara `risk: destructive`

#### Scenario: GitHub CLI y GitLab CLI después de Git
- **WHEN** se cargan las categorías de la sección `vcs`
- **THEN** están `git`, `github-cli` y `gitlab-cli`, en ese orden

#### Scenario: Crear una PR en PowerShell y en bash
- **WHEN** se muestra el comando de `github-cli` que crea una PR, en `powershell` o en `bash`
- **THEN** el ejemplo es `gh pr create --fill` en los dos

#### Scenario: Fusionar una PR o una MR
- **WHEN** se muestran `gh pr merge --squash --delete-branch` o `glab mr merge`
- **THEN** declaran `risk: caution`

#### Scenario: Borrar una release
- **WHEN** se muestran `gh release delete` o `glab release delete`
- **THEN** declaran `risk: destructive`

#### Scenario: Sin borrado de repositorios
- **WHEN** se recorren los comandos de `github-cli` y `gitlab-cli`
- **THEN** ninguno contiene `repo delete`

#### Scenario: Frameworks de frontend en su sección
- **WHEN** se cargan las categorías de la sección `frameworks`
- **THEN** están `vite`, `nextjs`, `angular`, `vue`, `astro`, `nuxt`, `sveltekit`, `nestjs`, `laravel`, `django`, `rails`, `spring-boot`, `symfony`, `fastapi`, `expo`, `react-native`, `ionic`, `electron` y `tauri`, en ese orden

#### Scenario: Crear un proyecto de Vite en PowerShell y en bash
- **WHEN** se muestra el comando de `vite` que crea un proyecto, en `powershell` o en `bash`
- **THEN** el ejemplo es `npm create vite@latest` en los dos
- **AND** su descripción en español nombra `pnpm create`, `yarn create` y `bun create`

#### Scenario: CLI local con npx
- **WHEN** un comando de `frameworks` empieza por `npx`
- **THEN** su descripción en español nombra `pnpm dlx`, `yarn dlx` y `bunx`

#### Scenario: Next.js sin next lint
- **WHEN** se recorren los comandos de `nextjs`
- **THEN** ninguno usa `next lint`, que Next.js 16 eliminó

#### Scenario: Actualizar o limpiar un framework
- **WHEN** se muestran `ng update @angular/core @angular/cli` o `npx nuxt upgrade`
- **THEN** declaran `risk: caution`
- **AND** `npx nuxt cleanup` declara `risk: destructive`

#### Scenario: Frameworks de backend detrás de los de frontend
- **WHEN** se cargan las categorías de la sección `frameworks`
- **THEN** después de `sveltekit` están `nestjs`, `laravel`, `django`, `rails`, `spring-boot`, `symfony`, `fastapi`, `expo`, `react-native`, `ionic`, `electron` y `tauri`, en ese orden

#### Scenario: Rails en PowerShell y en bash
- **WHEN** se muestra el comando de `rails` que arranca el servidor
- **THEN** el ejemplo en `bash` es `bin/rails server`
- **AND** el ejemplo en `powershell` es `ruby bin\rails server`

#### Scenario: Django en cmd
- **WHEN** se muestra el comando de `django` que arranca el servidor en `cmd`
- **THEN** el ejemplo es `python manage.py runserver`

#### Scenario: Perfil de Spring Boot en PowerShell
- **WHEN** se muestra el comando de `spring-boot` que arranca con Maven y un perfil, en `powershell`
- **THEN** el argumento `-Dspring-boot.run.profiles=…` va entre comillas dobles detrás de `.\mvnw spring-boot:run`

#### Scenario: Borrar la base de datos
- **WHEN** se muestran `php artisan migrate:fresh --seed`, `bin/rails db:reset`, `python3 manage.py flush` o `php bin/console doctrine:database:drop --force`
- **THEN** declaran `risk: destructive`
- **AND** `php artisan migrate` y `python3 manage.py migrate` declaran `risk: caution`

#### Scenario: Frameworks de móvil y escritorio detrás de los de backend
- **WHEN** se cargan las categorías de la sección `frameworks`
- **THEN** después de `fastapi` están `expo`, `react-native`, `ionic`, `electron` y `tauri`, en ese orden

#### Scenario: CLI de Expo y CLI global de EAS
- **WHEN** se muestran en `powershell` o en `bash` el comando de `expo` que arranca el servidor y el que compila con EAS
- **THEN** el primero es `npx expo start` en los dos shells
- **AND** el segundo empieza por `eas build`, sin `npx`

#### Scenario: Comandos de iOS
- **WHEN** se muestran `npx expo run:ios`, `npx react-native run-ios`, `npx cap open ios` o `npx tauri ios dev`
- **THEN** su descripción en español avisa de que solo funciona en macOS

#### Scenario: Publicar y regenerar los proyectos nativos
- **WHEN** se muestran `eas submit`, `eas update` o `npx electron-forge publish`
- **THEN** declaran `risk: caution`
- **AND** `npx expo prebuild --clean` declara `risk: destructive`
