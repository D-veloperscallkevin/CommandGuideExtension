# Design

## Context

- `src/catalog/index.ts` exporta `bundledCatalog`, que hoy contiene solo Git (`icon: "git-branch"`, `order: 10`, 3 comandos). `CatalogService.getCategories()` ya ordena por `order` y después por `id`, y `localize()` hace fallback a `en`.
- `CommandsViewProvider` responde a `ready` con `init { locale, version }` y dispara `onDidReceiveReady`. Todavía no importa `CatalogService`, así que esbuild deja el catálogo fuera de `dist/extension.js`.
- `webview-ui/src/App.tsx` muestra el marcador de `webview-shell` con `useT`. Los diccionarios (`webview-ui/src/i18n/*.ts`) son `Record<clave, string>` con `{marcadores}`, y un test exige las mismas claves y marcadores en los 11 idiomas.
- La CSP permite `style-src` y `font-src` desde `webview.cspSource`, y `localResourceRoots` es `dist/webview`. Una fuente que Vite emita en `dist/webview/assets` carga sin tocar la CSP.
- No hay entorno DOM en los tests (Vitest corre en `node`), así que la lógica del webview que haya que testear tiene que ser pura.

## Goals / Non-Goals

**Goals:**
- Primera pantalla real de la vista, con teclado y ARIA completos.
- Que la 1.3 solo tenga que ampliar el mensaje `catalog` y rellenar la pantalla de categoría, sin rehacer la navegación.
- Plurales correctos en los 11 idiomas desde el primer texto con número.

**Non-Goals:**
- La lista de comandos, la búsqueda y la persistencia del estado (`setState`).
- Tests de componentes con DOM (jsdom o Testing Library). Se reconsiderarán si la UI crece. Por ahora, el comportamiento del DOM se comprueba a mano con F5.

## Decisions

### D1. Resumen de categorías (`buildCategorySummaries`)
En `src/catalog/CatalogService.ts`, función pura:
```ts
export interface CategorySummary { readonly id: string; readonly title: string; readonly icon: string; readonly commandCount: number }
export function buildCategorySummaries(categories: readonly Category[], locale: Locale): CategorySummary[]
```
- Recibe las categorías ya ordenadas (`service.getCategories()`) y aplica `localize` al título.
- *Por qué traducir en la extensión:* el webview no necesita conocer `LocalizedString` ni las reglas de fallback, y el mensaje solo lleva el idioma activo (lo exige la spec).

### D2. Mensaje `catalog`
```ts
type ExtensionMessage =
  | { type: 'init'; locale: Locale; version: string }
  | { type: 'catalog'; categories: readonly CategorySummary[] };
```
- `CommandsViewProvider` crea un `CatalogService` (constructor por defecto, `bundledCatalog`) y, al recibir `ready`, envía `init` y luego `catalog`. `postMessage` conserva el orden.
- El evento de pruebas pasa a ser `onDidSendCatalog` (se dispara tras enviar `catalog` y devuelve las categorías enviadas). Sustituye a `onDidReceiveReady`, porque el catálogo enviado implica que el `ready` llegó. El test de integración comprueba que la categoría `git` está.
- `CategorySummary` vive en `src/catalog/` y el protocolo lo importa como tipo. El webview sigue importando solo tipos.

### D3. Navegación (`webview-ui/src/navigation.ts`)
Reducer puro, sin React:
```ts
type View = { screen: 'categories'; focusCategoryId?: string } | { screen: 'category'; categoryId: string };
type Action = { type: 'open'; categoryId: string } | { type: 'back' };
export function navigate(view: View, action: Action): View
```
- `open` pasa a `category`. `back` vuelve a `categories` con `focusCategoryId` igual a la categoría que estaba abierta, y la lista usa ese valor para devolver el foco.
- Si llega un `catalog` en el que ya no está la categoría abierta, `App` vuelve a la lista (`resolveView(view, categories)`, también puro).
- Testeado con Vitest (`test/unit/webview/navigation.test.ts`).

### D4. Lista con foco itinerante (roving tabindex)
- `CategoryList.tsx`: `<ul role="list" aria-label={t('categoriesLabel')}>` con un `<li>` por categoría, y dentro un `<button>` con `tabIndex` 0 en la entrada activa y -1 en el resto.
- Teclado (en el `onKeyDown` del `<ul>`):
  - Flecha abajo y Flecha arriba: siguiente y anterior, sin dar la vuelta, como en las listas de VS Code;
  - Inicio y Fin: primera y última;
  - Enter y Espacio: los gestiona el propio `<button>` con `onClick`.
- El cálculo del índice siguiente es una función pura `nextIndex(current, key, length)` en `navigation.ts`, testeada.
- Nombre accesible: el texto visible del botón ya es "Git" + "3 commands". Se añade `aria-label={`${title}, ${count}`}` para que la coma separe las dos partes al leerse.
- `CategoryScreen.tsx`: `<h2 tabIndex={-1}>` recibe el foco al montarse, y el botón "Atrás" usa el Codicon `arrow-left` más el texto `t('back')`. Escape vuelve a la lista con un listener en `window` mientras la pantalla está montada, para que funcione aunque el foco esté en `<body>`.

