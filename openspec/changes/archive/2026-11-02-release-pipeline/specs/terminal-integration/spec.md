## MODIFIED Requirements

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
- **WHEN** la integración del shell está desactivada o VS Code es anterior a 1.93, y se crea una terminal nueva
- **THEN** el comando se escribe al cumplirse los 3 segundos de espera máxima
