# terminal-integration Specification

## Purpose

Escribe en la terminal de VS Code los comandos del catálogo que el usuario elige, sin ejecutarlos nunca: el usuario revisa el texto y confirma con Enter.

## Requirements

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

### Requirement: Elección de la terminal y foco
La extensión SHALL usar la terminal activa si existe. Si no hay ninguna, SHALL crear una terminal llamada "DevCommands" con el perfil por defecto del usuario. En ambos casos SHALL mostrar la terminal y darle el foco antes de escribir, para que el usuario pueda confirmar con Enter sin más clics. En una terminal recién creada, la extensión SHALL esperar a que el shell esté listo (la integración del shell de VS Code se activa) antes de escribir, con una espera máxima de 3 segundos, para que el comando quede detrás del prompt y no mezclado con él. En una terminal que ya existía, SHALL escribir sin esperar.

#### Scenario: Hay una terminal activa
- **WHEN** el usuario tiene una terminal de PowerShell activa en Windows y envía un comando
- **THEN** el comando se escribe en esa terminal, que recibe el foco, y no se crea ninguna otra

#### Scenario: No hay terminales
- **WHEN** no hay ninguna terminal abierta y el usuario envía un comando en Linux con bash
- **THEN** se crea la terminal "DevCommands", recibe el foco y el comando queda escrito en ella

#### Scenario: Terminal nueva en WSL
- **WHEN** no hay ninguna terminal abierta, el usuario está en Remote-WSL y envía `docker.images`
- **THEN** el comando se escribe cuando bash ya ha mostrado su prompt, y la línea queda como `usuario@host:~/proyecto$ docker images`, sin el texto repetido delante del prompt

#### Scenario: El shell no avisa de que está listo
- **WHEN** la integración del shell está desactivada y se crea una terminal nueva
- **THEN** el comando se escribe al cumplirse los 3 segundos de espera máxima
