## MODIFIED Requirements

### Requirement: Lista de categorías
La vista SHALL mostrar las categorías del catálogo agrupadas en secciones plegables, en este orden:
1. las tarjetas de Favoritos y Recientes, si tienen contenido, siempre visibles;
2. "En este proyecto", con las categorías detectadas en el proyecto, solo si `catalog` trae alguna;
3. las secciones del catálogo con contenido, en este orden fijo:
   - "Lenguajes y entornos" (`languages`);
   - "Control de versiones" (`vcs`);
   - "Frameworks" (`frameworks`);
   - "Bases de datos" (`databases`);
   - "Contenedores e infraestructura" (`infra`);
   - "Nube" (`cloud`);
   - "Servidores y redes" (`servers`);
   - "Testing y calidad" (`quality`);
   - "Game dev y móvil" (`gamedev`);
   - "Herramientas e IA" (`tools`);
4. "Mis comandos", con las categorías propias, si las hay.

Una categoría detectada SHALL aparecer solo en "En este proyecto" y no en su sección. Una sección sin categorías MUST NOT mostrarse. Dentro de cada sección, las categorías SHALL seguir el orden del catálogo.

Cada sección SHALL tener un encabezado activable con:
- su nombre en el idioma activo;
- un indicador de desplegada (▾) o plegada (▸);
- su número de categorías, con la forma plural correcta del idioma activo.

Activar el encabezado SHALL desplegar o plegar la sección. Al abrir la vista por primera vez, "En este proyecto" SHALL estar desplegada y las demás plegadas. Las secciones desplegadas SHALL conservarse al navegar a una categoría y volver, y al ocultar y volver a mostrar la vista, igual que la navegación.

Los resultados de búsqueda no se dividen en secciones y SHALL incluir comandos de todas las categorías, estén o no plegadas. Cada categoría SHALL mostrar su icono, su título en el idioma activo (con fallback a inglés) y su número de comandos con la forma plural correcta del idioma activo.

#### Scenario: Catálogo con Git
- **WHEN** el catálogo contiene la categoría Git con 3 comandos, el idioma activo es `es` y la sección "Control de versiones" está desplegada
- **THEN** la sección muestra una entrada con el icono de Git, el título "Git" y el texto "3 comandos"

#### Scenario: Singular
- **WHEN** una categoría tiene 1 comando, el idioma activo es `en` y su sección está desplegada
- **THEN** su entrada muestra "1 command"

#### Scenario: Plural en ruso
- **WHEN** una categoría tiene 3 comandos, el idioma activo es `ru` y su sección está desplegada
- **THEN** su entrada usa la forma plural rusa para "few" ("3 команды")

#### Scenario: Orden
- **WHEN** una sección tiene categorías con `order` 20 y 10
- **THEN** la de `order` 10 aparece primero

#### Scenario: Secciones con categorías detectadas
- **WHEN** el idioma activo es `es`, en Windows con PowerShell o en Linux con bash, hay favoritos, `catalog` trae `"detected": ["pnpm", "node"]` y el usuario abre la vista por primera vez
- **THEN** la vista muestra la tarjeta "Favoritos" y "En este proyecto" desplegada con pnpm y Node. Debajo aparecen plegadas "Lenguajes y entornos" (1 categoría, npm), "Control de versiones", "Contenedores e infraestructura" y "Herramientas e IA"

#### Scenario: Sin categorías detectadas
- **WHEN** `catalog` trae `"detected": []`
- **THEN** la vista no muestra "En este proyecto" y las secciones del catálogo aparecen plegadas

#### Scenario: Desplegar una sección
- **WHEN** el usuario pulsa el encabezado plegado "Control de versiones"
- **THEN** la sección se despliega, muestra Git y el indicador pasa a ▾

#### Scenario: Estado recordado
- **WHEN** el usuario despliega "Lenguajes y entornos", abre npm y vuelve al inicio
- **THEN** "Lenguajes y entornos" sigue desplegada

#### Scenario: Búsqueda con categorías detectadas
- **WHEN** hay categorías detectadas, todas las secciones están plegadas y el usuario escribe `docker images` en la búsqueda
- **THEN** los resultados incluyen el comando de Docker y no se muestran encabezados de sección

