## MODIFIED Requirements

### Requirement: Escribir sin ejecutar
Al recibir una petición válida de enviar un comando, la extensión SHALL escribir en la terminal el texto del comando sin añadir un salto de línea (`sendText(texto, false)`), de modo que el comando quede en la línea de entrada sin ejecutarse. La extensión MUST NOT ejecutar el comando en ningún caso, tampoco a través del valor de un parámetro.

#### Scenario: Comando sin parámetros
- **WHEN** el usuario envía `git.status` a la terminal
- **THEN** la terminal muestra `git status` en la línea de entrada y el comando no se ejecuta

#### Scenario: Comando con parámetro
- **WHEN** el usuario envía `git.new-branch` y escribe `feature/login` en el cuadro del nombre de la rama
- **THEN** la terminal muestra `git checkout -b feature/login` sin ejecutarlo

### Requirement: Texto construido por la extensión
El texto enviado SHALL construirse en la extensión a partir del comando del catálogo cuyo `id` se recibe, con la variante del shell de destino en el momento del envío. Para un comando sin parámetros, el texto SHALL ser idéntico al ejemplo visible. Para un comando con parámetros, el texto SHALL ser esa variante con cada `${x}` sustituido por el valor que el usuario introduce, escapado para el shell de destino; si el usuario cancela, la extensión MUST NOT escribir nada y SHALL registrar la cancelación como información, no como error. Si el `id` no existe en el catálogo, la extensión MUST NOT escribir nada en la terminal y SHALL registrar una advertencia.

#### Scenario: Mismo texto que el ejemplo
- **WHEN** la vista muestra el ejemplo de un comando sin parámetros y el usuario lo envía a la terminal
- **THEN** el texto escrito en la terminal es idéntico a ese ejemplo

#### Scenario: Valores introducidos en lugar del placeholder
- **WHEN** el shell de destino es `bash`, la vista muestra `git checkout -b feature/mi-cambio` y el usuario envía el comando con el valor `fix/login`
- **THEN** la terminal recibe `git checkout -b fix/login`

#### Scenario: Git Bash en Windows
- **WHEN** la extensión se ejecuta en Windows, la terminal activa es Git Bash y el usuario envía el comando de Terminal que borra una carpeta con el valor `tmp`
- **THEN** la terminal recibe la variante POSIX (`rm -rf tmp`) y no la de PowerShell

#### Scenario: PowerShell en Windows
- **WHEN** la extensión se ejecuta en Windows, la terminal activa es PowerShell y el usuario envía el mismo comando con el mismo valor
- **THEN** la terminal recibe `Remove-Item -Recurse -Force tmp`

#### Scenario: Envío cancelado
- **WHEN** el usuario envía `git.new-branch` y pulsa Escape en el cuadro del nombre de la rama
- **THEN** no se escribe nada en ninguna terminal, no se crea ninguna terminal y el registro no contiene errores

#### Scenario: Id inexistente
- **WHEN** llega `{ "type": "sendToTerminal", "commandId": "git.nope" }`
- **THEN** la extensión no escribe nada en ninguna terminal y registra una advertencia
