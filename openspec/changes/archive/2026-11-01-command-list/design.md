# Design

## Context

- `buildCategorySummaries(categories, locale)` devuelve `{ id, title, icon, commandCount }` y `CommandsViewProvider` lo envía en `catalog` tras `init`. `buildExample(cmd, locale, shell)` y `effectiveCommand` ya existen y están testeados.
- El webview tiene un reducer puro (`navigation.ts`: `navigate`, `resolveView`, `nextIndex`), `CategoryList` (foco itinerante) y `CategoryScreen` (pantalla provisional con título, número de comandos, Atrás y Escape).
- `vscode.ts` llama a `acquireVsCodeApi()` una sola vez y solo expone `postMessage`. Los webview views se destruyen al ocultarse, porque no usamos `retainContextWhenHidden`; `getState()`/`setState()` sobrevive a eso y a recargar la ventana.
- Git tiene 3 comandos: `git.status` (safe), `git.new-branch` (safe, con el parámetro `branch`) y `git.reset-hard` (destructive). Ninguno define `shells` todavía.

## Goals / Non-Goals

**Goals:**
- Ver los comandos de una categoría con título, descripción, ejemplo y riesgo, y que la 1.4 solo tenga que añadir la acción.
- Que el usuario no pierda su sitio al ocultar la vista.
- Reutilizar el foco itinerante de las categorías en lugar de duplicarlo.

**Non-Goals:**
- Acciones sobre un comando (1.4 y 1.5), búsqueda (1.6), parámetros (2.2), detección del shell (2.1) y enlace a la documentación.
- `retainContextWhenHidden`: consume memoria y VS Code recomienda `setState`.

## Decisions

### D1. Resumen con comandos y shell por defecto
```ts
export interface CommandSummary { readonly id: string; readonly title: string; readonly description: string; readonly example: string; readonly risk: Risk }
export interface CategorySummary { readonly id: string; readonly title: string; readonly icon: string; readonly commands: readonly CommandSummary[] }
export function buildCategorySummaries(categories: readonly Category[], locale: Locale, shell: ShellId): CategorySummary[]
export function defaultShellFor(platform: string): ShellId // 'win32' -> 'powershell'; el resto -> 'bash'
```
- `example = buildExample(cmd, locale, shell)`.
- `commandCount` se elimina: el webview usa `commands.length`, así no hay dos fuentes para el mismo dato.
- `CommandsViewProvider` calcula `defaultShellFor(process.platform)` una vez. Es la regla provisional hasta la 2.1, que la sustituirá por el shell real de la terminal.
- *Por qué PowerShell en Windows:* es el shell por defecto del terminal de VS Code en Windows. El roadmap prueba Windows con PowerShell.

### D2. Navegación persistida
- `View` amplía sus campos:
  ```ts
  | { screen: 'categories'; focusCategoryId?: string }
  | { screen: 'category'; categoryId: string; focusCommandId?: string }
  ```
- Nuevas acciones: `{ type: 'focusCategory', categoryId }` y `{ type: 'focusCommand', commandId }`. Las listas las despachan en `onFocus`, de modo que la vista siempre sabe qué hay enfocado.
- `parseSavedView(value: unknown): View | undefined` es pura. Acepta solo objetos con `screen` conocido y campos de tipo `string`, sin claves extra (como `isWebviewMessage`). Con cualquier otra cosa devuelve `undefined`.
- `resolveView(view, categories)` recibe ahora `{ id, commands: { id }[] }[]`:
  - si la categoría no existe, devuelve la lista de categorías;
  - si `focusCommandId` no existe, lo quita, y la lista enfoca el primer comando;
  - si `focusCategoryId` no existe, lo quita.
- `App`:
  - el estado inicial es `parseSavedView(getState()) ?? initialView`;
  - al recibir `catalog` despacha `{ type: 'resolve', categories }`, que aplica `resolveView` una vez en el reducer. Así las acciones siguientes parten de la vista ya corregida;
  - un efecto llama a `setState(view)` con la vista ya resuelta cada vez que cambia, y solo cuando el catálogo ya ha llegado, para no sobrescribir lo guardado durante la carga.
