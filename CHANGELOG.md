# Change Log

All notable changes to the "devcommands" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added

- Botón **Sponsor** arriba del panel de DevCommands, en todas sus pantallas, que abre GitHub Sponsors en el navegador. También aparece en la ficha de la extensión (campo `sponsor` del manifiesto) y en la sección "Support" del README, además de un enlace junto a su título.

### Changed

- El indicador "Ejemplos para: …" pasa a "Terminal: …", en la misma fila que el botón Sponsor, con el nombre del shell en su color (PowerShell azul, bash verde, zsh morado, cmd amarillo, según el tema). El buscador queda más separado de esa fila y de la lista.

### Fixed

- Los comandos ya no se escriben en una terminal ocupada por un programa (Claude Code, un servidor de desarrollo…): van a la última terminal libre usada o a una nueva "DevCommands", y "Ejemplos para" sigue a esa terminal. La extensión se activa al terminar el arranque de VS Code para detectarlo desde el principio.

## [1.0.0] - 2026-11-04

Primera versión pública (fase 2, v1), en el Marketplace de VS Code y en Open VSX.

### Added

- Los ejemplos, el texto enviado a la terminal y el copiado usan el shell de la terminal activa (PowerShell, bash, zsh o cmd; Git Bash y WSL cuentan como bash) o, si no hay ninguna, el del perfil por defecto. La vista se actualiza sola al cambiar de terminal o de shell, sin perder la pantalla, la búsqueda ni el foco.
- Indicador "Ejemplos para: <shell>" en la parte superior de la vista, en los 11 idiomas y anunciado al lector de pantalla cuando cambia.
- Variante de cmd en los 18 comandos de Terminal (`cd`, `dir /a`, `rmdir /s /q`, `del`, `type`, `findstr`…).
- Al enviar o copiar un comando con parámetros (`${branch}`, `${file}`…), un cuadro de texto pide cada valor. Los valores se escriben escapados para el shell de destino, sin que espacios, comillas, `$` o `!` cambien el comando. Se rechazan los saltos de línea y los caracteres de control; en cmd, también `"` y `%`, y en PowerShell, `"`.
- Al enviar o copiar un comando destructivo (`git reset --hard`, `git clean -fd`, `rm -rf`, `docker system prune -a`…), un aviso modal muestra el texto exacto y pide confirmación. Se desactiva con el ajuste `devcommands.confirmDestructive`, que solo se puede cambiar en la configuración de usuario.
- Favoritos: una estrella junto a cada comando (o `Ctrl+D`/`Cmd+D` con el foco en él) lo marca o desmarca. Con al menos un favorito, la tarjeta "Favoritos" aparece la primera y abre la lista en el orden en que se marcaron. Se guardan en la extensión y se sincronizan entre equipos con Settings Sync.
- Recientes: los últimos 20 comandos escritos en la terminal, con los valores de sus parámetros, en una tarjeta "Recientes" tras "Favoritos". Enviar o copiar una entrada usa sus valores sin volver a pedirlos, escapados para el shell del momento (si alguno no vale en ese shell, se piden con el valor ya escrito); los destructivos siguen pidiendo confirmación. "Borrar historial" vacía la lista. Se guardan solo en este equipo, sin Settings Sync.
- Comandos propios: categorías y comandos en el ajuste de usuario `devcommands.customCommands`, con autocompletado y validación al escribirlo. Aparecen tras las categorías incluidas y funcionan igual (búsqueda, favoritos, recientes, parámetros y confirmación de los destructivos). Los textos pueden traducirse. Lo que no es válido se omite con el motivo en el registro y un aviso. El comando "DevCommands: Editar comandos propios" abre el ajuste con un ejemplo. Solo se leen de la configuración de usuario, nunca de un proyecto, y se sincronizan con Settings Sync.
- Detección del proyecto: las categorías del proyecto abierto aparecen primero, en una sección "En este proyecto", y el resto en "Todas". Solo se comprueba si existen `.git`, `package.json`, `pnpm-lock.yaml`, `package-lock.json`, `Dockerfile` o un archivo de Compose en la raíz de cada carpeta del workspace, sin leerlos. Se actualiza al crear o borrar esos archivos, y el ajuste `devcommands.detectProject` la desactiva.
- Buscador en la paleta: "DevCommands: Buscar comandos" busca entre todos los comandos sin abrir el panel, con la misma búsqueda que el panel. Con el cuadro vacío agrupa Favoritos, Recientes, las categorías del proyecto y el resto. Enter escribe el comando en la terminal sin ejecutarlo (con parámetros, confirmación de destructivos y registro en Recientes) y cada elemento tiene botones para copiar y marcar como favorito. Sin atajo por defecto.

### Changed

- Requiere VS Code 1.99 o posterior (antes, 1.90).
- La variante de cmd de "seguir un archivo" usa `Get-Content -LiteralPath` entre comillas simples.
- Nombre visible "DevCommands Guide" en el Marketplace y en Open VSX. El id sigue siendo `aguilardigital.devcommands`, así que se conservan favoritos, historial y ajustes; la vista y la categoría de la paleta siguen llamándose "DevCommands".
- Icono de la extensión: un libro abierto con `>_`. El icono de la barra de actividad no cambia.
- Licencia propietaria (todos los derechos reservados, uso gratuito) en lugar de MIT. Los componentes de terceros (React y codicons) mantienen sus licencias, recogidas en `ThirdPartyNotices.txt`.
- Primera versión estable: el paquete deja de marcarse como pre-release.
- README con capturas y un resumen de lo que ofrece la extensión.

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