## ADDED Requirements

### Requirement: Nombre y metadatos en las tiendas
La extensión SHALL mostrarse en el Marketplace de VS Code y en Open VSX con el nombre visible "DevCommands Guide", la descripción localizada del manifiesto, las categorías `Other` y `Education`, palabras clave sobre los comandos que cubre (git, npm, pnpm, node, docker, terminal) y enlaces al repositorio, a su página de incidencias y a su página principal. El precio SHALL declararse gratuito. Cambiar el nombre visible MUST NOT cambiar el id `aguilardigital.devcommands`, el nombre "DevCommands" de la vista lateral ni la categoría "DevCommands" de la paleta de comandos.

#### Scenario: Ficha en el Marketplace
- **WHEN** se busca "DevCommands Guide" en el Marketplace tras publicar
- **THEN** aparece la extensión `aguilardigital.devcommands` con ese nombre, su icono, sus categorías y la etiqueta de gratuita

#### Scenario: Actualización desde una versión anterior
- **WHEN** un usuario con la v0.1.0 instalada, favoritos e historial actualiza a la v1.0.0
- **THEN** conserva sus favoritos, su historial y sus ajustes `devcommands.*`, y la vista sigue llamándose "DevCommands"

### Requirement: Icono de la extensión
El paquete SHALL incluir un icono PNG cuadrado de 128×128 píxeles con fondo transparente que represente un libro abierto con el símbolo `>_` en el espacio de las páginas, y el manifiesto MUST declararlo como icono de la extensión. El icono de la barra de actividad SHALL representar el mismo libro abierto con `>_`, en un solo color que VS Code adapta al tema (sin colores propios).

#### Scenario: Icono en la vista de extensiones
- **WHEN** se instala el `.vsix` y se abre la vista de extensiones de VS Code
- **THEN** la extensión muestra el icono del libro con `>_`

#### Scenario: Icono de la barra de actividad en temas claro y oscuro
- **WHEN** se cambia entre un tema claro y uno oscuro con la extensión instalada
- **THEN** el icono de la barra de actividad muestra el libro con `>_` en un solo color y toma el color del tema en ambos

### Requirement: Licencia propietaria y avisos de terceros
La extensión SHALL publicarse con una licencia propietaria de su autor: todos los derechos reservados, con permiso gratuito para instalarla y usarla y sin permiso para copiar, modificar ni redistribuir su código. El manifiesto MUST remitir al archivo `LICENSE` del paquete. El paquete MUST incluir los avisos de copyright y las licencias de los componentes de terceros que lleva dentro (React, react-dom, scheduler y los iconos codicons), y el README SHALL describir la licencia y enlazar esos avisos.

#### Scenario: Licencia en la ficha
- **WHEN** se abre el enlace de licencia de la ficha en el Marketplace
- **THEN** se muestra el texto propietario del autor, no MIT

#### Scenario: Avisos de terceros en el paquete
- **WHEN** se listan los archivos del `.vsix`
- **THEN** incluye `LICENSE` y `ThirdPartyNotices.txt`, y este contiene los avisos de React, react-dom, scheduler y codicons

### Requirement: README de la tienda
El README SHALL presentar la extensión como versión estable, sin avisos de trabajo en curso, y abrir con un resumen de lo que ofrece seguido de capturas del panel, la búsqueda, un comando con parámetros, la confirmación de un destructivo y el buscador de la paleta. Las capturas MUST ser PNG, MUST guardarse en el repositorio fuera del `.vsix` y SHALL enlazarse con rutas relativas que el empaquetado convierte en direcciones del repositorio público. El README MUST NOT contener imágenes SVG.

#### Scenario: Capturas en la ficha
- **WHEN** se abre la ficha de la extensión publicada en el Marketplace o en Open VSX
- **THEN** el README muestra todas las capturas sin imágenes rotas

#### Scenario: Capturas fuera del paquete
- **WHEN** se ejecuta `pnpm run release:package`
- **THEN** el `.vsix` no contiene ningún archivo de `docs/`

### Requirement: Publicación manual
La publicación SHALL hacerla el autor a mano, en local, sin GitHub Actions ni otros servicios de pago, y solo desde `main` después de crear el tag `vX.Y.Z` de la versión del manifiesto. SHALL publicarse en el Marketplace y en Open VSX el mismo `.vsix` que se probó antes del PR a `main`. Los pasos, incluido el registro previo del publisher y del namespace `aguilardigital`, MUST estar documentados en el repositorio, y los tokens de publicación MUST NOT guardarse en él.

#### Scenario: Publicación desde PowerShell en Windows
- **WHEN** el autor, en `main` con el tag `v1.0.0`, sigue los pasos documentados desde PowerShell
- **THEN** publica `devcommands-1.0.0.vsix` en el Marketplace y en Open VSX con sus propios tokens

#### Scenario: Publicación desde bash
- **WHEN** el autor sigue los mismos pasos desde bash en WSL o Linux
- **THEN** los comandos son los mismos y publican el mismo `.vsix`

#### Scenario: Tokens fuera del repositorio
- **WHEN** se revisa el repositorio tras publicar
- **THEN** no contiene ningún token ni archivo de credenciales de vsce u ovsx
