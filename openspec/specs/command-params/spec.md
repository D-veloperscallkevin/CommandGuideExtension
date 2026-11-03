# command-params Specification

## Purpose

Pide los valores de los parámetros `${x}` de un comando antes de enviarlo a la terminal o copiarlo, los valida y los escribe escapados para el shell de destino, de modo que ningún valor pueda romper el comando ni hacer que se ejecute algo que el usuario no escribió.

## Requirements

### Requirement: Pedir los valores de los parámetros
Al enviar o copiar un comando que declara `params`, la extensión SHALL pedir un valor por cada parámetro, en el orden en que están declarados, con un cuadro de texto nativo de VS Code. Cada cuadro SHALL mostrar el título del comando en el idioma activo (con el paso, por ejemplo `(1/2)`, si hay más de un parámetro), la etiqueta del parámetro como indicación y su placeholder como texto de ayuda, sin rellenar el valor. El cuadro SHALL seguir abierto aunque pierda el foco. Si el usuario cancela cualquiera de los cuadros (Escape), la extensión MUST NOT escribir en ninguna terminal ni modificar el portapapeles, y no pide los parámetros restantes. Un comando sin `params` SHALL enviarse o copiarse sin pedir nada. Los valores SHALL pedirse y usarse solo en la extensión: el webview MUST NOT enviar valores de parámetros, solo el `id` del comando.

#### Scenario: Un parámetro en Windows con PowerShell
- **WHEN** el shell de destino es `powershell`, el idioma activo es `es` y el usuario envía `git.new-branch`
- **THEN** se abre un cuadro con el título "Crear rama y cambiarse", la indicación "Nombre de la rama" y el texto de ayuda `feature/mi-cambio`, y no se escribe nada en la terminal hasta que el usuario confirma un valor

#### Scenario: Dos parámetros en Linux con bash
- **WHEN** el shell de destino es `bash` y el usuario envía `terminal.copy`
- **THEN** se abre un cuadro para el origen con `(1/2)` en el título y, tras confirmarlo, otro para el destino con `(2/2)`, y solo después se escribe el comando

#### Scenario: Cancelar el segundo cuadro
- **WHEN** el usuario confirma el origen de `terminal.copy` y pulsa Escape en el cuadro del destino
- **THEN** no se escribe nada en la terminal y no se abre ningún otro cuadro

#### Scenario: Comando sin parámetros
- **WHEN** el usuario envía o copia `git.status`
- **THEN** no se abre ningún cuadro y el comando se escribe o se copia directamente

#### Scenario: El shell de destino se fija al pulsar
- **WHEN** el shell de destino es `powershell` al pulsar el comando y el usuario cambia a una terminal de Git Bash mientras escribe el valor
- **THEN** el comando se construye y se escapa para `powershell`, el shell que había al pulsar

### Requirement: Validación de los valores
El cuadro de texto SHALL rechazar, con un mensaje en el idioma activo y sin cerrarse, un valor que esté vacío o solo tenga espacios, que contenga saltos de línea o caracteres de control (U+0000–U+001F, U+007F–U+009F, U+2028, U+2029), o que pase de 500 caracteres. Si el shell de destino es `cmd`, SHALL rechazar además los valores que contengan `"` o `%`. Si es `powershell`, SHALL rechazar los que contengan `"`: Windows PowerShell 5.1 la borra al pasar el argumento a un programa nativo (git, node, docker…), y el comando haría algo distinto de lo que se ve. El valor aceptado SHALL usarse sin los espacios del principio y del final.

#### Scenario: Valor vacío
- **WHEN** el usuario pulsa Enter con el cuadro vacío o con solo espacios
- **THEN** el cuadro sigue abierto con un mensaje que pide un valor y no se escribe nada

#### Scenario: Salto de línea pegado
- **WHEN** el usuario pega `main` seguido de un salto de línea y `rm -rf ~`
- **THEN** el cuadro rechaza el valor y la terminal no recibe nada

#### Scenario: Comillas dobles en cmd
- **WHEN** el shell de destino es `cmd` y el usuario escribe `mi "archivo".txt`
- **THEN** el cuadro rechaza el valor explicando que en cmd no puede contener `"` ni `%`

#### Scenario: Comillas dobles en PowerShell
- **WHEN** el shell de destino es `powershell` y el usuario escribe `mi "archivo".txt`
- **THEN** el cuadro rechaza el valor explicando que en PowerShell no puede contener `"`

#### Scenario: Comillas dobles en bash
- **WHEN** el shell de destino es `bash` y el usuario escribe `mi "archivo".txt`
- **THEN** el valor se acepta

