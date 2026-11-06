## MODIFIED Requirements

### Requirement: Contenido mínimo del catálogo empaquetado
El catálogo empaquetado SHALL contener al menos 5 categorías, y cada una SHALL contener al menos 15 comandos. Incluirá como mínimo las categorías `git`, `npm`, `pnpm`, `yarn`, `bun`, `node`, `deno`, `typescript`, `version-managers`, `docker`, `python`, `poetry`, `uv`, `conda`, `terminal`, `java`, `maven`, `gradle` y `dotnet`.

Los comandos de `terminal` SHALL declarar:
- `shells.powershell` siempre que su sintaxis en PowerShell difiera de la variante POSIX;
- `shells.cmd` siempre que su sintaxis en cmd difiera de la variante POSIX.

Los comandos de `version-managers` SHALL declarar `shells.powershell` y `shells.cmd` cuando la herramienta o su sintaxis cambie en Windows:
- activar `fnm` en la sesión;
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

Todo comando del catálogo empaquetado SHALL corresponder a la sintaxis documentada por su herramienta, y SHALL declarar `risk: destructive` si borra versiones instaladas, entornos, cachés o archivos del proyecto sin posibilidad de deshacerlo.

#### Scenario: Categorías del catálogo empaquetado
- **WHEN** se cargan las categorías del catálogo empaquetado
- **THEN** están `git`, `npm`, `pnpm`, `yarn`, `bun`, `node`, `deno`, `typescript`, `version-managers`, `docker`, `python`, `poetry`, `uv`, `conda`, `terminal`, `java`, `maven`, `gradle` y `dotnet`, en ese orden

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
- **WHEN** un comando de `version-managers` desinstala una versión de Node.js o de Python
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
- **WHEN** un comando de `maven`, `gradle` o `dotnet` borra la salida de compilación (`clean`)
- **THEN** declara `risk: destructive`
