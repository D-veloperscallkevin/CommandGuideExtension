# terminal-integration Specification

## Purpose

Escribe en la terminal de VS Code los comandos del catálogo que el usuario elige, sin ejecutarlos nunca: el usuario revisa el texto y confirma con Enter.

## Requirements

### Requirement: Escribir sin ejecutar
Al recibir una petición válida de enviar un comando, la extensión SHALL escribir en la terminal el texto del comando sin añadir un salto de línea (`sendText(texto, false)`), de modo que el comando quede en la línea de entrada sin ejecutarse. La extensión MUST NOT ejecutar el comando en ningún caso.

#### Scenario: Comando sin parámetros
- **WHEN** el usuario envía `git.status` a la terminal
- **THEN** la terminal muestra `git status` en la línea de entrada y el comando no se ejecuta

#### Scenario: Comando con parámetro
- **WHEN** el usuario envía `git.new-branch` con el idioma activo `es`
- **THEN** la terminal muestra `git checkout -b feature/mi-cambio` sin ejecutarlo, para que el usuario cambie el nombre antes de pulsar Enter

### Requirement: Texto construido por la extensión
El texto enviado SHALL construirse en la extensión a partir del comando del catálogo cuyo `id` se recibe, con la misma regla que el ejemplo visible: la variante del shell de destino en el momento del envío y los placeholders en el idioma activo. Si el `id` no existe en el catálogo, la extensión MUST NOT escribir nada en la terminal y SHALL registrar una advertencia.

#### Scenario: Mismo texto que el ejemplo
- **WHEN** la vista muestra el ejemplo de un comando y el usuario lo envía a la terminal
- **THEN** el texto escrito en la terminal es idéntico a ese ejemplo

#### Scenario: Git Bash en Windows
- **WHEN** la extensión se ejecuta en Windows, la terminal activa es Git Bash y el usuario envía el comando de Terminal que borra una carpeta
- **THEN** la terminal recibe la variante POSIX (`rm -rf …`) y no la de PowerShell

#### Scenario: PowerShell en Windows
- **WHEN** la extensión se ejecuta en Windows, la terminal activa es PowerShell y el usuario envía el mismo comando
- **THEN** la terminal recibe `Remove-Item -Recurse -Force …`

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
