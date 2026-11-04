## Context

- **Catálogo:** `CatalogService` recibe un `Catalog` fijo en el constructor, lo ordena por `order`/`id` y crea un mapa por id. No hay forma de cambiarlo después.
  - La misma instancia se comparte con `FavoritesStore` y `HistoryStore`, mediante closures que llaman a `catalog.getCommand`, y con `CommandsViewProvider`.
- **Validación del catálogo incluido:** `catalog/schema.json` con Ajv solo en los tests (Ajv es una dependencia de desarrollo) y `checkCatalogRules` (`src/catalog/validate.ts`) para las reglas que el esquema no expresa: duplicados, prefijo e ids de placeholders. En runtime no se valida nada, porque el catálogo es de confianza.
- **Textos:** `localize(text, locale)` devuelve `text[locale] ?? text.en`. El tipo `LocalizedString` exige `en` y `es`.
- **Iconos:** el webview ya cambia un Codicon inexistente por un icono genérico (`resolveIcon`).
- **Webview:** solo usa lo que recibe en `catalog`. `resolve` conserva la vista si los ids existen; si la categoría abierta desaparece, vuelve a la lista. Los favoritos y recientes que no están en el catálogo ya se omiten.
- **Ajustes:** ya existe `devcommands.confirmDestructive`, con `scope: application` y `markdownDescription` traducida en `package.nls*.json`. La extensión se activa al abrir la vista (evento implícito) y no tiene comandos de paleta.

## Goals / Non-Goals

**Goals:**
- Que un comando propio sea, para todo el resto del código, un comando más del catálogo.
- Validar en runtime lo que escribe el usuario, sin nueva dependencia y sin que un error rompa la vista.
- Que nada de un repositorio clonado pueda añadir comandos.

**Non-Goals:**
- Formulario en la vista, `.devcommands.json` por proyecto y añadir comandos a categorías del catálogo.
- Ordenar las categorías propias entre las del catálogo (van siempre al final).
- Exportar o importar comandos (3.4).

## Decisions

### D1. Conversión y validación en `src/catalog/custom.ts`
`parseCustomCommands(value: unknown): { categories: Category[]; problems: CustomProblem[] }` es pura y no depende de `vscode`. `CustomProblem = { where: string; reason: CustomReason }`. `where` es, por ejemplo, `customCommands[0].commands[2] (deploy)`. `reason` es un código traducible en la extensión:
- `notArray`;
- `invalidCategory`;
- `duplicateCategory`;
- `emptyCategory`;
- `invalidCommand`;
- `duplicateCommand`;
- `invalidText`;
- `invalidRisk`;
- `controlChars`;
- `tooLong`;
- `undeclaredParam`;
- `unusedParam`;
- `duplicateParam`;
- `invalidShell`.

**Reglas:**
- `id` de categoría y de comando: `^[a-z0-9]+(-[a-z0-9]+)*$`, como máximo 50 caracteres.
- **Textos:** un string no vacío (recortado), de como máximo 200 caracteres (500 en `description`), o un objeto con al menos uno de los 11 idiomas, cada valor con las mismas reglas.
  - Se normalizan a `LocalizedString`. `en` toma `en ?? es ?? primero` y `es` toma `es ?? en ?? primero`, y se conservan los demás idiomas. Así `localize` aplica el orden activo → `en`, que con un texto simple da el mismo texto en todos los idiomas.
- **`tags`:** una lista de strings o un objeto con listas por idioma, normalizado igual. Una entrada no válida se ignora sin omitir el comando.
- **`command` y `shells.*`:** strings no vacíos de como máximo 1000 caracteres y sin caracteres de control (`/[\u0000-\u001f\u007f-\u009f  ]/`, la misma expresión que `escape.ts`). Un salto de línea ejecutaría lo escrito antes.
- **`shells`:** solo admite las claves `bash`, `zsh`, `powershell` y `cmd`.
- **`params`:** cada uno con `name` (`^[A-Za-z][A-Za-z0-9_]*$`), `label` y `placeholder` como textos.
- **Coherencia de placeholders y parámetros:** se reutiliza `checkCatalogRules` sobre una categoría de un solo comando, que ya informa de los no declarados, los no usados y los repetidos. Para no depender del texto de sus mensajes, se extrae la lógica de parámetros a `paramProblems(cmd)`, que devuelve códigos, y `checkCatalogRules` la usa para sus mensajes.
- **`risk`:** si falta, es `safe`; si no es uno de los tres valores, el comando no es válido.
- **`icon`:** si falta, es `terminal`. No se comprueba que el Codicon exista, porque lo resuelve el webview.
- **Campos desconocidos:** se ignoran en runtime. El esquema JSON del ajuste ya los marca al escribir.
- **Límites:** como máximo 50 categorías y 200 comandos en total. Lo que sobra se omite con `tooLong`.

**Ids internos:** la categoría es `custom-<id>` y el comando `custom-<id>.<id-del-comando>`. Así cumple la regla de prefijo del catálogo y nunca coincide con una categoría incluida.

Alternativa descartada: **Ajv en runtime.** Añadiría unos 120 KB y una dependencia de runtime, y los mensajes de error no serían traducibles ni por elemento.

### D2. `CatalogService` con categorías propias
`CatalogService` gana `setCustomCategories(categories: readonly Category[])`, que reemplaza las categorías propias y reconstruye el mapa por id:
- `getCategories()` devuelve las del catálogo ordenadas y, detrás, las propias en su orden;
- la instancia es la misma, así que las closures de favoritos e historial ven siempre el catálogo actual.

Se añade un evento ligero `onDidChange`, un `listeners` interno sin `vscode`, para que el proveedor reaccione.

