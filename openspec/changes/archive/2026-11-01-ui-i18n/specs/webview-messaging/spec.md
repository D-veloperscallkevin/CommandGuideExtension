# Spec Delta

## MODIFIED Requirements

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