- Foco al montar `CategoryScreen`:
  - si hay `focusCommandId` (restauración), el foco va a ese comando;
  - si no lo hay (apertura normal), va al título.

  Los efectos de foco solo se ejecutan al montar, y por eso actualizar `focus*` no roba el foco.

### D3. Foco itinerante reutilizable
- `useRovingFocus(length, initialIndex)` vive en `webview-ui/src/useRovingFocus.ts` y devuelve `{ current, setActive, itemRef(index), onKeyDown }`. Usa `nextIndex` (ya testeado).
- `CategoryList` pasa a usarlo, y `CommandList` también.

### D4. Fila de comando (`CommandList.tsx`)
- `<ul role="list" aria-label={t('commandsLabel', { category })}>`. Cada `<li>` contiene un `<div role="group" tabIndex={0|-1} aria-labelledby="…title …risk …desc …example">`.
- Todavía no es un `<button>`: no hay acción hasta la 1.4, y un botón que no hace nada confunde. La 1.4 lo convertirá en botón.
- Contenido:
  1. título (en negrita);
  2. etiqueta de riesgo, si la hay;
  3. descripción (`--vscode-descriptionForeground`);
  4. `<code>` con el ejemplo.
- Los ids se derivan del id del comando, saneado a `[A-Za-z0-9_-]`.

### D5. Aviso de riesgo (`RiskBadge.tsx`)
| risk | Icono | Color | en | es |
| --- | --- | --- | --- | --- |
| `caution` | `warning` | `--vscode-editorWarning-foreground` | Caution | Precaución |
| `destructive` | `error` | `--vscode-errorForeground` | Destructive | Destructivo |
- Borde de 1 px en `currentColor`, para que se distinga también en alto contraste. El texto siempre está visible, así que el riesgo no depende del color.

### D6. Estilo del ejemplo
- `font-family: var(--vscode-editor-font-family)` y `font-size: var(--vscode-editor-font-size)`.
- `background: var(--vscode-textCodeBlock-background)`.
- `white-space: pre-wrap; overflow-wrap: anywhere`: se ve completo en una barra lateral estrecha, sin scroll horizontal.

### D7. Textos (11 idiomas)
| Clave | en |
| --- | --- |
| `commandsLabel` | Commands in {category} |
| `riskCaution` | Caution |
| `riskDestructive` | Destructive |

Se elimina `categoryPlaceholder`.

### D8. Estado del webview (`vscode.ts`)
- `getState(): unknown` y `setState(state: View): void`. `vscode.ts` no interpreta el estado; eso lo hace `parseSavedView`.

### D9. Mensajes webview ↔ extensión
| Mensaje | Dirección | Forma | Cambio |
| --- | --- | --- | --- |
| `ready` | webview → extensión | `{ type: 'ready' }` | — |
| `init` | extensión → webview | `{ type: 'init', locale, version }` | — |
| `catalog` | extensión → webview | `{ type: 'catalog', categories: CategorySummary[] }` | `commandCount` → `commands: CommandSummary[]` |

## Risks / Trade-offs

- [El ejemplo puede no coincidir con el shell real (p. ej. Git Bash en Windows)] → Es provisional, está documentado y la 2.1 lo resuelve. Hoy ningún comando del catálogo define `shells`.
- [El mensaje `catalog` crece con los comandos] → Unos 75 comandos ocupan pocos KB. Si el catálogo crece mucho, se pedirán los comandos al abrir una categoría.
- [Un estado guardado por una versión anterior] → `parseSavedView` lo valida y `resolveView` corrige los ids que ya no existen.
- [`role="group"` con `aria-labelledby` puede anunciarse de forma distinta según el lector] → Se comprueba con el Narrador de Windows en la verificación con F5.

## Migration Plan

Sin datos de usuario persistentes fuera del estado del webview, que se valida. Rollback: revertir el squash merge.
