# shell-detection Specification

## Purpose

Decide para qué shell se construyen los ejemplos y el texto que se envía o se copia: detecta el shell de la terminal en la que se va a escribir y lo traduce a una variante del catálogo, y mantiene esa elección al día cuando el usuario cambia de terminal o de shell.

## Requirements

### Requirement: Shell de la terminal de destino
La terminal de destino SHALL ser la misma que usa el envío a la terminal:
- la terminal activa si está libre;
- si no, la terminal libre usada más recientemente;
- si no hay ninguna libre, la que se crearía con el perfil por defecto del usuario.

El shell de destino SHALL determinarse con el primer dato disponible de esta lista:
1. con terminal de destino existente, el tipo de shell que VS Code ha detectado en ella;
2. con terminal de destino existente, el ejecutable con el que se creó;
3. el shell del perfil por defecto del usuario;
4. el sistema operativo en el que se ejecuta la extensión: `powershell` en Windows y `bash` en Linux y macOS.

#### Scenario: Windows con PowerShell activa
- **WHEN** la extensión se ejecuta en Windows y la terminal activa es PowerShell (`pwsh` o `powershell.exe`) y está libre
- **THEN** el shell de destino es `powershell`

#### Scenario: Windows con Git Bash activa
- **WHEN** la extensión se ejecuta en Windows, el perfil por defecto es PowerShell y la terminal activa es Git Bash y está libre
- **THEN** el shell de destino es `bash`

#### Scenario: Linux con bash
- **WHEN** la extensión se ejecuta en Linux o en Remote-WSL y la terminal activa es bash y está libre
- **THEN** el shell de destino es `bash`

#### Scenario: Sin terminales abiertas
- **WHEN** no hay ninguna terminal abierta y el perfil por defecto del usuario es `cmd.exe`
- **THEN** el shell de destino es `cmd`

#### Scenario: Terminal recién creada sin tipo detectado
- **WHEN** la terminal activa aún no tiene tipo de shell detectado, está libre y se creó con `C:\Program Files\Git\bin\bash.exe`
- **THEN** el shell de destino es `bash`

#### Scenario: Activa ocupada y otra libre con otro shell
- **WHEN** en Windows la terminal activa es PowerShell y está ejecutando `claude`, y la terminal libre usada más recientemente es Git Bash
- **THEN** el shell de destino es `bash`

#### Scenario: Todas ocupadas
- **WHEN** en Linux la única terminal es bash y está ejecutando `pnpm dev`, y el perfil por defecto es zsh
- **THEN** el shell de destino es `zsh`, el de la terminal "DevCommands" que se crearía

### Requirement: Traducción a una variante del catálogo
El nombre o la ruta del shell detectado SHALL traducirse a una variante del catálogo sin distinguir mayúsculas y sin tener en cuenta la carpeta ni la extensión `.exe`:
- `pwsh` y `powershell` → `powershell`;
- `bash`, `sh`, `gitbash`, `wsl`, `ksh` y `dash` → `bash`;
- `zsh` → `zsh`;
- `cmd` → `cmd`.

Cualquier otro shell (por ejemplo `fish`, `nu` o `python`) MUST NOT producir un error, y SHALL tratarse como dato no disponible, de modo que se usa el siguiente de la lista.

#### Scenario: Ruta de Windows
- **WHEN** el shell detectado es `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`
- **THEN** la variante es `powershell`

#### Scenario: Terminal de WSL desde Windows
- **WHEN** la extensión se ejecuta en Windows y la terminal activa es un perfil de WSL (`wsl.exe`)
- **THEN** la variante es `bash`

#### Scenario: Shell no soportado
- **WHEN** la terminal activa es `fish` y el perfil por defecto es bash en Linux
- **THEN** el shell de destino es `bash`, sin errores

### Requirement: Shell de destino al día
Cuando el shell de destino cambie, la extensión SHALL volver a construir los ejemplos para el nuevo shell y enviarlos a la vista. El shell de destino puede cambiar porque:
- cambia la terminal activa;
- se cierra una terminal;
- una terminal pasa de libre a ocupada o de ocupada a libre;
- cambia el shell detectado en la terminal de destino;
- cambia el perfil por defecto.

Si el shell de destino no cambia, la extensión MUST NOT reenviarlos. El texto que se envía o se copia SHALL calcularse con el shell de destino del momento en que el usuario actúa.

#### Scenario: Cambio de PowerShell a Git Bash en Windows
- **WHEN** la vista muestra ejemplos para `powershell` y el usuario activa una terminal de Git Bash libre
- **THEN** la vista pasa a mostrar los ejemplos para `bash`, por ejemplo `rm -rf node_modules` en lugar de `Remove-Item -Recurse -Force node_modules`

#### Scenario: Cerrar la última terminal
- **WHEN** la terminal activa era Git Bash, el perfil por defecto es PowerShell y el usuario cierra todas las terminales
- **THEN** la vista pasa a mostrar los ejemplos para `powershell`

#### Scenario: Cambio sin efecto
- **WHEN** el usuario pasa de una terminal bash a otra terminal bash
- **THEN** la extensión no reenvía el catálogo

#### Scenario: Un programa ocupa la terminal activa
- **WHEN** en Windows la vista muestra ejemplos para `powershell` de la terminal activa, la terminal libre usada más recientemente es Git Bash y el usuario ejecuta `claude` en la terminal activa
- **THEN** la vista pasa a mostrar los ejemplos para `bash`

#### Scenario: El programa termina
- **WHEN** en ese mismo caso el usuario sale de `claude` y vuelve el prompt de PowerShell
- **THEN** la vista vuelve a mostrar los ejemplos para `powershell`
