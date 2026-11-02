# command-search Specification

## Purpose

Búsqueda global de comandos en todas las categorías desde la pantalla inicial de la vista: texto de búsqueda normalizado (sin mayúsculas ni tildes) en inglés, español y el idioma activo, orden de los resultados, teclado, anuncios accesibles y persistencia de la búsqueda con la navegación.


## Requirements

### Requirement: Buscar en todo el catálogo
La pantalla inicial de la vista SHALL ofrecer, encima de la lista de categorías, un campo para buscar comandos, con etiqueta accesible y texto de ejemplo en el idioma activo.

Mientras el campo contenga texto que no sea solo espacios, la vista SHALL sustituir la lista de categorías por la lista de resultados, que reúne comandos de todas las categorías. Al vaciar el campo, SHALL volver a mostrar la lista de categorías.

Un comando SHALL coincidir cuando su título, su descripción, sus tags (en inglés, en español o en el idioma activo), el título de su categoría o su ejemplo contienen todas las palabras de la búsqueda.

La comparación MUST NOT distinguir mayúsculas de minúsculas ni letras con o sin tildes o diacríticos.

#### Scenario: Buscar en español con la interfaz en inglés
- **WHEN** el idioma activo es `en` y el usuario escribe "rama"
- **THEN** los resultados incluyen `git.new-branch`, mostrado como "Create and switch branch"

#### Scenario: Sin tildes
- **WHEN** el idioma activo es `es` y el usuario escribe "INDICE"
- **THEN** los resultados incluyen `git.reset-hard`, cuya descripción contiene "índice"

#### Scenario: Varias palabras
- **WHEN** el usuario escribe "git estado"
- **THEN** los resultados incluyen `git.status` y no incluyen `git.reset-hard`, que no contiene "estado"

#### Scenario: Por el ejemplo
- **WHEN** el usuario escribe "checkout"
- **THEN** los resultados incluyen `git.new-branch`

#### Scenario: Vaciar el campo
- **WHEN** hay resultados visibles y el usuario borra todo el texto del campo
- **THEN** la vista muestra de nuevo la lista de categorías

### Requirement: Orden y contenido de los resultados
Los resultados SHALL mostrar primero los comandos que coinciden en su título (en el idioma activo) y después el resto. Dentro de cada grupo, SHALL seguir el orden del catálogo (categorías y comandos).

Cada resultado SHALL mostrarse como en la lista de comandos de una categoría: título, descripción, ejemplo y aviso de riesgo. Además, SHALL indicar el título de su categoría.

Activarlo SHALL enviarlo a la terminal sin ejecutarlo, y SHALL poder copiarse con el botón de copiar o con `Ctrl+C`/`Cmd+C`, igual que en la pantalla de una categoría.

#### Scenario: Título primero
- **WHEN** el idioma activo es `es` y el usuario escribe "cambios", que está en el título de `git.reset-hard` ("Descartar todos los cambios locales") y solo en los tags de `git.status`
- **THEN** `git.reset-hard` aparece antes que `git.status`

#### Scenario: Enviar desde los resultados en Windows
- **WHEN** en Windows con PowerShell el usuario busca "status" y activa `git.status`
- **THEN** la terminal muestra `git status` sin ejecutarlo

#### Scenario: Copiar desde los resultados en Linux
- **WHEN** en Linux con bash el foco está en el resultado `git.new-branch`, el idioma activo es `en` y el usuario pulsa `Ctrl+C`
- **THEN** el portapapeles contiene `git checkout -b feature/my-change`

#### Scenario: Categoría visible
- **WHEN** el resultado `git.status` está visible
- **THEN** la fila indica que pertenece a la categoría "Git"

### Requirement: Teclado y anuncios de la búsqueda
La lista de resultados SHALL tener nombre accesible y ocupar una sola parada de Tab. Las flechas, Inicio y Fin SHALL moverse por ella como en la lista de comandos de una categoría.

Con el foco en el campo, Flecha abajo SHALL llevar el foco al primer resultado. Con texto en el campo, Escape SHALL vaciarlo y dejar el foco en él, tanto si el foco estaba en el campo como en un resultado.

La vista SHALL anunciar en una región viva, en el idioma activo, el número de resultados con la forma plural correcta, o un mensaje de que no hay resultados. Ese mensaje también SHALL mostrarse en la vista.

#### Scenario: Del campo a los resultados
- **WHEN** el foco está en el campo con la búsqueda "git" y el usuario pulsa Flecha abajo
- **THEN** el foco pasa al primer resultado

#### Scenario: Escape vacía
- **WHEN** el foco está en el campo con la búsqueda "git" y el usuario pulsa Escape
- **THEN** el campo queda vacío, la vista muestra la lista de categorías y el foco sigue en el campo

#### Scenario: Escape desde un resultado
- **WHEN** el foco está en un resultado de la búsqueda "git" y el usuario pulsa Escape
- **THEN** el campo queda vacío, la vista muestra la lista de categorías y el foco pasa al campo

#### Scenario: Número de resultados en ruso
- **WHEN** el idioma activo es `ru` y la búsqueda devuelve 3 resultados
- **THEN** la región viva anuncia el número con la forma plural rusa para "few"

#### Scenario: Sin resultados
- **WHEN** el idioma activo es `es` y el usuario escribe "zzz"
- **THEN** la vista muestra y anuncia un mensaje de que no hay resultados

### Requirement: Búsqueda persistida
La vista SHALL guardar, con el estado de la navegación, el texto de búsqueda y el resultado con foco. Al volver a crearse el webview, SHALL restaurar el texto, los resultados y ese foco. Si el resultado guardado ya no existe en el catálogo recibido, SHALL restaurar la búsqueda sin enfocar ningún resultado.

#### Scenario: Ocultar y volver a mostrar
- **WHEN** el usuario busca "rama" con el foco en `git.new-branch`, cambia al Explorador y vuelve a DevCommands
- **THEN** el campo contiene "rama", se ven los mismos resultados y el foco está en `git.new-branch`

#### Scenario: Resultado eliminado del catálogo
- **WHEN** el estado guardado tiene la búsqueda "rama" y el foco en un comando que ya no está en el catálogo
- **THEN** la vista muestra la búsqueda "rama" con sus resultados y ningún resultado tiene el foco
