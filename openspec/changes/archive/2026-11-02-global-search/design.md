# Design

## Context

- `buildCategorySummaries(categories, locale, shell)` en `CatalogService.ts` construye el mensaje `catalog`: un `CommandSummary` por comando con `{ id, title, description, example, risk }`, ya traducidos. Los tags y los otros idiomas no salen de la extensión, y la spec `webview-messaging` lo prohíbe expresamente.
- El webview solo importa **tipos** de `src/` (`import type`). Vite compila `webview-ui/src`, y `tsconfig.app.json` incluye solo `src`.
- La navegación es un reducer puro (`navigation.ts`):
  - `View` = `categories { focusCategoryId? }` | `category { categoryId, focusCommandId? }`;
  - `parseSavedView` valida el estado guardado;
  - `resolveView` lo ajusta al catálogo recibido.
- `CommandList` ya resuelve la fila de comando con foco itinerante, el envío a la terminal, la copia (botón y `Ctrl+C`) y la región viva de "Copiado". Recibe `categoryTitle` solo para el nombre accesible de la lista.
- `CategoryScreen` escucha Escape en `window` para volver atrás. En la pantalla inicial no hay ningún manejador de Escape.

## Goals / Non-Goals

**Goals:**
- Filtrar al instante, sin ir a la extensión en cada tecla.
- Una sola implementación de la búsqueda, reutilizable por el Quick Pick (2.8) en la extensión.
- Reutilizar `CommandList`: los resultados se comportan exactamente como una categoría.

**Non-Goals:**
- Índices invertidos, puntuación difusa o resaltado. Con unos 75 comandos (1.7), recorrerlos todos en cada tecla cuesta microsegundos.
- Búsqueda dentro de la pantalla de una categoría.

## Decisions

### D1. `searchText` precalculado en la extensión
- `CommandSummary` añade `readonly searchText: string`. `buildCategorySummaries` lo construye con `buildSearchText` (D2) a partir de:
  - el título, la descripción y los tags del comando en `en`, `es` y `locale`, sin duplicados;
  - el título de la categoría en esos mismos idiomas;
  - el ejemplo ya resuelto (`buildExample`).
- *Por qué en la extensión:* solo ella tiene el catálogo completo con todos los idiomas. Así el webview recibe un único texto ya normalizado en lugar de los campos originales de cada idioma, que la spec sigue prohibiendo.
- *Alternativa descartada: buscar en la extensión con mensajes `search` y `searchResults`.* Supone ir y volver en cada tecla, añade más protocolo y más validación, y hay que descartar las respuestas que lleguen fuera de orden. No aporta nada con un catálogo tan pequeño.
- *Alternativa descartada: enviar los tags y los textos en los dos idiomas tal cual.* Duplica casi todo el mensaje y rompe la regla de la spec sin ganar nada, porque la búsqueda solo necesita el texto normalizado.
- Tamaño: unos 400 caracteres por comando, unos 30 KB con 75 comandos. Es aceptable para un mensaje que se envía una vez por `ready`.

### D2. Módulo puro `src/catalog/search.ts`
```ts
/** Minúsculas, sin diacríticos (NFD + quitar \p{M}) y con los espacios colapsados. */
export function normalize(text: string): string
/** Une las partes normalizadas, sin vacías ni repetidas, separadas por " · ". */
export function buildSearchText(parts: readonly string[]): string
/** Palabras de la búsqueda normalizada; [] si solo hay espacios. */
export function queryWords(query: string): string[]
export interface Searchable { readonly title: string; readonly searchText: string }
/** Coincidencias: primero las que tienen todas las palabras en `normalize(title)`; orden estable. */
export function search<T extends Searchable>(items: readonly T[], query: string): T[]
```
- Este módulo no importa nada, ni `vscode` ni Node, así que lo pueden importar la extensión, el webview y Vitest.
- El separador ` · ` evita que una palabra coincida al juntar el final de un campo con el principio del siguiente (por ejemplo, el final del título con el principio de la descripción).
- `normalize` aplica `normalize('NFD')`, quita solo los diacríticos combinantes U+0300–U+036F y vuelve a componer con `normalize('NFC')`.
  - *Ajuste al implementar:* la primera versión quitaba todas las marcas (`\p{M}`), y el test vio que eso convertía el japonés ブ en フ, porque también borraba el dakuten.
  - Con el rango limitado, las tildes, la diéresis, la ñ y la ё rusa se normalizan, y el japonés y el coreano no cambian.
  - Las palabras CJK no llevan espacios, así que una búsqueda en japonés funciona como subcadena; es aceptable.

### D3. El webview importa código de ejecución de `src/`
- `webview-ui/src/search` importa `search` de `../../src/catalog/search` (sin `import type`). Vite compila archivos de fuera de `root` sin configuración adicional, porque `server.fs.allow` solo afecta al servidor de desarrollo.
- Para que `tsc -b` del webview lo compruebe con las opciones del webview, `tsconfig.app.json` añade `"../src/catalog/search.ts"` a `include`.
- Un test unitario comprueba que `search.ts` no tiene `import` (protección para que nunca arrastre `vscode` ni Node al bundle del webview).

