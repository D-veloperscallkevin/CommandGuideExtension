# Spec Delta

## Purpose

Define cómo se comunican la interfaz web y la extensión: un protocolo de mensajes tipado, la validación de todo lo que llega desde el webview y el handshake con el que la interfaz recibe su contexto inicial.

## ADDED Requirements

### Requirement: Protocolo de mensajes tipado
Todos los mensajes entre el webview y la extensión SHALL ser objetos con un campo `type` que identifica el mensaje, definidos en un único protocolo compartido por ambos lados. El protocolo SHALL definir al menos `ready` (webview → extensión) e `init` (extensión → webview).

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
Al cargar, el webview SHALL enviar `ready`. Cada vez que la extensión reciba un `ready` válido SHALL responder con `init`, que contiene el idioma de la interfaz (`en` o `es`, resuelto a partir del idioma de VS Code con fallback a inglés) y la versión de la extensión.

#### Scenario: VS Code en español
- **WHEN** VS Code está en `es-419` y el webview envía `ready`
- **THEN** la extensión responde `{ "type": "init", "locale": "es", "version": "<versión del package.json>" }`

#### Scenario: Recarga de la vista
- **WHEN** la vista se oculta y se vuelve a mostrar, y el webview envía `ready` otra vez
- **THEN** la extensión responde de nuevo con `init`

#### Scenario: Interfaz antes del init
- **WHEN** el webview aún no ha recibido `init`
- **THEN** muestra el indicador de carga y no muestra datos inventados
