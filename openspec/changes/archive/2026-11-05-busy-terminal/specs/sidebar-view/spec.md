## MODIFIED Requirements

### Requirement: Activación perezosa
La extensión SHALL activarse cuando VS Code termina de arrancar, sin retrasar el arranque, para poder saber desde el principio qué terminales están ocupadas. También SHALL activarse al abrir su vista o al ejecutar uno de sus comandos, si aún no lo estaba. MUST NOT activarse antes de que VS Code termine de arrancar.

Con la extensión activa y la vista sin abrir, el webview MUST NOT crearse y no se le envía ningún mensaje. La vista SHALL cargar su interfaz cuando el usuario la abre.

#### Scenario: Arranque sin abrir la vista
- **WHEN** VS Code arranca, en Windows con PowerShell o en Linux con bash, y el usuario no abre la vista de DevCommands
- **THEN** la extensión se activa cuando el arranque ha terminado y el webview de la vista no se crea

#### Scenario: Apertura de la vista
- **WHEN** el usuario abre la vista de DevCommands
- **THEN** la extensión está activa y la vista carga su interfaz
