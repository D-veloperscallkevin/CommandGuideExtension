## Why

Al trabajar se repiten los mismos pocos comandos, a menudo con los mismos valores (la misma rama, el mismo mensaje de commit, la misma carpeta). Ahora hay que buscarlos y volver a teclear los valores cada vez. Fase 2 (v1), punto 2.5 del roadmap: "Últimos 20 comandos enviados (`globalState`)".

## What Changes

- **Historial de envíos:** la extensión guarda los últimos 20 comandos escritos en la terminal, del más reciente al más antiguo.
  - Cada entrada es el id del comando más los valores de sus parámetros, no el texto final. Así el texto se reconstruye y se escapa para el shell de destino del momento.
  - Se registra solo cuando el texto llega a la terminal. Copiar no cuenta, y un envío cancelado o no confirmado tampoco.
  - Repetir el mismo comando con los mismos valores sube la entrada arriba, sin duplicarla.
  - Se guarda en `globalState` de este equipo, sin Settings Sync.
- **Tarjeta "Recientes":** aparece en la lista de categorías después de "Favoritos", solo si hay historial.
- **Pantalla "Recientes":**
  - Cada entrada muestra el texto con sus valores y la categoría del comando.
  - Enviar reutiliza los valores guardados sin pedirlos. Si un valor ya no es válido para el shell actual, se vuelven a pedir con ese valor ya escrito. La confirmación de los comandos destructivos se mantiene.
  - Copiar usa los mismos valores, y la estrella funciona igual que en las demás listas.
  - El botón "Borrar historial" vacía la lista.
- **Protocolo:**
  - webview → extensión: `sendRecent {entryId}`, `copyRecent {entryId}` y `clearHistory`;
  - extensión → webview: `history {entries}`;
  - `copied` admite un `entryId` opcional.
  - El webview nunca envía valores, solo la clave de la entrada.
- **Textos:** en los 11 idiomas.

## Capabilities

### New Capabilities
- `recent-history`: registro de los comandos enviados con sus valores, tarjeta y pantalla de recientes, reenvío y copia con los valores guardados, y borrado del historial.

### Modified Capabilities
- `webview-messaging`: el protocolo tipado añade `sendRecent`, `copyRecent`, `clearHistory` e `history`, y `copied` puede llevar `entryId`.

## Impact

- **Extensión:**
  - nuevo `src/history/HistoryStore.ts`, sin dependencia de `vscode`;
  - `CommandsViewProvider` registra los envíos, atiende los mensajes nuevos y reenvía `history` tras `ready`, tras cada cambio y al cambiar el shell;
  - `ParamPrompter` acepta valores iniciales;
  - `extension.ts` crea el almacén y amplía la API de pruebas.
- **Protocolo:** `src/messaging/protocol.ts`.
- **Webview:**
  - `navigation.ts` gana la pantalla `recent`;
  - nuevo `RecentScreen.tsx`;
  - `CategoryList` muestra la tarjeta;
  - `CommandList` admite entradas con clave propia;
  - `App` guarda el historial;
  - los 11 diccionarios.
- **Pruebas:** unitarias del almacén, del protocolo, de la navegación y del prompter; integración del registro y el borrado.
- **Docs:** README, CHANGELOG y ROADMAP.
- **Privacidad:** los valores tecleados quedan en el perfil de VS Code de este equipo hasta borrar el historial. No se sincronizan ni se escriben en el registro.
