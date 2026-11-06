## ADDED Requirements

### Requirement: Enlace de patrocinio en la ficha
El manifiesto SHALL declarar `sponsor.url` con la página de GitHub Sponsors del autor (`https://github.com/sponsors/D-veloperscallkevin`), para que la ficha de la extensión en VS Code muestre el botón **Sponsor**. El título del README SHALL llevar a su lado un enlace de texto "♥ Sponsor" a esa página, sin imágenes. El README SHALL incluir también una sección "Support" con un enlace a esa misma página, antes de la sección de licencia.

#### Scenario: Botón Sponsor en la ficha
- **WHEN** el usuario abre la ficha de DevCommands Guide en la vista de extensiones de VS Code (Windows con PowerShell o Linux con bash)
- **THEN** la ficha muestra el botón Sponsor, que lleva a `https://github.com/sponsors/D-veloperscallkevin`

#### Scenario: Enlace junto al título
- **WHEN** se lee la primera línea del README
- **THEN** es el título "DevCommands Guide" seguido de un enlace "♥ Sponsor" a `https://github.com/sponsors/D-veloperscallkevin`

#### Scenario: Sección Support del README
- **WHEN** se lee el README publicado
- **THEN** contiene una sección "Support" con un enlace a `https://github.com/sponsors/D-veloperscallkevin`, situada antes de "License"
