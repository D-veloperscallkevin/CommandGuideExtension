# command-catalog Specification

## Purpose

Define el catálogo de comandos de DevCommands: su formato bilingüe, las reglas de validez y cómo la extensión lo consulta para mostrar categorías, comandos y ejemplos, y para enviarlos a la terminal.

## Requirements

### Requirement: Catálogo por categorías validado contra un schema
El catálogo SHALL estar formado por un archivo JSON por categoría dentro de `catalog/`. Cada archivo MUST validar contra `catalog/schema.json` y MUST declarar `version`, `id`, `title`, `icon`, `order`, `section` y `commands`.

`section` MUST ser uno de estos valores:
- `languages`;
- `vcs`;
- `frameworks`;
- `databases`;
- `infra`;
- `cloud`;
- `servers`;
- `quality`;
- `gamedev`;
- `tools`.

Cada comando MUST declarar `id`, `title`, `description`, `command`, `tags` y `risk`, y MAY declarar `params`, `shells` y `docs`. La validación MUST rechazar cualquier propiedad no definida en el schema, salvo `$schema`.

#### Scenario: Archivo de categoría válido
- **WHEN** un archivo de `catalog/` cumple todos los campos obligatorios del schema
- **THEN** la validación del catálogo pasa sin errores

#### Scenario: Falta un campo obligatorio
- **WHEN** un comando del catálogo no declara `risk`
- **THEN** la validación del catálogo falla e indica el archivo y la ruta del comando afectado

#### Scenario: Propiedad desconocida
- **WHEN** un comando declara una propiedad que no está en el schema, como `exampel`
- **THEN** la validación del catálogo falla

#### Scenario: Sección desconocida o ausente
- **WHEN** una categoría declara `"section": "misc"` o no declara `section`
- **THEN** la validación del catálogo falla

### Requirement: Textos bilingües obligatorios
Todo texto visible para el usuario (`title` de la categoría, `title` y `description` del comando, `label` y `placeholder` de cada parámetro) SHALL ser un objeto con las claves `en` y `es`, ambas obligatorias y no vacías, y MAY incluir además cualquiera de los idiomas `pt-br`, `fr`, `de`, `it`, `ja`, `ko`, `zh-cn`, `zh-tw` y `ru`, también no vacíos. Los `tags` SHALL ser un objeto con una lista de strings por idioma, con `en` y `es` obligatorios y los mismos idiomas opcionales. Cualquier otra clave de idioma MUST hacer fallar la validación.

#### Scenario: Falta una traducción
- **WHEN** un comando declara `title` solo con `es`
- **THEN** la validación del catálogo falla

#### Scenario: Tags en ambos idiomas
- **WHEN** un comando declara `tags` con `en: ["branch"]` y `es: ["rama"]`
- **THEN** la validación pasa y ambas listas quedan disponibles para la búsqueda

#### Scenario: Idioma opcional
- **WHEN** un comando declara `title` con `en`, `es` y `fr`
- **THEN** la validación pasa

#### Scenario: Clave de idioma desconocida
- **WHEN** un comando declara `title` con `en`, `es` y `fr-fr`
- **THEN** la validación del catálogo falla

### Requirement: Resolución del idioma con fallback a inglés
La extensión SHALL mostrar cada texto del catálogo en el idioma activo de la interfaz (ver `ui-localization`). Cuando un texto no tenga valor para ese idioma, SHALL mostrar su valor `en`. El fallback MUST aplicarse campo a campo, incluidos los `placeholder` usados en el ejemplo y las listas de `tags`.

#### Scenario: VS Code en español de Latinoamérica
- **WHEN** el idioma de VS Code es `es-419`
- **THEN** los textos del catálogo se resuelven a su valor `es`

#### Scenario: Idioma soportado con traducción
- **WHEN** el idioma activo es `fr` y el `title` de un comando tiene valor `fr`
- **THEN** el título se muestra en francés

