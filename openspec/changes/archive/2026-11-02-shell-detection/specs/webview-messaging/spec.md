## MODIFIED Requirements

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