### D4. Navegación: la búsqueda forma parte de la pantalla inicial
```ts
| { readonly screen: 'categories'; readonly focusCategoryId?: string; readonly query?: string; readonly focusCommandId?: string }
```
- Acciones nuevas:
  - `search { query }` guarda `query` y quita `focusCommandId`; con `query` vacía, quita los dos;
  - si `query` solo tiene espacios, se guarda tal cual para no borrar lo que el usuario escribe, pero cuenta como búsqueda vacía: se ve la lista de categorías y `focusCommand` no se aplica;
  - `focusCommand` también se aplica en `categories` cuando hay una `query`.
- `parseSavedView` acepta las claves opcionales `query` y `focusCommandId` en `categories`, todas string.
- `resolveView`: si el `focusCommandId` de `categories` no existe en el catálogo, se quita y se conserva `query`.
- *Por qué no una pantalla `search` aparte:* la búsqueda vive encima de la lista de categorías y el campo es el mismo, así que es un estado de la pantalla inicial. Abrir una categoría y volver deja la búsqueda tal cual, porque `back` solo afecta a `category`.
- Al abrir una categoría desde la pantalla inicial con una búsqueda activa, `open` crea la vista `category` y la búsqueda se pierde. Esto no puede pasar desde los resultados, porque son comandos, no categorías.

### D5. Componentes del webview
- **`SearchBox.tsx`:**
  - `<input type="search">` con `aria-label={t('searchLabel')}`, `placeholder={t('searchPlaceholder')}` y `aria-controls` apuntando a la lista de resultados;
  - el valor es `view.query ?? ''`, y `onChange` despacha `search`;
  - Flecha abajo llama a `onArrowDown()` con `preventDefault`;
  - Escape no se maneja en el campo sino en `App`: mientras el campo tiene texto, un listener de `keydown` en `window` (fase de captura, como el Escape de `CategoryScreen`) hace `preventDefault`, despacha `search('')` y enfoca el campo. Así funciona también con el foco en un resultado, que se desmonta al vaciar la búsqueda. Con el campo vacío no hace nada. Ajuste tras la prueba F5: en la primera versión solo había un `onKeyDown` en el campo y Escape no vaciaba la búsqueda.
- **`SearchResults.tsx`:** aplana los comandos de todas las categorías como `{ ...command, categoryTitle }`, llama a `search(items, query)` con `useMemo` y muestra:
  - un `<p className="muted" role="status" aria-live="polite">` con `t('resultCount', { count })` (plural) o `t('noResults')`;
  - `CommandList` con los resultados, salvo que no haya ninguno.
- **`CommandList`:**
  - acepta en cada comando un `categoryTitle?` opcional; si viene, lo pinta como `<span className="command-category">` en el encabezado y lo añade al `aria-labelledby`, después del título;
  - `listLabel` sustituye a `categoryTitle` como nombre de la lista (`t('commandsLabel', …)` en una categoría y `t('searchResultsLabel')` en los resultados).
- **Del campo al primer resultado:** `CommandList` expone `focusFirst()` con `useImperativeHandle` (React 19 acepta `ref` como prop). `SearchResults` reenvía ese `ref`.
- **`App.tsx`:**
  - en `categories`, pinta `SearchBox` y después `SearchResults` si `queryWords(query)` no está vacío, o `CategoryList` si lo está;
  - al restaurar con `focusCommandId`, `CommandList` lo enfoca (`autoFocus`), igual que en una categoría;
  - `copied` llega igual a los resultados.

### D6. Textos (11 idiomas)
| Clave | en | es |
| --- | --- | --- |
| `searchLabel` | Search commands | Buscar comandos |
| `searchPlaceholder` | Search in all categories | Buscar en todas las categorías |
| `searchResultsLabel` | Search results | Resultados de la búsqueda |
| `resultCount` (plural) | `{ one: '{count} result', other: '{count} results' }` | `{ one: '{count} resultado', many: '{count} de resultados', other: '{count} resultados' }` |
| `noResults` | No commands match your search. | Ningún comando coincide con la búsqueda. |

Las formas plurales de cada idioma siguen `Intl.PluralRules`, y el test de diccionarios ya lo comprueba.

### D7. Mensajes webview ↔ extensión
| Mensaje | Dirección | Cambio |
| --- | --- | --- |
| `catalog` | extensión → webview | cada comando añade `searchText` |
| `ready`, `init`, `sendToTerminal`, `copyToClipboard`, `copied` | — | sin cambios |

Sin dependencias de runtime nuevas.

## Risks / Trade-offs

- [El bundle del webview arrastra código de la extensión si `search.ts` importa algo algún día] → El test de D3 falla si `search.ts` tiene cualquier `import`.
- [El campo pierde caracteres al escribir rápido si el estado va por el reducer y `setState`] → Es un input controlado con `useReducer`, que es síncrono; `setState` del webview es barato. Se comprueba con F5.
- [Las coincidencias por subcadena dan falsos positivos ("rama" coincide con "programa")] → Es aceptable en el MVP: es predecible y la lista es corta.
- [Escape en el campo vacío no hace nada, mientras que en una categoría vuelve atrás] → Es coherente: en la pantalla inicial no hay "atrás".
- [Anunciar el número de resultados en cada tecla mete ruido] → Con `aria-live="polite"`, el lector agrupa los cambios y lee el último. Con F5 se valida que no resulte molesto.

## Migration Plan

Un estado guardado antiguo (sin `query`) sigue siendo válido. No hay datos ni configuración nuevos. Rollback: revertir el squash merge.
