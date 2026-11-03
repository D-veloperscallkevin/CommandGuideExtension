## Context

- **Lista de comandos:** el webview tiene una sola `CommandList` que usan la pantalla de una categoría y la búsqueda. Cada comando es un botón (enviar) con un botón secundario de copiar:
  - posicionado a la derecha;
  - oculto salvo con hover o foco;
  - `tabIndex={-1}`, con `onMouseDown` que evita el cambio de foco;
  - atajo `Ctrl+C` en el `onKeyDown` del botón principal;
  - `aria-keyshortcuts`.
- **Navegación:** `navigation.ts` es lógica pura con `View = categories | category`. Se guarda con `setState`, se valida con `parseSavedView` y se ajusta al catálogo con `resolveView`.
- **Persistencia:** no hay nada persistente en la extensión. El estado del webview solo guarda la vista.
- **Ids del catálogo:** `id` de categoría con el patrón `^[a-z0-9]+(-[a-z0-9]+)*$`, sin espacio reservado para un pseudo-id. Las categorías propias de 2.6 seguirán el mismo patrón.
- **Codicons:** se usan completos (`codiconNames` sale del CSS del paquete), así que `star-empty` y `star-full` están disponibles.

## Goals / Non-Goals

**Goals:**
- Una sola fuente de verdad de los favoritos, en la extensión, que el webview recibe entera.
- Reutilizar `CommandList` en la pantalla nueva, sin duplicar la lógica de foco, copia y riesgo.
- Que la lógica nueva (almacén, protocolo, navegación) se pruebe con Vitest.

**Non-Goals:**
- Reordenar los favoritos a mano o agruparlos.
- Favoritos por proyecto.
- Exportarlos o importarlos (3.4).
- Favoritos de comandos propios (2.6): cuando existan, sus ids deberán aceptarse igual.

## Decisions

### D1. `FavoritesStore` en la extensión
`src/favorites/FavoritesStore.ts` no importa `vscode`. Recibe:
- un `Memento` mínimo (`get(key)`, `update(key, value): Thenable<void>`), que en la extensión es `context.globalState`;
- `exists(id): boolean`, que pregunta al catálogo.

Clave: `favorites`. Métodos:
- `list(): string[]`: lee la lista guardada; si no es un array de strings, la trata como `[]`. Quita duplicados y filtra con `exists`, sin escribir;
- `toggle(id): Promise<string[] | undefined>`:
  - si `exists(id)` es falso, devuelve `undefined` sin escribir;
  - si no, parte de `list()` (así también limpia los ids desaparecidos), quita o añade al final, guarda con `update` y devuelve la lista nueva.

`extension.ts` llama a `context.globalState.setKeysForSync(['favorites'])`.

Alternativas descartadas:
- **`setState` del webview:** no se sincroniza y se pierde si se cierra la vista con `retainContextWhenHidden` desactivado.
- **Un ajuste en `settings.json`:** ensucia la configuración del usuario con datos que no son preferencias.

### D2. Protocolo
- Webview → extensión: `{ type: 'toggleFavorite', commandId }`, validado con el mismo `isCommandId` que `sendToTerminal`.
- Extensión → webview: `{ type: 'favorites', commandIds: readonly string[] }`.
- El proveedor envía `favorites` después de `catalog` en cada `ready`, y tras cada `toggle` correcto. Si el id no existe, registra `log.warn` y no responde.

Un reenvío de `catalog` por cambio de shell no reenvía `favorites`, porque los ids no dependen del shell.

### D3. Estado en el webview
`App` guarda `favorites: readonly string[] | null`; `null` hasta el primer mensaje. Con el catálogo, construye:
- `favoriteIds: ReadonlySet<string>`, para la estrella;
- `favoriteCommands: ListCommand[]`, en el orden de `favorites`, con `categoryTitle`, y omitiendo ids que no estén en el catálogo.

El anuncio de la estrella se deriva del cambio. Al recibir `favorites`, `App` lo compara con la lista anterior, que guarda en un `ref` fuera del estado de React. Si entra o sale exactamente un id, fija `starred = { commandId, added, seq }`, igual que `copied`, y lo borra a los 2 segundos. Una región viva de `CommandList` anuncia "Añadido a favoritos" o "Quitado de favoritos". El primer `favorites` tras `ready` no tiene lista anterior con la que comparar, así que no anuncia nada.

`starred` se fija 150 ms después de recibir `favorites`, y la región es `aria-atomic`. En la prueba con F5, el lector de pantalla no anunciaba el texto cuando la región cambiaba en el mismo render que el estado pulsado de la estrella y la tarjeta, aunque el DOM sí cambiaba. Publicado como un cambio aparte, el anuncio no se descarta.

Hasta recibir el primer `favorites`, la vista muestra el indicador de carga igual que sin catálogo, para que la pantalla de favoritos restaurada no se monte con una lista vacía.

