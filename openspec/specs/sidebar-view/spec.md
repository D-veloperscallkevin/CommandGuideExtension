# sidebar-view Specification

## Purpose

Ofrece la vista lateral de DevCommands en la Activity Bar de VS Code, carga en ella la interfaz web de forma segura y respetando el tema, y no crea esa interfaz hasta que el usuario abre la vista, aunque la extensión se active al terminar el arranque de VS Code.

## Requirements

### Requirement: Contenedor y vista en la Activity Bar
La extensión SHALL aportar un contenedor propio en la Activity Bar, con el nombre "DevCommands" y un icono propio, que contiene una vista webview. La extensión MUST NOT aportar comandos de ejemplo del generador.

#### Scenario: Vista disponible tras instalar
- **WHEN** se instala la extensión y se abre VS Code
- **THEN** la Activity Bar muestra el icono de DevCommands y, al pulsarlo, se abre su vista lateral

#### Scenario: Sin comando de ejemplo
- **WHEN** se busca "Hello World" en la paleta de comandos
- **THEN** no aparece ningún comando de DevCommands

### Requirement: Activación perezosa
La extensión SHALL activarse cuando VS Code termina de arrancar, sin retrasar el arranque, para poder saber desde el principio qué terminales están ocupadas. También SHALL activarse al abrir su vista o al ejecutar uno de sus comandos, si aún no lo estaba. MUST NOT activarse antes de que VS Code termine de arrancar.

Con la extensión activa y la vista sin abrir, el webview MUST NOT crearse y no se le envía ningún mensaje. La vista SHALL cargar su interfaz cuando el usuario la abre.

#### Scenario: Arranque sin abrir la vista
- **WHEN** VS Code arranca, en Windows con PowerShell o en Linux con bash, y el usuario no abre la vista de DevCommands
- **THEN** la extensión se activa cuando el arranque ha terminado y el webview de la vista no se crea

#### Scenario: Apertura de la vista
- **WHEN** el usuario abre la vista de DevCommands
- **THEN** la extensión está activa y la vista carga su interfaz

### Requirement: Carga segura del webview
El contenido de la vista SHALL cargarse con una Content Security Policy que deniega todo por defecto, permite scripts solo con un `nonce` distinto en cada carga y permite estilos, imágenes y fuentes solo desde los recursos de la propia extensión. La política MUST NOT incluir `'unsafe-inline'` ni `'unsafe-eval'`. El webview MUST poder leer únicamente los archivos de la interfaz compilada de la extensión.

#### Scenario: Política aplicada
- **WHEN** se genera el contenido de la vista
- **THEN** incluye una CSP con `default-src 'none'`, un `script-src` restringido a un `nonce` y ningún permiso `'unsafe-inline'` ni `'unsafe-eval'`

#### Scenario: Nonce distinto en cada carga
- **WHEN** la vista se carga dos veces
- **THEN** cada carga usa un `nonce` diferente, y solo los scripts con ese `nonce` se ejecutan

#### Scenario: Recurso fuera de la interfaz compilada
- **WHEN** el webview intenta cargar un archivo de la extensión fuera de la interfaz compilada
- **THEN** VS Code bloquea la carga

### Requirement: Interfaz inicial integrada con el tema y accesible
Mientras carga su contenido, la vista SHALL mostrar un indicador de carga en el idioma activo. Toda la interfaz SHALL usar los colores y la tipografía del tema activo de VS Code (claro, oscuro y alto contraste). La interfaz MUST exponer su contenido a lectores de pantalla y ser navegable con teclado.

#### Scenario: Tema oscuro y alto contraste
- **WHEN** el usuario cambia entre un tema oscuro, uno claro y uno de alto contraste con la vista abierta
- **THEN** la vista adopta los colores de cada tema sin recargarla

#### Scenario: Lector de pantalla
- **WHEN** un lector de pantalla recorre la vista mientras carga
- **THEN** anuncia una región con nombre "DevCommands" y el estado de carga

### Requirement: Funcionamiento en Windows y Linux
La vista SHALL cargarse y completar el handshake inicial tanto en Windows como en Linux (incluido WSL con pantalla virtual para las pruebas).

#### Scenario: Windows con PowerShell
- **WHEN** se abre la vista en VS Code sobre Windows, con PowerShell como terminal por defecto
- **THEN** la interfaz carga y muestra las categorías del catálogo

#### Scenario: Linux con bash
- **WHEN** se ejecutan los tests de integración en Linux o WSL con bash y pantalla virtual
- **THEN** la vista carga y el handshake inicial se completa

### Requirement: Botón de patrocinio en el panel
La vista SHALL mostrar arriba del todo, a la derecha y en la misma fila que el indicador del shell ("Terminal: …"), un botón con un icono de corazón y el texto "Sponsor" en el idioma activo (en español, "Patrocinar"). El botón SHALL verse en todas las pantallas de la vista: el inicio, una categoría, Favoritos, Recientes y los resultados de búsqueda.

El botón SHALL:
- usar los colores del tema activo;
- poder pulsarse con el ratón y, con el foco en él, con Enter o Espacio;
- tener un nombre accesible que diga que abre la página de patrocinio en el navegador.

Debajo de esa fila, el buscador SHALL quedar separado de ella y de la lista que le sigue con un espacio visible.

Al pulsarlo, la extensión SHALL abrir en el navegador la página de GitHub Sponsors declarada en el campo `sponsor` del manifiesto, a través del mecanismo de VS Code para abrir enlaces externos, sin un aviso propio de la extensión (VS Code solo pregunta para dominios que no son de confianza; `github.com` lo es). La extensión MUST NOT abrir ninguna otra dirección por este botón. Si el manifiesto no declara una URL `https://github.com/sponsors/…`, SHALL ignorar la petición y registrar una advertencia. Pulsar el botón MUST NOT escribir nada en la terminal ni cambiar el portapapeles.

#### Scenario: Botón visible al abrir el panel
- **WHEN** el usuario abre la vista de DevCommands en Windows con PowerShell o en Linux con bash
- **THEN** ve en la primera fila el indicador "Terminal: …" a la izquierda y el botón "Sponsor" a la derecha, y debajo el buscador, separado de esa fila y de la lista

#### Scenario: Visible dentro de una categoría
- **WHEN** el usuario entra en la categoría Git
- **THEN** el botón sigue arriba del todo

#### Scenario: Abrir con el teclado
- **WHEN** el usuario lleva el foco al botón con Tab y pulsa Enter
- **THEN** VS Code abre `https://github.com/sponsors/D-veloperscallkevin` en el navegador

#### Scenario: Interfaz en español
- **WHEN** VS Code está en español
- **THEN** el botón dice "Patrocinar"

#### Scenario: URL del manifiesto no válida
- **WHEN** el campo `sponsor.url` del manifiesto no empieza por `https://github.com/sponsors/` y el usuario pulsa el botón
- **THEN** no se abre nada y el registro contiene una advertencia
