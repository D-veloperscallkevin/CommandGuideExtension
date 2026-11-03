# favorites Specification

## Purpose

Permite marcar comandos del catálogo como favoritos, los guarda de forma persistente y sincronizada entre equipos, y los reúne en una tarjeta y una pantalla propias para enviarlos o copiarlos sin buscarlos.

## Requirements

### Requirement: Marcar y desmarcar un favorito
Cada comando de una lista (pantalla de una categoría, resultados de búsqueda y pantalla de favoritos) SHALL ofrecer un botón de estrella para marcarlo o desmarcarlo como favorito:
- **Botón:** es un botón alternable con estado accesible (pulsado si el comando es favorito), con icono, nombre accesible y tooltip en el idioma activo. Está junto al botón de copiar y, como él, MUST NOT añadir paradas de Tab y MUST NOT mover el foco al pulsarlo con el ratón. Si el comando es favorito, la estrella SHALL verse rellena en todo momento; si no, SHALL verse al pasar el ratón por el comando o cuando el foco está en él.
- **Atajo:** con el foco en un comando, `Ctrl+D` (`Cmd+D` en macOS) SHALL alternar su estado de favorito, y el botón del comando SHALL anunciar ese atajo a las tecnologías de asistencia junto al de copiar.
- **Anuncio:** cuando la extensión confirma el cambio, la vista SHALL anunciar en una región viva "Añadido a favoritos" o "Quitado de favoritos" (en el idioma activo).

Marcar o desmarcar MUST NOT enviar nada a la terminal ni modificar el portapapeles.

#### Scenario: Marcar con el ratón
- **WHEN** el usuario pasa el ratón por `git.status` en la pantalla de Git y pulsa su estrella
- **THEN** la estrella se ve rellena, el lector de pantalla anuncia "Añadido a favoritos" (con el idioma `es`), el foco no se mueve y la lista sigue teniendo una sola parada de Tab

#### Scenario: Desmarcar con el teclado
- **WHEN** `git.status` es favorito, el foco está en él y el usuario pulsa `Ctrl+D`
- **THEN** deja de ser favorito, la estrella queda vacía y se anuncia "Quitado de favoritos"

#### Scenario: Estrella en los resultados de búsqueda
- **WHEN** el usuario busca "status" y `git.status` es favorito
- **THEN** el resultado muestra la estrella rellena y su botón está pulsado

#### Scenario: Estado accesible
- **WHEN** un lector de pantalla llega a la estrella de un comando favorito
- **THEN** anuncia un botón de alternar pulsado con el nombre "Favorito" (en el idioma activo)

### Requirement: Guardado de los favoritos
La extensión SHALL guardar los favoritos como una lista de ids de comandos en el orden en que se marcaron, en el almacenamiento global de la extensión (no por proyecto), y SHALL registrarla para que Settings Sync la sincronice entre equipos. Al recibir `toggleFavorite` con el id de un comando del catálogo, SHALL añadirlo al final si no estaba o quitarlo si estaba, guardar la lista y enviar `favorites` con la lista resultante. Si el id no existe en el catálogo, MUST NOT modificar la lista y SHALL registrar una advertencia. Los ids guardados que ya no existen en el catálogo SHALL omitirse en `favorites` y eliminarse de la lista guardada en el siguiente cambio. Después de cada `catalog` enviado tras un `ready`, la extensión SHALL enviar `favorites`.

#### Scenario: Marcar el primero
- **WHEN** no hay favoritos y llega `{ "type": "toggleFavorite", "commandId": "git.status" }`
- **THEN** la extensión guarda `["git.status"]` y responde `{ "type": "favorites", "commandIds": ["git.status"] }`

#### Scenario: Orden de marcado
- **WHEN** el usuario marca `docker.ps` y después `git.status`
- **THEN** `favorites` lleva `["docker.ps", "git.status"]`

#### Scenario: Persistencia
- **WHEN** el usuario marca `git.status`, cierra VS Code y vuelve a abrir DevCommands
- **THEN** tras el handshake la extensión envía `favorites` con `git.status`

#### Scenario: Id inexistente
- **WHEN** llega `{ "type": "toggleFavorite", "commandId": "git.nope" }`
- **THEN** la lista guardada no cambia y la extensión registra una advertencia

#### Scenario: Comando eliminado del catálogo
- **WHEN** la lista guardada contiene `git.antiguo`, que ya no está en el catálogo, y `git.status`
- **THEN** `favorites` lleva solo `["git.status"]`

### Requirement: Tarjeta de favoritos
Si hay al menos un favorito, la lista de categorías SHALL mostrar como primera entrada una tarjeta "Favoritos" (en el idioma activo) con un icono de estrella y su número de comandos con la forma plural correcta. Sin favoritos, la tarjeta MUST NOT mostrarse. La tarjeta SHALL comportarse con el teclado y el lector de pantalla como una entrada de categoría más.

#### Scenario: Con favoritos
- **WHEN** hay 2 favoritos y el idioma activo es `es`
- **THEN** la primera entrada de la lista es "Favoritos" con el texto "2 comandos", antes de Git

#### Scenario: Sin favoritos
- **WHEN** no hay favoritos
- **THEN** la lista de categorías es la misma que sin esta función

#### Scenario: Aparece al marcar el primero
- **WHEN** no hay favoritos, el usuario marca uno en la pantalla de Git y vuelve atrás
- **THEN** la lista muestra la tarjeta "Favoritos" con "1 comando" y el foco queda en Git

### Requirement: Pantalla de favoritos
Activar la tarjeta "Favoritos" SHALL mostrar una pantalla como la de una categoría: el título "Favoritos", el número de comandos, un control para volver y la lista de los comandos favoritos en el orden en que se marcaron, cada uno con el nombre de su categoría. Enviar, copiar y marcar SHALL funcionar igual que en cualquier lista. Un comando que se desmarca en esta pantalla SHALL seguir en la lista, con la estrella vacía, hasta salir de la pantalla. Volver (con el control o con Escape) SHALL mostrar la lista de categorías con el foco en la tarjeta "Favoritos", o en la primera entrada si la tarjeta ya no existe. La pantalla y el comando con foco SHALL guardarse y restaurarse como los de una categoría; si al restaurarla no hay favoritos, la pantalla SHALL indicar que no hay favoritos.

#### Scenario: Abrir los favoritos
- **WHEN** los favoritos son `docker.ps` y `git.status`, y el usuario activa la tarjeta
- **THEN** la pantalla muestra "Favoritos", "2 comandos" y los dos comandos en ese orden, con "Docker" y "Git" como categoría

#### Scenario: Desmarcar dentro de la pantalla
- **WHEN** el foco está en `git.status` en la pantalla de favoritos y el usuario pulsa `Ctrl+D`
- **THEN** `git.status` sigue en la lista con la estrella vacía y el foco no se mueve; al volver atrás y abrir de nuevo los favoritos, ya no aparece

#### Scenario: Volver con Escape
- **WHEN** la pantalla de favoritos está abierta y el usuario pulsa Escape
- **THEN** la vista muestra la lista de categorías con el foco en la tarjeta "Favoritos"

#### Scenario: Restaurar la pantalla
- **WHEN** el usuario está en la pantalla de favoritos con el foco en `docker.ps`, cambia al Explorador y vuelve a DevCommands
- **THEN** la vista muestra la pantalla de favoritos con el foco en `docker.ps`

#### Scenario: Restaurar sin favoritos
- **WHEN** el estado guardado es la pantalla de favoritos y la lista de favoritos está vacía
- **THEN** la pantalla indica que no hay favoritos y ofrece el control para volver
