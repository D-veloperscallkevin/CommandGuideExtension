# command-list Specification

## Purpose

Muestra los comandos de una categoría con lo necesario para decidir antes de usarlos (qué hacen, cómo se escriben y si son peligrosos), y conserva la posición del usuario en la vista aunque esta se oculte o se recargue.

## Requirements

### Requirement: Lista de comandos de una categoría
La pantalla de una categoría SHALL mostrar todos sus comandos en el orden del catálogo. Cada comando SHALL mostrar su título, su descripción y su ejemplo en el idioma activo (con fallback a inglés). El ejemplo SHALL mostrarse en la fuente monoespaciada del editor y completo, sin recortarse.

#### Scenario: Comandos de Git en español
- **WHEN** el usuario abre la categoría Git con el idioma activo `es`
- **THEN** la pantalla muestra "Ver estado", su descripción y el ejemplo `git status`, seguidos de los demás comandos de Git

#### Scenario: Ejemplo con parámetro
- **WHEN** la pantalla muestra el comando `git.new-branch` con el idioma activo `es`
- **THEN** su ejemplo es `git checkout -b feature/mi-cambio`

### Requirement: Ejemplo según el sistema operativo
Hasta que exista la detección del shell, el ejemplo SHALL usar la variante de PowerShell en Windows y la variante POSIX (bash) en Linux y macOS. Si el comando no define una variante para ese shell, SHALL usar `command`.

#### Scenario: Windows con PowerShell
- **WHEN** la extensión se ejecuta en Windows y un comando define `shells.powershell`
- **THEN** su ejemplo se construye a partir de `shells.powershell`

#### Scenario: Linux con bash
- **WHEN** la extensión se ejecuta en Linux
- **THEN** el ejemplo de cada comando se construye a partir de `command`

### Requirement: Aviso de riesgo
Los comandos con `risk` `caution` o `destructive` SHALL mostrar una etiqueta con icono y texto en el idioma activo ("Precaución" o "Destructivo" en español), con los colores de aviso y de error del tema respectivamente. Los comandos `safe` MUST NOT mostrar etiqueta. El riesgo MUST NOT comunicarse solo con color.

#### Scenario: Comando destructivo
- **WHEN** la pantalla de Git muestra `git.reset-hard` con el idioma activo `en`
- **THEN** el comando muestra la etiqueta "Destructive" con un icono de aviso

#### Scenario: Comando seguro
- **WHEN** la pantalla muestra `git.status`
- **THEN** el comando no muestra ninguna etiqueta de riesgo

### Requirement: Teclado y lector de pantalla en la lista de comandos
La lista de comandos SHALL ser una lista con nombre accesible que ocupa una sola parada de Tab. Flecha abajo, Flecha arriba, Inicio y Fin SHALL mover el foco entre los comandos, sin dar la vuelta en los extremos. Cada comando SHALL ser un botón: activarlo con clic, Enter o Espacio SHALL enviarlo a la terminal. El nombre accesible de cada comando SHALL incluir su título, su riesgo si no es `safe`, su descripción y su ejemplo, y su descripción accesible SHALL indicar en el idioma activo que el comando se escribe en la terminal sin ejecutarse.

#### Scenario: Recorrer los comandos
- **WHEN** el foco está en el primer comando de Git y el usuario pulsa Fin
- **THEN** el foco pasa a `git.reset-hard`, el último comando

#### Scenario: Anuncio de un comando con riesgo
- **WHEN** un lector de pantalla llega a `git.reset-hard` con el idioma activo `en`
- **THEN** anuncia un botón con su título, "Destructive", su descripción y `git reset --hard`, y que el comando se escribe en la terminal sin ejecutarse

#### Scenario: Enviar con el teclado
- **WHEN** el foco está en `git.status` y el usuario pulsa Enter
- **THEN** `git status` queda escrito en la terminal, que recibe el foco

#### Scenario: Enviar con el ratón
- **WHEN** el usuario hace clic en un comando
- **THEN** su ejemplo queda escrito en la terminal sin ejecutarse

### Requirement: Navegación persistida
La vista SHALL guardar con el estado del webview la pantalla visible, la categoría abierta y el comando con foco. Al volver a crearse el webview (al ocultar y mostrar la vista o al recargar la ventana), SHALL restaurar esa pantalla y ese foco. Si la categoría o el comando guardados no existen en el catálogo recibido, SHALL mostrar la lista de categorías o enfocar el primer comando, respectivamente. Un estado guardado con forma desconocida MUST ignorarse.

#### Scenario: Ocultar y volver a mostrar
- **WHEN** el usuario tiene abierta la categoría Git con el foco en `git.new-branch`, cambia al Explorador y vuelve a DevCommands
- **THEN** la vista muestra la pantalla de Git con el foco en `git.new-branch`

#### Scenario: Categoría eliminada del catálogo
- **WHEN** el estado guardado apunta a una categoría que ya no está en el catálogo
- **THEN** la vista muestra la lista de categorías

#### Scenario: Estado guardado inválido
- **WHEN** el estado guardado es `{ "screen": 42 }`
- **THEN** la vista lo ignora y muestra la lista de categorías

### Requirement: Copiar un comando
Cada comando SHALL ofrecer una acción secundaria para copiarlo al portapapeles, además de la acción principal de enviarlo a la terminal:
- **Botón de copiar:** tiene icono, nombre accesible y tooltip en el idioma activo, y es visible al pasar el ratón por el comando o cuando el foco está en él. MUST NOT añadir paradas de Tab: la lista sigue ocupando una sola.
- **Atajo:** con el foco en un comando, `Ctrl+C` (`Cmd+C` en macOS) SHALL copiarlo, y el botón del comando SHALL anunciar ese atajo a las tecnologías de asistencia. Si hay texto seleccionado en la vista, el atajo SHALL copiar la selección y no el comando.
- **Confirmación:** cuando la extensión confirma la copia, la vista SHALL mostrar un icono de confirmación en el botón de copiar de ese comando durante unos 2 segundos y SHALL anunciar "Copiado" (en el idioma activo) en una región viva, también si se copia otra vez antes de que pasen. Copiar con el ratón MUST NOT mover el foco. Sin confirmación de la extensión, la vista MUST NOT indicar que se copió.

Copiar MUST NOT enviar nada a la terminal.

#### Scenario: Copiar con el ratón en Windows
- **WHEN** en Windows con PowerShell el usuario pasa el ratón por `git.status` y pulsa su botón de copiar
- **THEN** el portapapeles contiene `git status`, el icono cambia a confirmación durante unos 2 segundos, no se escribe nada en la terminal y la lista sigue teniendo una sola parada de Tab

#### Scenario: Copiar con el teclado en Linux
- **WHEN** en Linux con bash el foco está en `git.new-branch`, el idioma activo es `es` y el usuario pulsa `Ctrl+C`
- **THEN** el portapapeles contiene `git checkout -b feature/mi-cambio` y el foco sigue en ese comando

#### Scenario: Anuncio de la copia
- **WHEN** un lector de pantalla está activo con el idioma `es` y la extensión confirma la copia de un comando
- **THEN** el lector anuncia "Copiado"

#### Scenario: Texto seleccionado
- **WHEN** el usuario ha seleccionado parte de una descripción con el ratón y pulsa `Ctrl+C`
- **THEN** se copia el texto seleccionado y no el comando

#### Scenario: Botón de copiar fuera del orden de Tab
- **WHEN** el foco está en un comando y el usuario pulsa Tab
- **THEN** el foco sale de la lista sin pasar por el botón de copiar