#### Scenario: Idioma soportado sin traducción en el catálogo
- **WHEN** el idioma activo es `de` y el `title` de un comando solo tiene `en` y `es`
- **THEN** el título se muestra con su valor `en`

#### Scenario: VS Code en un idioma no soportado
- **WHEN** el idioma de VS Code es `nl`
- **THEN** los textos del catálogo se resuelven a su valor `en`

### Requirement: Identificadores únicos y con prefijo de categoría
Cada categoría SHALL tener un `id` en kebab-case. Cada comando SHALL tener un `id` con la forma `<id-de-categoría>.<nombre-kebab>`, único en todo el catálogo. El `id` del comando MUST ser la única referencia con la que otros componentes piden un comando. El prefijo `custom-` queda reservado para los comandos propios del usuario: ningún `id` de categoría del catálogo incluido MUST empezar por `custom-`.

#### Scenario: Id duplicado entre archivos
- **WHEN** dos archivos del catálogo contienen un comando con el mismo `id`
- **THEN** la validación del catálogo falla nombrando el id duplicado

#### Scenario: Prefijo incorrecto
- **WHEN** `catalog/git.json` contiene un comando con id `npm.install`
- **THEN** la validación del catálogo falla

#### Scenario: Prefijo reservado
- **WHEN** el catálogo incluido contiene una categoría con id `custom-tools`
- **THEN** la validación del catálogo falla indicando que el prefijo está reservado

#### Scenario: Búsqueda por id
- **WHEN** se pide el comando `git.new-branch`
- **THEN** se obtiene ese comando con todos sus campos

#### Scenario: Id inexistente
- **WHEN** se pide un id que no existe en el catálogo
- **THEN** no se obtiene ningún comando y no se produce ningún error no controlado

### Requirement: Plantillas y parámetros coherentes
Cada placeholder `${nombre}` que aparezca en `command` o en cualquier variante de `shells` SHALL corresponder a un parámetro declarado en `params`, y cada parámetro declarado SHALL aparecer en `command`. Los nombres de parámetro MUST ser únicos dentro de un comando.

#### Scenario: Placeholder sin declarar en bash
- **WHEN** `command` es `git checkout -b ${branch}` y `params` está vacío
- **THEN** la validación del catálogo falla nombrando `branch`

#### Scenario: Placeholder sin declarar en la variante PowerShell
- **WHEN** `shells.powershell` usa `${path}` y `params` no declara `path`
- **THEN** la validación del catálogo falla nombrando `path` y la variante `powershell`

#### Scenario: Parámetro declarado sin uso
- **WHEN** `params` declara `remote` pero `command` no contiene `${remote}`
- **THEN** la validación del catálogo falla

### Requirement: Variantes por shell
`command` SHALL ser la variante POSIX (bash y zsh). `shells` SHALL aceptar únicamente las claves `bash`, `zsh`, `powershell` y `cmd`. Para un shell dado, el comando efectivo SHALL ser su variante en `shells` si existe y `command` en caso contrario.

#### Scenario: Comando efectivo en PowerShell con variante
- **WHEN** un comando define `shells.powershell` y el shell es `powershell`
- **THEN** el comando efectivo es el de `shells.powershell`

#### Scenario: Comando efectivo en bash sin variante
- **WHEN** un comando no define `shells.bash` y el shell es `bash`
- **THEN** el comando efectivo es `command`

#### Scenario: Shell no soportado en el catálogo
- **WHEN** un comando declara `shells.fish`
- **THEN** la validación del catálogo falla

### Requirement: Ejemplo derivado de la plantilla
El ejemplo de un comando SHALL calcularse sustituyendo cada `${nombre}` del comando efectivo por el `placeholder` del parámetro en el idioma activo, o por su valor `en` si no hay traducción para ese idioma. Un comando sin parámetros SHALL usar como ejemplo su propio comando efectivo. El catálogo MUST NOT contener un campo de ejemplo escrito a mano.

