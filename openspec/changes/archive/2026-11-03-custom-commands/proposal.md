## Why

El catálogo incluido cubre comandos generales, pero cada persona repite comandos propios: scripts de despliegue, accesos a servidores, comandos de su empresa. Hoy no hay forma de añadirlos. Fase 2 (v1), punto 2.6 del roadmap: "Comandos y categorías propios, validados con las mismas reglas del catálogo". Resuelve además la decisión pendiente del roadmap: se guardan en `settings.json` de usuario.

## What Changes

- **Ajuste `devcommands.customCommands`:**
  - es una lista de categorías propias, cada una con sus comandos;
  - solo se puede definir en la configuración de usuario (scope `application`), no en la de un proyecto, y se sincroniza con Settings Sync;
  - VS Code lo autocompleta y lo valida mientras se escribe, gracias a un esquema JSON en `contributes.configuration`.
- **Formato:**
  - **Por categoría:** `id`, `title`, `icon` (opcional) y `commands`.
  - **Por comando:** `id`, `title` y `command` obligatorios, y como opcionales `description`, `params`, `risk` (por defecto `safe`), `shells` y `tags`.
  - **Textos:** un texto simple o un objeto por idioma.
- **Validación:**
  - las mismas reglas del catálogo: ids en kebab-case, parámetros declarados y usados, sin repetidos y un `risk` válido;
  - además, las plantillas no pueden tener saltos de línea ni caracteres de control, que ejecutarían el comando al escribirlo;
  - un comando o una categoría no válidos se ignoran sin afectar al resto. El motivo queda en el registro y aparece un aviso con botones para abrir la configuración o el registro.
- **Integración:**
  - las categorías propias aparecen después de las del catálogo, en el orden del ajuste;
  - los ids internos llevan el prefijo `custom-`, que el catálogo incluido no puede usar;
  - la búsqueda, los favoritos, los recientes, los parámetros y la confirmación de los destructivos funcionan igual que con el catálogo.
- **Recarga en vivo:** al guardar el ajuste, la vista recibe el catálogo, los favoritos y el historial nuevos sin recargar VS Code y conserva la pantalla.
- **Comando "DevCommands: Editar comandos propios":** abre `settings.json` en el ajuste. Si está vacío, añade antes una categoría de ejemplo.
- **Textos:** los nuevos de la extensión, en los 11 idiomas.
- **Fuera de este change:** el formulario en la vista, añadir comandos a categorías del catálogo y un archivo `.devcommands.json` por proyecto.

## Capabilities

### New Capabilities
- `custom-commands`: definición, validación, integración, recarga y edición de los comandos y categorías propios del usuario.

### Modified Capabilities
- `command-catalog`: los ids del catálogo incluido no pueden empezar por `custom-`, que queda reservado para los comandos propios.
- `webview-messaging`: `catalog` también se reenvía cuando cambian los comandos propios, seguido de `favorites` e `history`.

## Impact

- **Extensión:**
  - nuevo `src/catalog/custom.ts`, que convierte y valida el ajuste en categorías del catálogo sin depender de `vscode`;
  - `CatalogService` admite categorías propias reemplazables;
  - `CommandsViewProvider` reenvía la vista al cambiar el ajuste;
  - `extension.ts` lee el ajuste, escucha `onDidChangeConfiguration`, muestra el aviso y registra el comando de edición.
- **Manifiesto:**
  - `package.json` declara el ajuste con su esquema y el comando;
  - `package.nls*.json` y `l10n/bundle.l10n.*.json`, en 11 idiomas.
- **Webview:** sin cambios. Ya muestra un icono genérico si el icono no existe.
- **Dependencias:** ninguna nueva de runtime; la validación se escribe a mano.
- **Pruebas:** unitarias de la conversión y validación, de los ids, de la mezcla con el catálogo y de la regla del prefijo; integración de la recarga y del envío de un comando propio.
- **Docs:** README, CHANGELOG y ROADMAP, que cierra la pregunta abierta.
