## Why

Con 108 comandos en 6 categorías, el usuario vuelve una y otra vez a los mismos pocos, y hoy tiene que buscarlos o abrir su categoría cada vez. Los favoritos son parte del diferenciador de la v1 en el ROADMAP (fase 2, change 2.4): una estrella por comando y un acceso directo al inicio de la vista.

## What Changes

- **Estrella en cada comando** (en las categorías, en la búsqueda y en la propia pantalla de favoritos):
  - va junto al botón de copiar y, como él, queda fuera del orden de Tab;
  - es un botón alternable con estado accesible;
  - se marca o desmarca con un clic o con `Ctrl+D` (`Cmd+D` en macOS) sobre el comando con foco;
  - el cambio se anuncia ("Añadido a favoritos" / "Quitado de favoritos");
  - si el comando es favorito, la estrella se ve rellena siempre, no solo al pasar el ratón.
- **Tarjeta "Favoritos"** como primera entrada de la lista de categorías, con su número de comandos. Solo aparece si hay al menos un favorito. Abre una pantalla como la de una categoría:
  - Atrás y Escape;
  - el nombre de la categoría en cada comando;
  - el orden en que se marcaron.

  Desmarcar un comando dentro de esa pantalla lo deja en la lista hasta salir, para que el foco no salte y se pueda deshacer.
- **Guardado en la extensión:**
  - en `globalState`, como lista de ids sincronizada con Settings Sync, y global, no por proyecto;
  - la extensión solo acepta ids del catálogo e ignora (y limpia) los que dejan de existir.
- **Protocolo:**
  - el webview envía `{ type: "toggleFavorite", commandId }`, solo el id;
  - la extensión responde `{ type: "favorites", commandIds }` tras cada `ready` y tras cada cambio.
- **Textos nuevos del webview** en los 11 idiomas.

## Capabilities

### New Capabilities
- `favorites`: marcar comandos como favoritos, guardarlos de forma persistente y sincronizada, y mostrarlos en una tarjeta y una pantalla propias.

### Modified Capabilities
- `webview-messaging`: el protocolo gana `toggleFavorite` (webview → extensión) y `favorites` (extensión → webview).

## Impact

- **Extensión:**
  - código nuevo: `src/favorites/FavoritesStore.ts`, que lee, alterna, valida y limpia sobre una interfaz mínima de `Memento`;
  - `src/messaging/protocol.ts`: los dos mensajes nuevos;
  - `src/views/CommandsViewProvider.ts`: atiende `toggleFavorite` y envía `favorites`;
  - `src/extension.ts`: crea el almacén y llama a `setKeysForSync`.
- **Webview:**
  - `App.tsx` guarda los favoritos y la pantalla nueva;
  - `navigation.ts` gana la pantalla `favorites` y su restauración;
  - `CategoryList.tsx` muestra la tarjeta;
  - `CommandList.tsx` muestra la estrella y el atajo;
  - componente nuevo: `FavoritesScreen.tsx`;
  - estilos, iconos `star-empty` y `star-full`, y los diccionarios de los 11 idiomas.
- **Tests:**
  - unitarios del almacén, del protocolo y de la navegación;
  - integración: alternar un favorito y recibir `favorites`.
- **Documentación:** `docs/ROADMAP.md`, `CHANGELOG.md` y `README.md`.
- Sin dependencias nuevas.
