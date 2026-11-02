# webview-messaging Specification

## Purpose

Define cómo se comunican la interfaz web y la extensión: un protocolo de mensajes tipado, la validación de todo lo que llega desde el webview y el handshake con el que la interfaz recibe su contexto inicial.

## Requirements

### Requirement: Protocolo de mensajes tipado
Todos los mensajes entre el webview y la extensión SHALL ser objetos con un campo `type` que identifica el mensaje, definidos en un único protocolo compartido por ambos lados. El protocolo SHALL definir al menos `ready` (webview → extensión), e `init` y `catalog` (extensión → webview).

#### Scenario: Mensaje conocido
- **WHEN** el webview envía `{ "type": "ready" }`
- **THEN** la extensión lo reconoce como un mensaje del protocolo

### Requirement: Validación de todo mensaje entrante
La extensión SHALL validar el tipo y la forma de cada mensaje recibido del webview antes de actuar. Un mensaje que no sea un objeto, que tenga un `type` desconocido o que no tenga la forma declarada MUST descartarse sin ejecutar ninguna acción y sin provocar errores no controlados, y MUST registrarse como advertencia en el registro de la extensión. El webview MUST NOT poder hacer que la extensión ejecute texto arbitrario.

#### Scenario: Tipo desconocido
- **WHEN** el webview envía `{ "type": "runShell", "cmd": "rm -rf /" }`
- **THEN** la extensión descarta el mensaje, registra una advertencia y no ejecuta nada

#### Scenario: Mensaje mal formado
- **WHEN** el webview envía `null`, un string o un objeto sin `type`
- **THEN** la extensión descarta el mensaje sin lanzar una excepción

#### Scenario: Propiedades extra en un mensaje conocido
- **WHEN** el webview envía `{ "type": "ready", "extra": 1 }`
- **THEN** la extensión descarta el mensaje porque no tiene la forma declarada

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
Después de cada `init`, la extensión SHALL enviar `catalog` con la lista de categorías del catálogo, ordenadas como el catálogo. Cada categoría SHALL incluir `id`, `title` (ya resuelto al idioma activo, con fallback a inglés), `icon` y `commands`. Cada comando SHALL incluir `id`, `title` y `description` (en el idioma activo), `example` (la plantilla del shell por defecto del sistema con cada `${param}` sustituido por su placeholder en el idioma activo) y `risk`. El mensaje MUST NOT incluir textos en otros idiomas, plantillas sin resolver ni datos que el webview no necesite para mostrar la vista.

#### Scenario: Catálogo tras el handshake
- **WHEN** el webview envía `ready` y el idioma activo es `es`
- **THEN** la extensión responde con `init` y después con `catalog`, y la categoría `git` incluye el comando `{ "id": "git.status", "title": "Ver estado", "description": "Muestra los archivos modificados, preparados y sin seguimiento", "example": "git status", "risk": "safe" }`

#### Scenario: Idioma sin traducción en el catálogo
- **WHEN** el idioma activo es `ja` y el título de una categoría solo tiene `en` y `es`
- **THEN** su `title` en `catalog` es el valor `en`

#### Scenario: Sin plantillas en el mensaje
- **WHEN** la extensión envía `catalog`
- **THEN** ningún comando incluye los campos `command`, `shells`, `params` ni `tags`