#### Scenario: Ejemplo en español para bash
- **WHEN** el comando es `git checkout -b ${branch}`, el placeholder `es` es `feature/mi-cambio`, el idioma es español y el shell es `bash`
- **THEN** el ejemplo es `git checkout -b feature/mi-cambio`

#### Scenario: Ejemplo en inglés para PowerShell
- **WHEN** el mismo comando no tiene variante `powershell`, el placeholder `en` es `feature/my-change`, el idioma es inglés y el shell es `powershell`
- **THEN** el ejemplo es `git checkout -b feature/my-change`

#### Scenario: Ejemplo en un idioma sin traducción del placeholder
- **WHEN** el mismo comando no tiene placeholder `ja` y el idioma es japonés
- **THEN** el ejemplo usa el placeholder `en`: `git checkout -b feature/my-change`

#### Scenario: Comando sin parámetros
- **WHEN** el comando es `git status` y no tiene `params`
- **THEN** el ejemplo es `git status`

### Requirement: Nivel de riesgo obligatorio
Cada comando SHALL declarar `risk` con uno de los valores `safe`, `caution` o `destructive`.

#### Scenario: Comando destructivo
- **WHEN** un comando como `git reset --hard` declara `risk: "destructive"`
- **THEN** la validación pasa y el nivel de riesgo queda disponible para quien consuma el catálogo

#### Scenario: Valor de riesgo inválido
- **WHEN** un comando declara `risk: "danger"`
- **THEN** la validación del catálogo falla

### Requirement: Orden de categorías y comandos
Las categorías SHALL ordenarse por `order` ascendente y, si empatan, por `id`. Los comandos SHALL conservar el orden en el que aparecen en su archivo.

#### Scenario: Dos categorías con distinto orden
- **WHEN** `git` tiene `order: 10` y `npm` tiene `order: 20`
- **THEN** `git` aparece antes que `npm`

#### Scenario: Empate de orden
- **WHEN** `docker` y `bash` tienen el mismo `order`
- **THEN** `bash` aparece antes que `docker`

### Requirement: Contenido mínimo del catálogo empaquetado
El catálogo empaquetado SHALL contener al menos 5 categorías, y cada una SHALL contener al menos 15 comandos. Incluirá como mínimo las categorías `git`, `npm`, `pnpm`, `yarn`, `bun`, `node`, `deno`, `typescript`, `version-managers`, `docker`, `python`, `poetry`, `uv`, `conda`, `terminal`, `java`, `maven`, `gradle`, `dotnet`, `c-cpp`, `cmake`, `go`, `rust`, `php`, `ruby`, `dart`, `flutter` y `swift`.

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
- **THEN** están `git`, `npm`, `pnpm`, `yarn`, `bun`, `node`, `deno`, `typescript`, `version-managers`, `docker`, `python`, `poetry`, `uv`, `conda`, `terminal`, `java`, `maven`, `gradle`, `dotnet`, `c-cpp`, `cmake`, `go`, `rust`, `php`, `ruby`, `dart`, `flutter` y `swift`, en ese orden

#### Scenario: Categoría con pocos comandos
- **WHEN** una categoría del catálogo empaquetado tiene menos de 15 comandos
- **THEN** los tests del catálogo fallan nombrando la categoría y su número de comandos

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

#### Scenario: Borrar la caché de módulos de Go
- **WHEN** se muestra el comando de `go` que borra la caché de módulos (`go clean -modcache`)
- **THEN** declara `risk: destructive`

### Requirement: Catálogo empaquetado traducido a los 11 idiomas
Todo texto del catálogo empaquetado (`title` de la categoría, `title` y `description` de cada comando, `label` y `placeholder` de cada parámetro) SHALL tener valor no vacío en los 11 idiomas de la interfaz: `en`, `es`, `pt-br`, `fr`, `de`, `it`, `ja`, `ko`, `zh-cn`, `zh-tw` y `ru`. Los `tags` SHALL tener una lista no vacía en esos 11 idiomas. Esta obligación MUST comprobarse en los tests del catálogo empaquetado y MUST NOT añadirse al schema, que sigue aceptando los 9 idiomas adicionales como opcionales.

