## ADDED Requirements

### Requirement: Comando de búsqueda en la paleta
La extensión SHALL contribuir el comando `devcommands.searchCommands`, con el título "Buscar comandos" en el idioma activo y la categoría "DevCommands", visible en la paleta de comandos y sin atajo de teclado por defecto. Al ejecutarlo, SHALL abrir un buscador de VS Code (QuickPick) con todos los comandos del catálogo y los propios, sin abrir ni mostrar la vista lateral. SHALL funcionar aunque la vista no se haya abierto nunca en la sesión.

#### Scenario: Abrir desde la paleta
- **WHEN** el usuario ejecuta "DevCommands: Buscar comandos" desde la paleta de comandos con la vista cerrada
- **THEN** se abre el buscador con los comandos y la vista lateral sigue cerrada

#### Scenario: Sin abrir antes la vista
- **WHEN** VS Code acaba de arrancar, la extensión no está activa y el usuario ejecuta el comando
- **THEN** la extensión se activa y se abre el buscador

### Requirement: Elementos del buscador
Cada comando SHALL mostrarse con su título, su categoría y su descripción en el idioma activo, y su ejemplo construido para el shell de destino, con los placeholders en el idioma activo. Una entrada de "Recientes" SHALL mostrar el texto con sus valores guardados. Si alguno de esos valores no vale en el shell de destino, la entrada SHALL indicar que se pedirá de nuevo, como en el panel. Cada elemento SHALL tener un botón para copiar y otro para alternar el favorito, con un tooltip en el idioma activo. La estrella SHALL verse rellena si el comando es favorito.

#### Scenario: Elemento de Git
- **WHEN** el idioma activo es `es`, el shell de destino es `bash` y el buscador muestra `git.status`
- **THEN** el elemento muestra "Ver estado", la categoría "Git", su descripción y el ejemplo `git status`, con los botones de copiar y de favorito

#### Scenario: Comando favorito
- **WHEN** `git.status` es favorito
- **THEN** su botón de favorito muestra la estrella rellena y el tooltip "Quitar de favoritos"

### Requirement: Grupos con el cuadro vacío
Con el cuadro de texto vacío, el buscador SHALL mostrar los elementos en grupos con un separador con nombre, en este orden:
1. "Favoritos": los favoritos que existen en el catálogo, en el orden de la lista de favoritos;
2. "Recientes": las entradas del historial que existen en el catálogo, de la más reciente a la más antigua;
3. una sección por cada categoría detectada en el proyecto, en el orden del catálogo, con el título de la categoría como separador;
4. una sección por cada categoría restante, en el orden del catálogo.

Un grupo sin elementos MUST NOT mostrarse. Un comando SHALL poder aparecer en "Favoritos" o "Recientes" y también en su categoría.

#### Scenario: Con favoritos, historial y proyecto
- **WHEN** hay un favorito, dos entradas en el historial y el proyecto tiene `pnpm-lock.yaml`, y el cuadro está vacío
- **THEN** el buscador muestra "Favoritos" con 1 elemento, "Recientes" con 2, la sección pnpm y después Git, npm, Node, Docker y Terminal

#### Scenario: Sin favoritos ni historial
- **WHEN** no hay favoritos ni historial ni categorías detectadas
- **THEN** el buscador muestra solo las secciones de las categorías en el orden del catálogo

### Requirement: Búsqueda
Al escribir en el cuadro, el buscador SHALL filtrar los comandos con la misma búsqueda que el panel: todas las palabras deben aparecer en el título, la descripción o los tags, en `en`, en `es` o en el idioma activo, sin distinguir mayúsculas ni diacríticos. Los resultados SHALL mostrarse sin separadores, sin repetir un comando y en el mismo orden que en el panel: primero los que tienen todas las palabras en el título y después el resto, en el orden del catálogo. Los favoritos y los recientes no se buscan aparte. Si no hay resultados, el buscador SHALL indicarlo en el idioma activo.

#### Scenario: Buscar en otro idioma
- **WHEN** el idioma activo es `es` y el usuario escribe "status"
- **THEN** aparece "Ver estado" (`git.status`), igual que en la búsqueda del panel

#### Scenario: Sin resultados
- **WHEN** el usuario escribe "zzzz"
- **THEN** el buscador no muestra comandos y muestra el mensaje de que no hay resultados

#### Scenario: Vaciar el cuadro
- **WHEN** el usuario borra lo que había escrito
- **THEN** vuelven los grupos con separador

### Requirement: Acciones del buscador
Las acciones del buscador SHALL usar el mismo flujo que el panel:
- **Enter:** SHALL cerrar el buscador y escribir el comando en la terminal sin ejecutarlo. Antes, SHALL pedir los valores de sus parámetros y confirmar si es destructivo, y después SHALL registrarlo en el historial. Una entrada de "Recientes" SHALL usar sus valores guardados, con las mismas reglas que "Recientes" en el panel.
- **Copiar:** SHALL copiar el texto del comando (una entrada de "Recientes", con sus valores), con las mismas peticiones de valores y la misma confirmación. MUST NOT registrarlo en el historial. Si la copia termina bien, SHALL mostrar en la barra de estado una confirmación breve en el idioma activo. El buscador SHALL quedar abierto si no hizo falta pedir nada.
- **Favorito:** SHALL alternar el favorito del comando, actualizar la estrella del elemento sin cerrar el buscador y enviar la lista nueva al panel si está abierto.

Cancelar un valor o rechazar el aviso de un destructivo MUST NOT escribir ni copiar nada.

#### Scenario: Enviar desde el buscador
- **WHEN** el usuario elige `git.status` con Enter
- **THEN** el buscador se cierra, `git status` queda escrito en la terminal sin ejecutarse y aparece al principio de "Recientes"

#### Scenario: Comando con parámetro
- **WHEN** el usuario elige `git.new-branch` y escribe `feature/login` en el cuadro del valor
- **THEN** la terminal recibe el comando con `feature/login` escapado para el shell de destino

#### Scenario: Reciente con sus valores
- **WHEN** el usuario elige una entrada de "Recientes" de `git.new-branch` con el valor `feature/login`
- **THEN** la terminal recibe el comando con ese valor sin volver a pedirlo

#### Scenario: Copiar sin cerrar
- **WHEN** el usuario pulsa el botón de copiar de `git.status`
- **THEN** el portapapeles contiene `git status`, la barra de estado confirma la copia y el buscador sigue abierto

#### Scenario: Marcar favorito
- **WHEN** el panel está abierto y el usuario pulsa el botón de favorito de `git.status`, que no era favorito
- **THEN** la estrella del elemento se rellena, el buscador sigue abierto y el panel muestra la tarjeta "Favoritos" con ese comando
