# category-view Specification

## Purpose

Muestra en la vista lateral las categorías del catálogo, permite abrir una categoría y volver, y garantiza que esa navegación funcione con teclado, lector de pantalla, cualquier tema y cualquiera de los idiomas de la interfaz.

## Requirements

### Requirement: Lista de categorías
La vista SHALL mostrar todas las categorías del catálogo en el orden del catálogo. Si `catalog` trae alguna categoría detectada en el proyecto, las categorías SHALL repartirse en dos secciones, cada una con un encabezado visible en el idioma activo: "En este proyecto", con las detectadas, y "Todas", con el resto, ambas en el orden del catálogo. Las tarjetas de Favoritos y Recientes SHALL seguir encima de las dos secciones. Sin categorías detectadas, la vista MUST NOT mostrar encabezados. Los resultados de búsqueda no se dividen en secciones. Cada una SHALL mostrar su icono, su título en el idioma activo (con fallback a inglés) y su número de comandos con la forma plural correcta del idioma activo.

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

#### Scenario: Secciones con categorías detectadas
- **WHEN** el idioma activo es `es`, hay favoritos y `catalog` trae `"detected": ["pnpm", "node"]`
- **THEN** la vista muestra la tarjeta "Favoritos", el encabezado "En este proyecto" con pnpm y Node, y el encabezado "Todas" con Git, npm, Docker y Terminal

#### Scenario: Sin categorías detectadas
- **WHEN** `catalog` trae `"detected": []`
- **THEN** la vista no muestra encabezados y la lista es la misma que sin esta función

#### Scenario: Búsqueda con categorías detectadas
- **WHEN** hay categorías detectadas y el usuario escribe en la búsqueda
- **THEN** los resultados son los mismos que sin categorías detectadas y no se muestran encabezados

### Requirement: Iconos de categoría
Cada categoría SHALL mostrarse con el Codicon indicado en su campo `icon`. Si el nombre no corresponde a un Codicon disponible, la vista SHALL mostrar un icono genérico en su lugar. Los tests MUST comprobar que todos los iconos del catálogo empaquetado existen.

#### Scenario: Icono inexistente
- **WHEN** una categoría declara `icon: "no-existe"`
- **THEN** la vista muestra el icono genérico y el test de iconos del catálogo falla nombrando la categoría

### Requirement: Navegación a una categoría y vuelta
Activar una categoría SHALL mostrar su pantalla, con el título de la categoría, su número de comandos, un control para volver y la lista de sus comandos. Volver SHALL mostrar de nuevo la lista de categorías y devolver el foco a la categoría desde la que se entró.

#### Scenario: Abrir y volver
- **WHEN** el usuario abre la categoría Git y después pulsa "Atrás"
- **THEN** la vista vuelve a la lista y el foco queda sobre la entrada Git

#### Scenario: Volver con Escape
- **WHEN** la pantalla de una categoría está abierta y el usuario pulsa Escape
- **THEN** la vista vuelve a la lista

#### Scenario: Pantalla con comandos
- **WHEN** el usuario abre la categoría Git
- **THEN** la pantalla muestra su título, "3 comandos" (en español), el control para volver y los 3 comandos de Git

### Requirement: Teclado
La lista SHALL ocupar una sola parada de Tab, también cuando está dividida en secciones: las tarjetas y todas las secciones se recorren como una única lista. Dentro de ella, Flecha abajo y Flecha arriba SHALL mover el foco a la entrada siguiente y anterior, Inicio y Fin a la primera y la última, y Enter o Espacio SHALL abrir la categoría con el foco. Al abrir una categoría, el foco SHALL pasar al título de su pantalla.

#### Scenario: Recorrer la lista
- **WHEN** el foco está en la primera categoría y el usuario pulsa Fin y después Flecha arriba
- **THEN** el foco queda en la penúltima categoría

#### Scenario: Abrir con el teclado
- **WHEN** el foco está en una categoría y el usuario pulsa Enter
- **THEN** se abre su pantalla y el foco pasa a su título

#### Scenario: Pasar de una sección a otra
- **WHEN** hay secciones, el foco está en la última categoría de "En este proyecto" y el usuario pulsa Flecha abajo
- **THEN** el foco pasa a la primera categoría de "Todas"

#### Scenario: Una sola parada de Tab con secciones
- **WHEN** hay secciones y el foco está en una categoría de "Todas"
- **THEN** Tab saca el foco de la lista de categorías, y Mayús+Tab desde el control siguiente vuelve a esa categoría

### Requirement: Accesibilidad
La lista SHALL exponerse como una lista con nombre accesible. Cuando hay secciones, cada una SHALL exponerse como una lista cuyo nombre accesible es su encabezado, y las tarjetas de Favoritos y Recientes como una lista aparte con el nombre "Accesos rápidos" en el idioma activo. En todos los casos, cada entrada SHALL exponerse como un elemento activable cuyo nombre accesible incluye el título y el número de comandos. Los iconos MUST ser decorativos para los lectores de pantalla.

#### Scenario: Lector de pantalla en la lista
- **WHEN** un lector de pantalla llega a la entrada Git con 3 comandos en inglés
- **THEN** anuncia "Git, 3 commands" como un botón dentro de la lista de categorías

#### Scenario: Lector de pantalla en una sección
- **WHEN** hay secciones, el idioma activo es `es` y un lector de pantalla llega a la entrada pnpm con 18 comandos
- **THEN** anuncia "pnpm, 18 comandos" como un botón dentro de la lista "En este proyecto"

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