#### Scenario: Comando empaquetado sin un idioma
- **WHEN** un comando del catálogo empaquetado declara `description` sin valor `ko`
- **THEN** los tests del catálogo fallan nombrando el id del comando, el campo y el idioma

#### Scenario: Placeholder que no es texto
- **WHEN** un parámetro tiene un placeholder que no se traduce, como el nombre de una imagen `node:22-alpine`
- **THEN** declara ese mismo valor en los 11 idiomas y los tests pasan

#### Scenario: Schema sin cambios
- **WHEN** un archivo de categoría que no forma parte del catálogo empaquetado declara textos solo con `en` y `es`
- **THEN** la validación contra el schema pasa

### Requirement: Catálogo empaquetado cargado bajo demanda
Los archivos del catálogo SHALL viajar dentro del paquete de la extensión (`.vsix`), en `dist/catalog/`, uno por categoría. La extensión MUST NOT leerlos durante la activación. SHALL leerlos la primera vez que necesita el catálogo (al abrir la vista o el buscador de la paleta, al enviar o copiar un comando, o al consultar favoritos y recientes) y SHALL conservarlos en memoria a partir de ese momento.

Consultar el catálogo MUST NOT hacer llamadas de red. Todo archivo de `catalog/`, salvo `schema.json`, SHALL formar parte del catálogo cargado. El `.vsix` MUST NOT superar los 2 MB.

#### Scenario: Activación sin abrir la vista
- **WHEN** VS Code arranca en Windows con PowerShell o en Linux con bash y el usuario no abre la vista ni ejecuta ningún comando de DevCommands
- **THEN** la extensión está activa y no ha leído ningún archivo del catálogo

#### Scenario: Primera apertura de la vista
- **WHEN** el usuario abre la vista por primera vez
- **THEN** la extensión lee los archivos de `dist/catalog/` una sola vez y la vista recibe todas las categorías

#### Scenario: Categoría añadida pero no empaquetada
- **WHEN** existe `catalog/npm.json` pero no forma parte del catálogo cargado o del `.vsix`
- **THEN** los tests del catálogo o la comprobación del empaquetado fallan nombrando `npm.json`

#### Scenario: Paquete demasiado grande
- **WHEN** el `.vsix` generado supera los 2 MB
- **THEN** `pnpm run release:package` falla indicando el tamaño

### Requirement: Patrones de detección en el catálogo
Cada categoría del catálogo MAY declarar `detect`, una lista de patrones de detección del proyecto. Si la declara, la lista MUST tener al menos un patrón y MUST NOT repetir ninguno. Cada patrón MUST tener una de estas tres formas:
- un nombre;
- un nombre con comodines `*`;
- `carpeta/nombre`, sin comodines.

La validación del catálogo MUST rechazar patrones con `**`, `?`, `[`, `{`, `\`, `..`, una `/` inicial o final, más de una `/`, o un comodín dentro de una ruta. Un patrón MUST NOT repetirse dentro de la misma categoría; sí MAY aparecer en varias, y entonces detecta todas ellas. La categoría `terminal` MUST NOT declarar `detect`.

#### Scenario: Patrones válidos
- **WHEN** una categoría declara `"detect": ["go.mod", "*.csproj", "prisma/schema.prisma"]`
- **THEN** la validación del catálogo pasa sin errores

#### Scenario: Patrón no admitido
- **WHEN** una categoría declara `"detect": ["**/*.tf"]`, `"detect": ["../go.mod"]` o `"detect": ["src/*.cs"]`
- **THEN** la validación del catálogo falla e indica el archivo y el patrón

#### Scenario: Lista vacía o repetida
- **WHEN** una categoría declara `"detect": []` o `"detect": ["go.mod", "go.mod"]`
- **THEN** la validación del catálogo falla

#### Scenario: Terminal sin detección
- **WHEN** `catalog/terminal.json` declara `detect`
- **THEN** los tests del catálogo fallan