### D5. Plurales en los diccionarios
- Una clave plural es un objeto con categorías de `Intl.PluralRules`:
  ```ts
  commandCount: { one: '{count} command', other: '{count} commands' }   // en
  commandCount: { one: '{count} команда', few: '{count} команды', many: '{count} команд', other: '{count} команды' } // ru
  commandCount: { other: '{count} 個のコマンド' }   // ja
  ```
- `Messages` pasa a ser `Record<clave, string | PluralForms>`, con `PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }`. `translate(locale, key, params)` usa `new Intl.PluralRules(intlLocale).select(params.count)` cuando el valor es un objeto, y recurre a `other` si falta la categoría.
- `intlLocale` traduce los ids propios a BCP 47 (`pt-br` → `pt-BR`, `zh-cn` → `zh-CN`, `zh-tw` → `zh-TW`).
- El test de diccionarios se amplía. Para cada clave plural y cada idioma, el objeto debe tener exactamente las categorías que devuelve `new Intl.PluralRules(intlLocale).resolvedOptions().pluralCategories`. Los marcadores tienen que coincidir en todas las formas, y una clave es plural en todos los idiomas o en ninguno.

### D6. Codicons
- `@vscode/codicons` (versión exacta) como dependencia de `webview-ui`. `main.tsx` importa `@vscode/codicons/dist/codicon.css`, y Vite copia la fuente `codicon.ttf` a `dist/webview/assets/` con nombre fijo.
- `Icon.tsx` pinta `<span className={`codicon codicon-${name}`} aria-hidden="true">`. Para el fallback, `webview-ui/src/codicons.ts` exporta un `Set` de nombres generado a partir de `@vscode/codicons/dist/codicon.css`, que se lee en build con `import css from '…?raw'` y se extrae con una regex de `.codicon-(name):before`. Si el nombre no está, se usa `symbol-misc`.
- Test (`test/unit/catalog/icons.test.ts`): cada `icon` del catálogo empaquetado existe en `codicon.css`. El test lee el CSS directamente de `webview-ui/node_modules/@vscode/codicons/dist/codicon.css`.
- *Alternativa descartada:* SVG sueltos por icono. Habría que copiar o elegir cada SVG, y la fuente es la forma estándar en los webviews de VS Code.

### D7. Estilos de tema
- Entradas: `color: var(--vscode-foreground)` y `background: transparent`.
  - Hover: `--vscode-list-hoverBackground` y `--vscode-list-hoverForeground`.
  - Foco: `outline: 1px solid var(--vscode-list-focusOutline, var(--vscode-focusBorder))`, más `--vscode-list-focusBackground`.
  - Alto contraste: el `outline` usa `--vscode-contrastActiveBorder` si existe.
- El número de comandos usa `--vscode-descriptionForeground` y el icono hereda el color del texto.
- Altura de fila de 22–28 px, como las listas del explorador. Diseño en una columna, apto para la barra lateral estrecha.

### D8. Textos nuevos (11 idiomas)
| Clave | en |
| --- | --- |
| `loading` | Loading… (ya existe) |
| `categoriesLabel` | Command categories |
| `commandCount` | { one: '{count} command', other: '{count} commands' } |
| `emptyCatalog` | No categories available. |
| `back` | Back |
| `categoryPlaceholder` | The command list for this category is coming soon. |

Se eliminan `comingSoon` y `version`. El marcador desaparece, y la versión sigue llegando en `init` para usos futuros.

### D9. Mensajes webview ↔ extensión
| Mensaje | Dirección | Forma | Respuesta |
| --- | --- | --- | --- |
| `ready` | webview → extensión | `{ type: 'ready' }` | `init` + `catalog` |
| `init` | extensión → webview | `{ type: 'init', locale, version }` | — |
| `catalog` | extensión → webview | `{ type: 'catalog', categories: CategorySummary[] }` | — |

## Risks / Trade-offs

- [Sin tests de DOM, el roving tabindex y el foco se verifican solo a mano] → La lógica (índices y navegación) es pura y está testeada. La tarea de F5 detalla las comprobaciones de teclado.
- [La fuente de Codicons añade ~150 KB] → El presupuesto es de 2 MB y el `.vsix` actual ronda 250 KB.
- [Importar el CSS con `?raw` duplica unos KB del CSS en el bundle] → Se acepta. Si molesta, la lista de nombres se genera en un paso de build.
- [Plurales generados para ru, ja, ko o zh sin revisión nativa] → El test garantiza que estén las categorías correctas. El texto queda abierto a correcciones, como el resto de traducciones.

## Migration Plan

Sin datos de usuario. Rollback: revertir el squash merge.