#### Scenario: Espacios alrededor
- **WHEN** el usuario escribe `  feature/login  `
- **THEN** el comando usa `feature/login`

### Requirement: Escapado según el shell y las comillas de la plantilla
Cada valor SHALL insertarse en el comando efectivo del shell de destino de forma que el shell lo reciba como un único argumento literal, sin expandir variables, comodines, sustituciones de comandos ni historial. El escapado SHALL depender del shell y del contexto del `${x}` en la plantilla: suelto, dentro de comillas dobles o dentro de comillas simples. Un valor suelto formado solo por caracteres seguros para ese shell (letras ASCII, dígitos y `_ . / -`, más `: @ + =` y los que ese shell no interpreta) SHALL escribirse sin comillas. El resto SHALL escribirse así:

| Shell | Suelto | Entre comillas dobles | Entre comillas simples |
| --- | --- | --- | --- |
| bash, zsh | entre comillas simples; `'` pasa a `'\''` | `\`, `"`, `$` y `` ` `` llevan `\` delante; `!` pasa a `"'!'"` | `'` pasa a `'\''` |
| powershell | entre comillas simples; cada comilla simple (también `‘ ’ ‚ ‛`) se duplica | `` ` ``, `$` y cada comilla doble (también `“ ” „`) llevan `` ` `` delante | cada comilla simple se duplica |
| cmd | entre comillas dobles | sin cambios | dentro de comillas dobles (PowerShell incrustado): cada comilla simple se duplica |

Además, las `\` del final del valor SHALL duplicarse cuando el valor queda entre comillas dobles en `cmd` (suelto entrecomillado o dentro de comillas dobles) y cuando tiene espacios en `powershell`, porque los programas nativos de Windows leen `\"` como una comilla escapada.

#### Scenario: Carpeta con barra final en cmd
- **WHEN** el shell es `cmd` y el usuario envía `terminal.remove-directory` con `C:\mi dir\`
- **THEN** la terminal recibe `rmdir /s /q "C:\mi dir\\"`

#### Scenario: Valor seguro en bash
- **WHEN** el shell es `bash` y el usuario envía `git.new-branch` con `feature/login`
- **THEN** la terminal recibe `git checkout -b feature/login`

#### Scenario: Valor con espacios en bash
- **WHEN** el shell es `bash` y el usuario envía `terminal.remove-directory` con `mis cosas`
- **THEN** la terminal recibe `rm -rf 'mis cosas'`

#### Scenario: Comilla simple en bash
- **WHEN** el shell es `bash` y el valor de `terminal.show-file` es `it's.txt`
- **THEN** la terminal recibe `cat 'it'\''s.txt'`

#### Scenario: Valor con espacios en PowerShell
- **WHEN** el shell es `powershell` y el usuario envía `terminal.remove-directory` con `mis cosas`
- **THEN** la terminal recibe `Remove-Item -Recurse -Force 'mis cosas'`

#### Scenario: Comilla simple en PowerShell
- **WHEN** el shell es `powershell` y el valor de `terminal.show-file` es `it's.txt`
- **THEN** la terminal recibe `Get-Content 'it''s.txt'`

#### Scenario: Ruta de Windows en PowerShell
- **WHEN** el shell es `powershell` y el valor de `terminal.show-file` es `C:\temp\log.txt`
- **THEN** la terminal recibe `Get-Content C:\temp\log.txt`

#### Scenario: Mensaje de commit entre comillas dobles en bash
- **WHEN** el shell es `bash` y el mensaje de `git.commit` es `fix: usa $HOME y "comillas"!`
- **THEN** la terminal recibe `git commit -m "fix: usa \$HOME y \"comillas\""'!'""`, que git recibe como el mensaje literal

#### Scenario: Mensaje de commit entre comillas dobles en PowerShell
- **WHEN** el shell es `powershell` y el mensaje de `git.commit` es `usa $env:PATH`
- **THEN** la terminal recibe ``git commit -m "usa `$env:PATH"``

#### Scenario: Valor con espacios en cmd
- **WHEN** el shell es `cmd` y el usuario envía `terminal.remove-directory` con `mis cosas`
- **THEN** la terminal recibe `rmdir /s /q "mis cosas"`

#### Scenario: Seguir un archivo en cmd
- **WHEN** el shell es `cmd` y el valor de `terminal.follow-file` es `it's log.txt`
- **THEN** la terminal recibe `powershell -NoProfile -Command "Get-Content -LiteralPath 'it''s log.txt' -Tail 50 -Wait"`

#### Scenario: Patrón con comodín
- **WHEN** el shell es `bash` y el patrón de `terminal.find-files` es `*.ts`
- **THEN** la terminal recibe `find . -name "*.ts"` y el comodín no lo expande el shell
