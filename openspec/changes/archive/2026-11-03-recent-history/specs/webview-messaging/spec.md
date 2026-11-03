## MODIFIED Requirements

### Requirement: Protocolo de mensajes tipado
Todos los mensajes entre el webview y la extensión SHALL ser objetos con un campo `type` que identifica el mensaje, definidos en un único protocolo compartido por ambos lados.

El protocolo SHALL definir al menos estos mensajes del webview a la extensión, cada uno solo con los campos indicados:
- `ready`, sin campos;
- `sendToTerminal`, `copyToClipboard` y `toggleFavorite`, con `commandId`, el id de un comando del catálogo;
- `sendRecent` y `copyRecent`, con `entryId`, la clave de una entrada del historial;
- `clearHistory`, sin campos.

Y estos de la extensión al webview:
- `init` y `catalog`;
- `copied`, con el `commandId` copiado y, si se copió desde una entrada del historial, su `entryId`;
- `favorites`, con `commandIds`, la lista de ids de los comandos favoritos en el orden en que se marcaron;
- `history`, con `entries`, las entradas del historial de la más reciente a la más antigua. Cada entrada lleva su `id`, el `commandId`, su `text` para el shell de destino actual y `needsInput`, que es `true` si algún valor guardado no vale en ese shell (y entonces `text` lleva los valores sin escapar, solo para mostrarlos).

El webview MUST NOT enviar valores de parámetros ni textos de comandos: para reenviar o copiar una entrada envía solo su clave. `history` SHALL enviarse después de `favorites` tras cada `ready`, después de cada cambio del historial y después de cada `catalog` reenviado por un cambio del shell de destino.

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

#### Scenario: Reenviar una entrada
- **WHEN** el webview envía `{ "type": "sendRecent", "entryId": "3f2a9c1e-0b7d-4e6a-9c51-2d8f7a1b4e60" }`
- **THEN** la extensión lo reconoce como un mensaje del protocolo

#### Scenario: Reenvío con valores
- **WHEN** el webview envía `{ "type": "sendRecent", "entryId": "3f2a9c1e-0b7d-4e6a-9c51-2d8f7a1b4e60", "values": { "branch": "main" } }`
- **THEN** la extensión descarta el mensaje

#### Scenario: Borrar el historial
- **WHEN** el webview envía `{ "type": "clearHistory" }`
- **THEN** la extensión lo reconoce como un mensaje del protocolo

#### Scenario: Historial tras el handshake
- **WHEN** el webview envía `ready` y el historial contiene `git.status`
- **THEN** la extensión envía `init`, `catalog`, `favorites` y después `history` con una entrada de `commandId` `git.status`, `text` `git status` y `needsInput` `false`
