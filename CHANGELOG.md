# Change Log

All notable changes to the "devcommands" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added

- Catálogo de comandos bilingüe (inglés/español) validado con JSON Schema (`catalog/schema.json`). Semilla: Git.
- Verificación local obligatoria antes de cada push (`pnpm run verify` + hook pre-push); migración a pnpm; el build de producción incluye el webview.
- Vista lateral de DevCommands en la Activity Bar con webview seguro (CSP + nonce) y handshake inicial.
- Interfaz en 11 idiomas (en, es, pt-br, fr, de, it, ja, ko, zh-cn, zh-tw, ru) según el idioma de VS Code.
- Lista de categorías del catálogo con iconos, teclado y lector de pantalla; abrir una categoría y volver con Atrás o Escape. Plurales según las reglas de cada idioma.
- Lista de comandos de cada categoría con título, descripción, ejemplo (PowerShell en Windows, bash en Linux y macOS) y aviso de riesgo. La vista recuerda dónde estabas al ocultarla o recargar la ventana.

### Changed

- El catálogo admite 9 idiomas opcionales además de `en` y `es`, con fallback a inglés campo a campo.

### Removed

- Marcador provisional de la vista (nombre, versión y "Commands coming soon.").
- Comando de ejemplo Hello World.

- Initial release