**Regla del prefijo:** `checkCatalogRules` gana la comprobación de que ninguna categoría incluida empiece por `custom-`, con su test.

### D3. Lectura del ajuste y aviso en `extension.ts`
- **`loadCustom()`:**
  - lee `getConfiguration('devcommands').inspect('customCommands')?.globalValue`. Usar `globalValue` en lugar de `get` descarta cualquier valor de espacio de trabajo, aunque VS Code ya los ignora con `scope: application`;
  - llama a `parseCustomCommands` y a `catalog.setCustomCategories`;
  - registra cada problema con `log.warn('Comando propio omitido:', where, motivo)`.
- **Aviso:** si hay problemas y su lista serializada es distinta de la del último aviso, muestra `showWarningMessage(l10n('{0} custom commands or categories were skipped because they are not valid.'), 'Open Settings', 'Show Log')`.
  - "Open Settings" ejecuta el comando de edición (D5) sin añadir el ejemplo.
  - "Show Log" ejecuta `log.show()`.
- **Cuándo se llama:** en `activate` y en `workspace.onDidChangeConfiguration` si `affectsConfiguration('devcommands.customCommands')`.

### D4. Proveedor
`CommandsViewProvider` se suscribe a `catalog.onDidChange`. Si hay webview listo, envía `postCatalog(webview, shell)`, `postFavorites(webview)` y `postHistory(webview)`, en ese orden. El webview no cambia: `resolve` ya conserva la vista o vuelve a la lista.

### D5. Comando "DevCommands: Editar comandos propios"
- **Manifiesto:** `contributes.commands` con `devcommands.editCustomCommands`, título `%command.editCustomCommands%` y categoría `DevCommands`. VS Code activa la extensión al ejecutarlo (evento implícito `onCommand`).
- **Comportamiento:**
  - si `globalValue` no es una lista con elementos, escribe antes con `update(..., ConfigurationTarget.Global)` la categoría de ejemplo. Es `ejemplo`, con el título "Ejemplo" traducido, el icono `rocket` y un comando `saludar`: `echo ${mensaje}`, con el parámetro `mensaje` y su etiqueta y placeholder traducidos;
  - después ejecuta `workbench.action.openSettingsJson` con `{ revealSetting: { key: 'devcommands.customCommands', edit: true } }`.
- **Si `revealSetting` no se admite** en la versión mínima (1.99), se comprueba en F5. La alternativa es abrir `settings.json` con `workbench.action.openSettingsJson` sin argumentos.

### D6. Manifiesto y textos
- **`devcommands.customCommands`:**
  - `type: array`, `default: []`, `scope: application`;
  - `markdownDescription: %config.customCommands%`, con un ejemplo breve y el enlace al comando de edición;
  - esquema `items` completo, con `additionalProperties: false` en categoría, comando y parámetro, `pattern` en ids y nombres, `enum` en `risk` y `oneOf` string/objeto en los textos;
  - `defaultSnippets` para añadir una categoría y un comando con Ctrl+Space.
- **`package.nls*.json`:** `config.customCommands` y `command.editCustomCommands`, en los 11 idiomas.
- **`l10n/bundle.l10n.*.json`:** el aviso, los dos botones, los textos del ejemplo (título, descripción, etiqueta y placeholder) y un texto por cada código de motivo para el registro.

### D7. Tests
- **`test/unit/catalog/custom.test.ts`:**
  - valor no lista;
  - categoría mínima: icono `terminal`, riesgo `safe`, ids `custom-…`;
  - textos simples y por idioma, con el orden de fallback;
  - tags en lista y por idioma;
  - cada motivo de omisión: comando inválido junto a uno válido, categoría repetida, comando repetido, categoría vacía, salto de línea, ` `, plantilla de 1001 caracteres, placeholder sin declarar, parámetro sin usar, `shells` con clave desconocida y `risk` inválido;
  - límites de 50 categorías y 200 comandos.
- **`test/unit/catalog/CatalogService.test.ts`:**
  - `setCustomCategories` pone las propias al final;
  - `getCommand` encuentra un comando propio y deja de hacerlo al reemplazarlas;
  - `onDidChange` se dispara;
  - `buildCategorySummaries` incluye su ejemplo y su `searchText`.
- **`test/unit/catalog/validate.test.ts`:** la regla del prefijo `custom-`.
- **`test/unit/i18n/manifest.test.ts`:** las claves nuevas en los 11 `package.nls`, si el test ya recorre las claves.
- **Integración:**
  - con `customCommands` global de una categoría con un comando con parámetro, `onDidSendCatalog` incluye `custom-demo` al final;
  - `copyToClipboard('custom-demo.hola')`, con un comando sin parámetros, copia su texto;
  - se restaura el ajuste en `finally`.

## Risks / Trade-offs

- **[Un comando propio puede ser peligroso aunque se marque `safe`]** → Nunca se ejecuta: se escribe sin Enter, igual que el catálogo. Solo puede venir de la configuración de usuario, no de un repositorio.
- **[El esquema del ajuste y `parseCustomCommands` pueden divergir]** → Un test recorre el esquema de `package.json` y comprueba que los mismos ejemplos válidos e inválidos dan el mismo resultado con Ajv (dependencia de desarrollo) y con `parseCustomCommands`.
- **[Settings Sync lleva los comandos a equipos con otro shell]** → Las variantes `shells` y el escapado por shell ya lo resuelven, igual que en el catálogo.
- **[Un favorito o reciente de un comando propio borrado]** → Se omite al mostrarse y se limpia en el siguiente cambio, como con el catálogo.
- **[Muchos avisos mientras se escribe]** → El aviso solo aparece al guardar, que es cuando cambia la configuración, y no se repite si los problemas son los mismos.
