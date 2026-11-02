# Spec Delta

## MODIFIED Requirements

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
