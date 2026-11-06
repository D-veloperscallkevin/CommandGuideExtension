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
El texto enviado SHALL construirse en la extensión a partir del comando del catálogo cuyo `id` se recibe, con la variante del shell de destino en el momento del envío. Para un comando sin parámetros, el texto SHALL ser idéntico al ejemplo visible. Para un comando con parámetros, el texto SHALL ser esa variante con cada `${x}` sustituido por el valor que el usuario introduce, escapado para el shell de destino; si el usuario cancela, la extensión MUST NOT escribir nada y SHALL registrar la cancelación como información, no como error. Si el comando es `destructive` y la confirmación está activada, la extensión SHALL escribir el texto solo después de que el usuario confirme el aviso; si lo rechaza, MUST NOT escribir nada y SHALL registrarlo como información, no como error. Si el `id` no existe en el catálogo, la extensión MUST NOT escribir nada en la terminal y SHALL registrar una advertencia.

#### Scenario: Mismo texto que el ejemplo
- **WHEN** la vista muestra el ejemplo de un comando sin parámetros y el usuario lo envía a la terminal
- **THEN** el texto escrito en la terminal es idéntico a ese ejemplo

#### Scenario: Valores introducidos en lugar del placeholder
- **WHEN** el shell de destino es `bash`, la vista muestra `git checkout -b feature/mi-cambio` y el usuario envía el comando con el valor `fix/login`
- **THEN** la terminal recibe `git checkout -b fix/login`

#### Scenario: Git Bash en Windows
- **WHEN** la extensión se ejecuta en Windows, la terminal activa es Git Bash y el usuario envía el comando de Terminal que borra una carpeta con el valor `tmp` y confirma el aviso
- **THEN** la terminal recibe la variante POSIX (`rm -rf tmp`) y no la de PowerShell

#### Scenario: PowerShell en Windows
- **WHEN** la extensión se ejecuta en Windows, la terminal activa es PowerShell y el usuario envía el mismo comando con el mismo valor y confirma el aviso
- **THEN** la terminal recibe `Remove-Item -Recurse -Force tmp`

#### Scenario: Envío cancelado
- **WHEN** el usuario envía `git.new-branch` y pulsa Escape en el cuadro del nombre de la rama
- **THEN** no se escribe nada en ninguna terminal, no se crea ninguna terminal y el registro no contiene errores

#### Scenario: Confirmación rechazada
- **WHEN** el usuario envía `git.reset-hard` y cancela el aviso de comando destructivo
- **THEN** no se escribe nada en ninguna terminal, no se crea ninguna terminal y el registro no contiene errores

#### Scenario: Id inexistente
- **WHEN** llega `{ "type": "sendToTerminal", "commandId": "git.nope" }`
- **THEN** la extensión no escribe nada en ninguna terminal y registra una advertencia

### Requirement: Elección de la terminal y foco
La extensión SHALL escribir en la terminal de destino, que se elige así:
1. la terminal activa, si existe y está libre;
2. si la activa no existe o está ocupada, la terminal libre que tuvo el foco más recientemente;
3. si no hay ninguna terminal libre, una terminal nueva llamada "DevCommands" con el perfil por defecto del usuario.

Una terminal SHALL considerarse ocupada en cualquiera de estos casos:
- tiene un comando del shell empezado y sin terminar, según la integración del shell de VS Code;
- VS Code detecta en ella un programa y no un shell (`node`, `python` o `julia`);
- no se creó con un shell: su ejecutable no es un shell conocido, o la controla otra extensión sin proceso de shell.

Cualquier otra terminal SHALL considerarse libre. Una terminal ocupada SHALL volver a estar libre cuando su comando termina. La extensión MUST NOT escribir en una terminal ocupada.

En todos los casos, la extensión SHALL mostrar la terminal de destino y darle el foco antes de escribir, para que el usuario pueda confirmar con Enter sin más clics. No SHALL mostrar ningún otro aviso cuando la terminal de destino no es la activa.

En una terminal recién creada, la extensión SHALL esperar a que el shell esté listo antes de escribir (la integración del shell de VS Code se activa), con una espera máxima de 3 segundos, para que el comando quede detrás del prompt y no mezclado con él. En una terminal que ya existía, SHALL escribir sin esperar.

#### Scenario: Hay una terminal activa
- **WHEN** el usuario tiene una terminal de PowerShell activa y libre en Windows y envía un comando
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

#### Scenario: Terminal activa ocupada en Windows con PowerShell
- **WHEN** en Windows la terminal activa es PowerShell y está ejecutando `claude`, existe otra terminal de PowerShell libre y el usuario envía `git.status`
- **THEN** `git status` se escribe en la terminal libre, que recibe el foco, y la terminal con `claude` no recibe nada

#### Scenario: Terminal activa ocupada en Linux con bash
- **WHEN** en Linux hay dos terminales bash libres, `A` y luego `B`, el usuario pasa por `B` y por `A`, después ejecuta `pnpm dev` en `A`, que sigue activa, y envía un comando
- **THEN** el comando se escribe en `B`, la terminal libre usada más recientemente

#### Scenario: Todas las terminales ocupadas
- **WHEN** la única terminal abierta está ejecutando `pnpm dev` y el usuario envía un comando
- **THEN** se crea la terminal "DevCommands", recibe el foco y el comando queda escrito en ella cuando el shell está listo

#### Scenario: El programa termina
- **WHEN** la terminal activa estaba ejecutando `pnpm dev`, el usuario lo detiene, vuelve el prompt y envía un comando
- **THEN** el comando se escribe en esa misma terminal

#### Scenario: Programa detectado sin integración del shell
- **WHEN** VS Code detecta `node` como shell de la terminal activa y existe otra terminal libre
- **THEN** el comando se escribe en la terminal libre

#### Scenario: Terminal que no es un shell
- **WHEN** la terminal activa se creó con el ejecutable `node` o es una pseudoterminal de otra extensión, y no hay más terminales
- **THEN** se crea la terminal "DevCommands" y el comando se escribe en ella
