## MODIFIED Requirements

### Requirement: Envío del catálogo
Después de cada `init`, la extensión SHALL enviar `catalog` con la lista de categorías del catálogo, ordenadas como el catálogo. Cada categoría SHALL incluir `id`, `title` (ya resuelto al idioma activo, con fallback a inglés), `icon` y `commands`. Cada comando SHALL incluir:
- `id`;
- `title` y `description`, en el idioma activo;
- `example`: la plantilla del shell por defecto del sistema, con cada `${param}` sustituido por su placeholder en el idioma activo;
- `risk`;
- `searchText`: un único texto normalizado (en minúsculas y sin diacríticos) que reúne el título, la descripción y los tags del comando en `en`, en `es` y en el idioma activo, el título de su categoría y el ejemplo.

Salvo dentro de `searchText`, el mensaje MUST NOT incluir textos en otros idiomas. Tampoco MUST incluir plantillas sin resolver ni datos que el webview no necesite para mostrar la vista o buscar en ella.

#### Scenario: Catálogo tras el handshake
- **WHEN** el webview envía `ready` y el idioma activo es `es`
- **THEN** la extensión responde con `init` y después con `catalog`, y la categoría `git` incluye el comando `git.status` con `"title": "Ver estado"`, `"description": "Muestra los archivos modificados, preparados y sin seguimiento"`, `"example": "git status"`, `"risk": "safe"` y un `searchText`

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
