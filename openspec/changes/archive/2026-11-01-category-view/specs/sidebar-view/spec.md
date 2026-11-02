# Spec Delta

## MODIFIED Requirements

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
