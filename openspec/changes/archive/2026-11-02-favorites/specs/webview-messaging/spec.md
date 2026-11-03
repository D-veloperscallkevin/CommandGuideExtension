## MODIFIED Requirements

### Requirement: Protocolo de mensajes tipado
Todos los mensajes entre el webview y la extensión SHALL ser objetos con un campo `type` que identifica el mensaje, definidos en un único protocolo compartido por ambos lados. El protocolo SHALL definir al menos `ready`, `sendToTerminal`, `copyToClipboard` y `toggleFavorite` (webview → extensión), e `init`, `catalog`, `copied` y `favorites` (extensión → webview). `sendToTerminal`, `copyToClipboard` y `toggleFavorite` SHALL llevar solo `commandId`, el id de un comando del catálogo. `copied` SHALL llevar solo el `commandId` copiado. `favorites` SHALL llevar solo `commandIds`, la lista de ids de los comandos favoritos en el orden en que se marcaron.

#### Scenario: Mensaje conocido
- **WHEN** el webview envía `{ "type": "ready" }`
- **THEN** la extensión lo reconoce como un mensaje del protocolo

#### Scenario: Envío a la terminal
- **WHEN** el webview envía `{ "type": "sendToTerminal", "commandId": "git.status" }`
- **THEN** la extensión lo reconoce como un mensaje del protocolo

#### Scenario: Copia al portapapeles
- **WHEN** el webview envía `{ "type": "copyToClipboard", "commandId": "git.status" }`
- **THEN** la extensión lo reconoce como un mensaje del protocolo

#### Scenario: Alternar un favorito
- **WHEN** el webview envía `{ "type": "toggleFavorite", "commandId": "git.status" }`
- **THEN** la extensión lo reconoce como un mensaje del protocolo

#### Scenario: Favorito con campos de más
- **WHEN** el webview envía `{ "type": "toggleFavorite", "commandId": "git.status", "favorite": true }`
- **THEN** la extensión descarta el mensaje
