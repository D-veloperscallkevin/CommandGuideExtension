# Change Log

All notable changes to the "devcommands" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added

- Los ejemplos, el texto enviado a la terminal y el copiado usan el shell de la terminal activa (PowerShell, bash, zsh o cmd; Git Bash y WSL cuentan como bash) o, si no hay ninguna, el del perfil por defecto. La vista se actualiza sola al cambiar de terminal o de shell, sin perder la pantalla, la búsqueda ni el foco.
- Indicador "Ejemplos para: <shell>" en la parte superior de la vista, en los 11 idiomas y anunciado al lector de pantalla cuando cambia.
- Variante de cmd en los 18 comandos de Terminal (`cd`, `dir /a`, `rmdir /s /q`, `del`, `type`, `findstr`…).

### Changed

- Requiere VS Code 1.99 o posterior (antes, 1.90).

## [0.1.0] - 2026-11-02

Primera pre-release (fase 1, MVP).

### Added

- Catálogo de comandos bilingüe (inglés/español) validado con JSON Schema (`catalog/schema.json`). Semilla: Git.
- Verificación local obligatoria antes de cada push (`pnpm run verify` + hook pre-push); migración a pnpm; el build de producción incluye el webview.
- Vista lateral de DevCommands en la Activity Bar con webview seguro (CSP + nonce) y handshake inicial.
- Interfaz en 11 idiomas (en, es, pt-br, fr, de, it, ja, ko, zh-cn, zh-tw, ru) según el idioma de VS Code.
- Lista de categorías del catálogo con iconos, teclado y lector de pantalla; abrir una categoría y volver con Atrás o Escape. Plurales según las reglas de cada idioma.
- Lista de comandos de cada categoría con título, descripción, ejemplo (PowerShell en Windows, bash en Linux y macOS) y aviso de riesgo. La vista recuerda dónde estabas al ocultarla o recargar la ventana.
- Clic (o Enter/Espacio) en un comando lo escribe en la terminal activa, o en una nueva "DevCommands", sin ejecutarlo. El webview solo envía el id y la extensión valida cada campo del mensaje. En una terminal nueva espera a que el shell esté listo (como mucho 3 segundos), para que el comando quede detrás del prompt.
- Botón de copiar en cada comando (y `Ctrl+C`/`Cmd+C` con el foco en él): copia el comando al portapapeles sin enviarlo a la terminal, con confirmación ✓ y anuncio "Copiado" para lectores de pantalla.
- Búsqueda global en la pantalla inicial: filtra los comandos de todas las categorías por título, descripción, tags, categoría y ejemplo, en inglés, en español y en el idioma de la interfaz, sin distinguir mayúsculas ni tildes. La búsqueda se conserva al ocultar la vista.
- Empaquetado local con `pnpm run release:package`: genera el `.vsix` pre-release y comprueba que pese menos de 2 MB y que solo incluya los archivos permitidos. La extensión se identifica como `aguilardigital.devcommands`.
- Catálogo con 6 categorías y 108 comandos: Git (20), npm (18), pnpm (18), Node.js (16), Docker (18) y Terminal (18, con variante de PowerShell para Windows). Todos los textos del catálogo en los 11 idiomas de la interfaz.

### Changed

- El catálogo admite 9 idiomas opcionales además de `en` y `es`, con fallback a inglés campo a campo.

### Removed

- Marcador provisional de la vista (nombre, versión y "Commands coming soon.").
- Comando de ejemplo Hello World.

- Initial release