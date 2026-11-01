# Spec Delta

## MODIFIED Requirements

### Requirement: Protocolo de mensajes tipado
Todos los mensajes entre el webview y la extensión SHALL ser objetos con un campo `type` que identifica el mensaje, definidos en un único protocolo compartido por ambos lados. El protocolo SHALL definir al menos `ready` (webview → extensión), e `init` y `catalog` (extensión → webview).

#### Scenario: Mensaje conocido
- **WHEN** el webview envía `{ "type": "ready" }`
- **THEN** la extensión lo reconoce como un mensaje del protocolo

## ADDED Requirements

### Requirement: Envío del catálogo
Después de cada `init`, la extensión SHALL enviar `catalog` con la lista de categorías del catálogo, ordenadas como el catálogo. Cada categoría SHALL incluir `id`, `title` (ya resuelto al idioma activo, con fallback a inglés), `icon` y `commandCount`. El mensaje MUST NOT incluir textos en otros idiomas ni datos que el webview no necesite para mostrar la lista.

#### Scenario: Catálogo tras el handshake
- **WHEN** el webview envía `ready` y el idioma activo es `es`
- **THEN** la extensión responde con `init` y después con `catalog`, cuyas categorías incluyen `{ "id": "git", "title": "Git", "icon": "git-branch", "commandCount": 3 }`

#### Scenario: Idioma sin traducción en el catálogo
- **WHEN** el idioma activo es `ja` y el título de una categoría solo tiene `en` y `es`
- **THEN** su `title` en `catalog` es el valor `en`
