## 1. Conversión, validación y catálogo (lógica pura)

- [x] 1.1 Extraer de `checkCatalogRules` la comprobación de parámetros a `paramProblems(cmd)` (códigos `undeclaredParam`, `unusedParam`, `duplicateParam`, con el nombre). `checkCatalogRules` la usa para sus mensajes sin cambiarlos y gana la regla del prefijo reservado `custom-` (D2). Tests en `test/unit/catalog/validate.test.ts`. Verificar: `pnpm run test:unit`, con los tests existentes del catálogo en verde.
- [x] 1.2 Crear `src/catalog/custom.ts` con `parseCustomCommands` (D1). Tests en `test/unit/catalog/custom.test.ts` con los casos de D7. Verificar: `pnpm run test:unit`.
- [x] 1.3 `CatalogService.setCustomCategories` y `onDidChange` (D2). Tests en `test/unit/catalog/CatalogService.test.ts` (D7). Verificar: `pnpm run test:unit`.

## 2. Manifiesto y textos

- [x] 2.1 `package.json` (D5, D6):
  - el ajuste `devcommands.customCommands` con su esquema completo, `scope: application` y `defaultSnippets`;
  - el comando `devcommands.editCustomCommands` en `contributes.commands`.
- [x] 2.2 Textos (D6):
  - `config.customCommands` y `command.editCustomCommands` en los 11 `package.nls*.json`;
  - en `l10n/bundle.l10n.*.json` (10 idiomas, ya que `en` es la clave): el aviso, los botones, los textos del ejemplo y un texto por motivo.

  Verificar: `pnpm run test:unit` (tests de manifiesto e i18n).
- [x] 2.3 Test de coherencia entre el esquema del ajuste y `parseCustomCommands` con Ajv: los mismos ejemplos válidos e inválidos dan el mismo resultado. Verificar: `pnpm run test:unit`.

## 3. Integración en la extensión

- [x] 3.1 `extension.ts` (D3, D5):
  - `loadCustom()` en `activate` y en `onDidChangeConfiguration`, con los mensajes en el registro y el aviso sin repetir;
  - registro de `devcommands.editCustomCommands`, con el ejemplo si está vacío y `openSettingsJson` con `revealSetting`.
- [x] 3.2 `CommandsViewProvider` (D4): al dispararse `catalog.onDidChange`, reenvía `catalog`, `favorites` e `history` al webview listo.
- [x] 3.3 Tests de integración en `src/test/extension.test.ts`:
  - con una categoría propia en el ajuste global, `onDidSendCatalog` la incluye al final como `custom-demo`;
  - copiar `custom-demo.hola` copia su texto;
  - se restaura el ajuste en `finally`.

  Verificar: `pnpm run verify`.

## 4. Documentación

- [x] 4.1 Documentación:
  - **README:** una sección "Custom commands" con el formato, un ejemplo, el comando de edición, el ámbito de usuario y Settings Sync;
  - **CHANGELOG:** en `[Unreleased]` → Added;
  - **ROADMAP:** 2.6 ✅, la pregunta abierta sobre dónde guardarlos resuelta como `settings.json` de usuario, y el checkbox.

## 5. Comprobación manual

- [x] 5.1 F5 en Windows. Herramientas: la ventana de F5 (Extension Development Host, la ventana de VS Code que abre F5 con la extensión cargada desde el código) y la **paleta de comandos** (`Ctrl+Shift+P`, el buscador de comandos de VS Code). Comprobar:
  - **Editar:** "DevCommands: Editar comandos propios" con el ajuste vacío abre `settings.json` en el ajuste con la categoría "Ejemplo", y la vista la muestra al final sin recargar.
  - **Autocompletado:** dentro del ajuste, `Ctrl+Space` propone los campos, y un `risk` no válido se subraya en rojo.
  - **Uso:** enviar el comando de ejemplo pide el mensaje y lo escribe sin ejecutarlo; copiar, buscar, marcar como favorito y "Recientes" funcionan con él.
  - **Error:** un comando con `"command": "ssh ${host}"` sin `params` no aparece y sale el aviso; "Ver registro" muestra el motivo y "Abrir configuración" vuelve al ajuste.
  - **Recarga:** con la categoría propia abierta, quitarla del ajuste y guardar devuelve la vista a la lista.
  - **Proyecto:** el ajuste en `.vscode/settings.json` de una carpeta abierta no añade nada.
  - **Shell:** un comando con `shells.powershell` muestra esa variante en PowerShell y la de `command` en Git Bash.

## 6. Cierre

- [x] 6.1 Dejar en verde `pnpm run verify` y `openspec validate custom-commands --strict`. Hacer `/opsx:archive` antes de abrir el PR a `develop`.