### Requirement: Teclado
La lista SHALL ocupar una sola parada de Tab: las tarjetas, los encabezados de sección y las categorías de las secciones desplegadas se recorren como una única lista. Las categorías de una sección plegada MUST NOT recibir el foco.

Dentro de la lista:
- Flecha abajo y Flecha arriba SHALL mover el foco a la entrada siguiente y anterior; Inicio y Fin, a la primera y la última.
- En una categoría o una tarjeta, Enter o Espacio SHALL abrirla. Al abrir una categoría, el foco SHALL pasar al título de su pantalla.
- En un encabezado, Enter o Espacio SHALL desplegar o plegar la sección. Flecha derecha SHALL desplegarla si está plegada, y Flecha izquierda SHALL plegarla si está desplegada.
- En una categoría de una sección, Flecha izquierda SHALL mover el foco al encabezado de su sección.

Al plegar una sección, el foco SHALL quedar en su encabezado.

#### Scenario: Recorrer la lista
- **WHEN** el foco está en la primera entrada y el usuario pulsa Fin y después Flecha arriba
- **THEN** el foco queda en la penúltima entrada visible

#### Scenario: Abrir con el teclado
- **WHEN** el foco está en una categoría y el usuario pulsa Enter
- **THEN** se abre su pantalla y el foco pasa a su título

#### Scenario: Pasar de una sección a otra
- **WHEN** "En este proyecto" está desplegada, el foco está en su última categoría y el usuario pulsa Flecha abajo
- **THEN** el foco pasa al encabezado de la sección siguiente

#### Scenario: Desplegar con la flecha
- **WHEN** el foco está en el encabezado plegado "Control de versiones" y el usuario pulsa Flecha derecha y después Flecha abajo
- **THEN** la sección se despliega y el foco pasa a Git

#### Scenario: Volver al encabezado
- **WHEN** el foco está en Git, dentro de "Control de versiones" desplegada, y el usuario pulsa Flecha izquierda
- **THEN** el foco pasa al encabezado "Control de versiones", que sigue desplegado

#### Scenario: Secciones plegadas fuera del recorrido
- **WHEN** "Contenedores e infraestructura" está plegada, el foco está en su encabezado y el usuario pulsa Flecha abajo
- **THEN** el foco pasa al encabezado siguiente, no a Docker

#### Scenario: Una sola parada de Tab con secciones
- **WHEN** el foco está en una categoría de una sección
- **THEN** Tab saca el foco de la lista de categorías, y Mayús+Tab desde el control siguiente vuelve a esa categoría

### Requirement: Accesibilidad
La lista SHALL exponerse como una lista con nombre accesible. Las tarjetas de Favoritos y Recientes SHALL exponerse como una lista aparte con el nombre "Accesos rápidos" en el idioma activo.

Cada encabezado de sección SHALL exponerse como un botón cuyo nombre accesible incluye el nombre de la sección y su número de categorías, y que indica a los lectores de pantalla si está desplegado o plegado. Las categorías de cada sección desplegada SHALL exponerse como una lista cuyo nombre accesible es el de la sección.

Cada categoría SHALL exponerse como un elemento activable cuyo nombre accesible incluye el título y el número de comandos. Los iconos y los indicadores ▸/▾ MUST ser decorativos para los lectores de pantalla.

#### Scenario: Lector de pantalla en un encabezado
- **WHEN** un lector de pantalla llega al encabezado plegado "Control de versiones" con 1 categoría en español
- **THEN** anuncia "Control de versiones, 1 categoría", como botón plegado

#### Scenario: Lector de pantalla en la lista
- **WHEN** "Control de versiones" está desplegada, el idioma activo es `en` y un lector de pantalla llega a la entrada Git con 3 comandos
- **THEN** anuncia "Git, 3 commands" como un botón dentro de la lista "Version control"

#### Scenario: Lector de pantalla en una sección
- **WHEN** "En este proyecto" está desplegada, el idioma activo es `es` y un lector de pantalla llega a la entrada pnpm con 18 comandos
- **THEN** anuncia "pnpm, 18 comandos" como un botón dentro de la lista "En este proyecto"
