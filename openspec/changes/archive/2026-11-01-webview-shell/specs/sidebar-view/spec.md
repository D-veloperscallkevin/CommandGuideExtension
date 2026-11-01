# Spec Delta

## Purpose

Ofrece la vista lateral de DevCommands en la Activity Bar de VS Code, carga en ella la interfaz web de forma segura y respetando el tema, y activa la extensión solo cuando el usuario la abre.

## ADDED Requirements

### Requirement: Contenedor y vista en la Activity Bar
La extensión SHALL aportar un contenedor propio en la Activity Bar, con el nombre "DevCommands" y un icono propio, que contiene una vista webview. La extensión MUST NOT aportar comandos de ejemplo del generador.

#### Scenario: Vista disponible tras instalar
- **WHEN** se instala la extensión y se abre VS Code
- **THEN** la Activity Bar muestra el icono de DevCommands y, al pulsarlo, se abre su vista lateral

#### Scenario: Sin comando de ejemplo
- **WHEN** se busca "Hello World" en la paleta de comandos
- **THEN** no aparece ningún comando de DevCommands

### Requirement: Activación perezosa
La extensión SHALL activarse únicamente cuando se abre su vista o se ejecuta uno de sus comandos. MUST NOT activarse al arrancar VS Code.

#### Scenario: Arranque sin abrir la vista
- **WHEN** VS Code arranca y el usuario no abre la vista de DevCommands
- **THEN** la extensión no se activa

#### Scenario: Apertura de la vista
- **WHEN** el usuario abre la vista de DevCommands
- **THEN** la extensión se activa y la vista carga su interfaz

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
Mientras no haya contenido funcional, la vista SHALL mostrar el nombre de la extensión, su versión y un indicador de carga, usando los colores y la tipografía del tema activo de VS Code (claro, oscuro y alto contraste). La interfaz MUST exponer su contenido a lectores de pantalla y ser navegable con teclado.

#### Scenario: Tema oscuro y alto contraste
- **WHEN** el usuario cambia entre un tema oscuro, uno claro y uno de alto contraste con la vista abierta
- **THEN** la vista adopta los colores de cada tema sin recargarla

#### Scenario: Lector de pantalla
- **WHEN** un lector de pantalla recorre la vista
- **THEN** anuncia una región con nombre "DevCommands" y el estado de carga

### Requirement: Funcionamiento en Windows y Linux
La vista SHALL cargarse y completar el handshake inicial tanto en Windows como en Linux (incluido WSL con pantalla virtual para las pruebas).

#### Scenario: Windows con PowerShell
- **WHEN** se abre la vista en VS Code sobre Windows, con PowerShell como terminal por defecto
- **THEN** la interfaz carga y muestra la versión de la extensión

#### Scenario: Linux con bash
- **WHEN** se ejecutan los tests de integración en Linux o WSL con bash y pantalla virtual
- **THEN** la vista carga y el handshake inicial se completa
