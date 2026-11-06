## MODIFIED Requirements

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