### D4. Navegación: pantalla `favorites`
- `View` gana `{ screen: 'favorites'; focusCommandId?: string }`.
- Acciones nuevas: `openFavorites`. `back` desde `favorites` vuelve a `{ screen: 'categories', focusCategoryId: FAVORITES_CARD_ID }`.
- `FAVORITES_CARD_ID = '@favorites'`: no puede coincidir con un id del catálogo porque el patrón no admite `@`.
- `parseSavedView` acepta la forma nueva.
- `resolveView`:
  - deja la pantalla `favorites` como está; si el comando con foco ya no existe en el catálogo, quita el foco;
  - si `focusCategoryId` es `@favorites`, lo conserva aunque no haya favoritos. `CategoryList` enfoca la primera entrada si no encuentra ese id, que ya es su comportamiento con `Math.max(0, findIndex)`.

Se descartó usar `{ screen: 'category', categoryId: 'favorites' }`, porque colisionaría con una categoría real o propia llamada `favorites`.

### D5. Pantalla y tarjeta
- **`CategoryList`** recibe `favoritesCount`. Si es mayor que 0, pinta primero una entrada con el icono `star-full`, el título `t('favorites')` y `t('commandCount')`. Su `onFocus` y su `onClick` usan `FAVORITES_CARD_ID`, y el foco itinerante cuenta `categories.length + 1`.
- **`FavoritesScreen.tsx`** sigue la estructura de `CategoryScreen` (Atrás, Escape, título con foco al abrir, restauración) y la lista con `categoryTitle`.

  Para que un comando desmarcado siga hasta salir, la pantalla congela al montarse la lista de ids que muestra (`useState(() => ids)`) y le añade los que se marquen después. La estrella refleja `favoriteIds` en vivo. Sin comandos, muestra `t('noFavorites')` y el control para volver.

### D6. Estrella y atajo en `CommandList`
- **Props nuevas:** `favoriteIds` y `starred`.
- **Botón de estrella:** va a la izquierda del de copiar, con `aria-pressed`, `aria-label={t('favorite')}` y el tooltip `t('favorite') + ' (Ctrl+D)'`. Igual que el de copiar, lleva `tabIndex={-1}` y `onMouseDown` con `preventDefault`. El icono es `star-full` si es favorito y `star-empty` si no.
- **CSS:** visible con hover o foco, y siempre si es favorito (clase `.favorite`). El padding derecho del comando se amplía para los dos botones.
- **Atajo:** en el `onKeyDown` del botón principal, `Ctrl+D` o `Cmd+D` sin Alt ni Shift ejecuta `preventDefault()` y `toggleFavorite`. `aria-keyshortcuts` pasa a `"Control+C Control+D"` (`Meta+…` en macOS).

  `Ctrl+D` llega al webview si el foco está dentro, igual que `Ctrl+C`; se comprueba en F5. Si VS Code lo interceptara, el atajo se cambiaría antes de cerrar.

### D7. Textos del webview
Claves nuevas en `en.ts` y en los otros 10 diccionarios:
- `favorites`: "Favorites";
- `favorite`: "Favorite", el nombre del botón;
- `addedToFavorites`: "Added to favorites";
- `removedFromFavorites`: "Removed from favorites";
- `favoritesLabel`: "Favorite commands", el nombre de la lista;
- `noFavorites`: "No favorites yet. Use the star next to a command to add it."

El test de diccionarios exige que estén las claves en los 11.

### D8. Tests
- **`test/unit/favorites/FavoritesStore.test.ts`** (incluir `src/favorites/**` en el tsconfig de tests), con un `Memento` falso:
  - `list` vacío;
  - valor guardado corrupto;
  - duplicados;
  - ids inexistentes filtrados;
  - `toggle` que añade al final, quita, rechaza un id inexistente sin escribir y limpia los ids desaparecidos al guardar.
- **`test/unit/messaging/protocol.test.ts`:** `toggleFavorite` válido, sin `commandId`, con campos de más y con un id demasiado largo.
- **`test/unit/webview/navigation.test.ts`:**
  - `openFavorites` y `back`, con el foco en `@favorites`;
  - `focusCommand` en `favorites`;
  - `parseSavedView` con la forma nueva y con formas inválidas;
  - `resolveView` con un comando desaparecido.
- **Integración:** la API expone `toggleFavorite(id)` y `onDidSendFavorites`. Alternar `git.status` emite `['git.status']` y volver a alternarlo emite `[]`, de modo que el test deja el almacén como estaba.

## Risks / Trade-offs

- **[`Ctrl+D` podría llegar a VS Code y no al webview]** → Se comprueba en F5 (tarea manual). La alternativa preparada es `Alt+D`, sin cambios en el diseño.
- **[La sincronización mezcla favoritos de equipos con catálogos distintos]** → Los ids desconocidos se ignoran al mostrar y se limpian solo al cambiar la lista; no hay error.
- **[Lista congelada en la pantalla de favoritos]** → Si se marca un favorito desde otro sitio mientras la pantalla está abierta (no hay otro sitio visible a la vez), se añade al final; nunca se quita sin salir.
- **[Dos botones flotantes estrechan el espacio del título]** → El padding derecho se amplía para los dos botones y se revisa en F5 con la vista estrecha que el título y la etiqueta de riesgo no queden debajo de ellos.
