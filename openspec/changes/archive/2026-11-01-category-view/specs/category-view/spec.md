# Spec Delta

## Purpose

Muestra en la vista lateral las categorías del catálogo, permite abrir una categoría y volver, y garantiza que esa navegación funcione con teclado, lector de pantalla, cualquier tema y cualquiera de los idiomas de la interfaz.

## ADDED Requirements

### Requirement: Lista de categorías
La vista SHALL mostrar todas las categorías del catálogo en el orden del catálogo. Cada una SHALL mostrar su icono, su título en el idioma activo (con fallback a inglés) y su número de comandos con la forma plural correcta del idioma activo.

#### Scenario: Catálogo con Git
- **WHEN** el catálogo contiene la categoría Git con 3 comandos y el idioma activo es `es`
- **THEN** la vista muestra una entrada con el icono de Git, el título "Git" y el texto "3 comandos"

#### Scenario: Singular
- **WHEN** una categoría tiene 1 comando y el idioma activo es `en`
- **THEN** su entrada muestra "1 command"

#### Scenario: Plural en ruso
- **WHEN** una categoría tiene 3 comandos y el idioma activo es `ru`
- **THEN** su entrada usa la forma plural rusa para "few" ("3 команды")

#### Scenario: Orden
- **WHEN** hay categorías con `order` 20 y 10
- **THEN** la de `order` 10 aparece primero

### Requirement: Iconos de categoría
Cada categoría SHALL mostrarse con el Codicon indicado en su campo `icon`. Si el nombre no corresponde a un Codicon disponible, la vista SHALL mostrar un icono genérico en su lugar. Los tests MUST comprobar que todos los iconos del catálogo empaquetado existen.

#### Scenario: Icono inexistente
- **WHEN** una categoría declara `icon: "no-existe"`
- **THEN** la vista muestra el icono genérico y el test de iconos del catálogo falla nombrando la categoría

### Requirement: Navegación a una categoría y vuelta
Activar una categoría SHALL mostrar su pantalla, con el título de la categoría, su número de comandos y un control para volver. Volver SHALL mostrar de nuevo la lista y devolver el foco a la categoría desde la que se entró.

#### Scenario: Abrir y volver
- **WHEN** el usuario abre la categoría Git y después pulsa "Atrás"
- **THEN** la vista vuelve a la lista y el foco queda sobre la entrada Git

#### Scenario: Volver con Escape
- **WHEN** la pantalla de una categoría está abierta y el usuario pulsa Escape
- **THEN** la vista vuelve a la lista

### Requirement: Teclado
La lista SHALL ocupar una sola parada de Tab. Dentro de ella, Flecha abajo y Flecha arriba SHALL mover el foco a la entrada siguiente y anterior, Inicio y Fin a la primera y la última, y Enter o Espacio SHALL abrir la categoría con el foco. Al abrir una categoría, el foco SHALL pasar al título de su pantalla.

#### Scenario: Recorrer la lista
- **WHEN** el foco está en la primera categoría y el usuario pulsa Fin y después Flecha arriba
- **THEN** el foco queda en la penúltima categoría

#### Scenario: Abrir con el teclado
- **WHEN** el foco está en una categoría y el usuario pulsa Enter
- **THEN** se abre su pantalla y el foco pasa a su título

### Requirement: Accesibilidad
La lista SHALL exponerse como una lista con nombre accesible, y cada entrada como un elemento activable cuyo nombre accesible incluye el título y el número de comandos. Los iconos MUST ser decorativos para los lectores de pantalla.

#### Scenario: Lector de pantalla en la lista
- **WHEN** un lector de pantalla llega a la entrada Git con 3 comandos en inglés
- **THEN** anuncia "Git, 3 commands" como un botón dentro de la lista de categorías

### Requirement: Tema de VS Code
La lista SHALL usar los colores de lista del tema activo para el estado normal, el paso del ratón, el foco y la selección, incluido un contorno visible en los temas de alto contraste.

#### Scenario: Alto contraste
- **WHEN** el tema activo es de alto contraste y el foco está en una categoría
- **THEN** la entrada muestra el contorno de foco del tema

### Requirement: Estados de carga y catálogo vacío
Hasta recibir el catálogo, la vista SHALL mostrar un indicador de carga. Si el catálogo llega sin categorías, SHALL mostrar un mensaje que lo indique. Ambos textos SHALL estar en el idioma activo.

#### Scenario: Catálogo vacío
- **WHEN** la extensión envía `catalog` con `categories: []`
- **THEN** la vista muestra el mensaje de catálogo vacío en el idioma activo
