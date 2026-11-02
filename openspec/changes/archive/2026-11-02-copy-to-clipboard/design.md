# Design

## Context

- `protocol.ts` valida campo a campo con `webviewMessageFields` desde la 1.4. `ExtensionMessage` es `init | catalog`.
- `CommandsViewProvider.sendToTerminal(commandId)` busca el comando, construye `buildExample(cmd, resolveLocale(vscode.env.language), defaultShellFor(process.platform))` y llama a `TerminalService.write`. Si el id no existe, hace `log.warn`.
- `TerminalService` recibe un host inyectado y no importa `vscode`, así que se testea con Vitest. `test/unit/tsconfig.json` incluye `src/terminal`.
- En `CommandList.tsx`, cada `<li>` contiene un único `<button className="command">` con foco itinerante (`useRovingFocus`). El icono `terminal` se muestra con `.command:hover` o `.command:focus-visible`.
- `App.tsx` escucha los mensajes de la extensión y los trata como de confianza, mirando solo el `type`.

## Goals / Non-Goals

**Goals:**
- Copiar el mismo texto que muestra el ejemplo, sin que el webview pueda elegir qué texto se copia.
- Un camino de teclado que no rompa la única parada de Tab de la lista.
- Una confirmación visible y accesible que solo aparezca si la copia ocurrió de verdad.

**Non-Goals:**
- Notificaciones o mensajes en la barra de estado de VS Code: con la confirmación dentro de la vista basta.
- Leer el portapapeles.
- Copiar desde la lista de categorías o desde una búsqueda (la 1.6 reutilizará este mismo mensaje).

## Decisions

### D1. Mensajes y validación
```ts
export type WebviewMessage =
  | { readonly type: 'ready' }
  | { readonly type: 'sendToTerminal'; readonly commandId: string }
  | { readonly type: 'copyToClipboard'; readonly commandId: string };
export type ExtensionMessage = /* init | catalog | */ { type: 'copied'; commandId: string };
```
- En `webviewMessageFields` se añade `copyToClipboard: { type: isString, commandId: isCommandId }`, con el mismo validador y el mismo límite de 200 caracteres que `sendToTerminal`.
- `copied` no se valida en el webview, porque los mensajes de la extensión son de confianza (como `init` y `catalog`).

### D2. `ClipboardService` con portapapeles inyectado
```ts
export interface ClipboardLike { writeText(value: string): Thenable<void> }
export class ClipboardService {
  constructor(private readonly clipboard: ClipboardLike) {}
  /** Copia `text`. Devuelve true si funcionó; nunca lanza. */
  async copy(text: string): Promise<boolean>
}
```
- En la extensión, el portapapeles es `vscode.env.clipboard`, que encaja estructuralmente. El servicio no importa `vscode`, así que se testea con Vitest. Se añade `src/clipboard` al `include` de `test/unit/tsconfig.json`.
- Si `copy` falla, captura la excepción y devuelve `false`. El proveedor es quien registra el error, porque tiene el log; así el servicio no depende de él.
- *Alternativa descartada: `navigator.clipboard.writeText` en el webview.* Exige que el documento tenga el foco y los permisos del iframe, y no es fiable en los webviews de VS Code. Además, el webview tendría el texto en sus manos, cuando el modelo de seguridad de la 1.4 es que solo envíe ids.
- *Alternativa descartada: llamar a `vscode.env.clipboard` directamente desde el proveedor.* Es más corto, pero el proveedor importa `vscode` y no se puede testear con Vitest. El servicio sigue el mismo patrón que `TerminalService`.

### D3. Proveedor: resolver el texto una vez y responder
- Un `private commandText(commandId): string | undefined` en `CommandsViewProvider` reúne la búsqueda del comando y `buildExample`, que hasta ahora estaban dentro de `sendToTerminal`. Lo usan `sendToTerminal` y la nueva acción de copiar, para que el texto copiado y el enviado no puedan divergir.
- `async copyToClipboard(commandId): Promise<boolean>` es público, porque lo usan los tests:
  - si el id no existe: `log.warn` y devuelve `false`;
  - si `clipboard.copy(text)` falla: `log.error` y devuelve `false`;
  - si todo va bien: `log.info` con el id (no el texto) y devuelve `true`.
- En el manejador de mensajes, `case 'copyToClipboard'` espera `copyToClipboard` y, si devuelve `true`, envía `{ type: 'copied', commandId }` al mismo `webview`.
- `activate` crea `new ClipboardService(vscode.env.clipboard)` y lo pasa al proveedor, después de `terminal`. `DevCommandsApi` añade `copyToClipboard(commandId): Promise<boolean>`.

### D4. Botón secundario como hermano del principal
- Un `<button>` no puede ir dentro de otro, así que el `<li>` pasa a contener dos hermanos: `<button className="command">…</button>` y `<button className="command-copy">`.
- El `<li className="command-item">` lleva `position: relative`. `.command-copy` va en posición absoluta arriba a la derecha, a la altura del encabezado, y `.command-header` reserva su ancho con `padding-inline-end`, así que el icono `terminal` queda justo a su izquierda. El bloque del ejemplo conserva todo el ancho.
- `.command-copy`:
  - `tabIndex={-1}`, para no añadir una parada de Tab;
  - `aria-label={t('copyCommand')}` y `title` con el nombre más el atajo (`Copy command (Ctrl+C)`, o `⌘C` en macOS);
  - visible con `.command-item:hover`, con `.command-item:focus-within` o mientras muestra la confirmación;
  - icono `copy`, que pasa a `check` durante la confirmación.
- Al hacer clic se envía `copyToClipboard` **sin mover el foco** (`preventDefault` en `mousedown`). *Ajuste tras F5:* la primera versión devolvía el foco al botón principal con `focusItem(index)`, pero ese cambio de foco hacía que el Narrador leyera el comando entero y se perdiera el anuncio "Copiado".
- *Alternativa descartada: hacer del botón de copiar una parada de Tab o un segundo nivel de flechas (izquierda/derecha).* Duplica las paradas o inventa una convención que la vista no usa en ningún otro sitio. Los árboles de VS Code tampoco ponen las acciones de fila en el orden de Tab, y usan atajos.

### D5. Atajo `Ctrl+C` / `Cmd+C`
- Un `onKeyDown` en el botón principal comprueba:
  - `(event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'c'`;
  - que `window.getSelection()?.isCollapsed !== false`, es decir, que no haya texto seleccionado.

  Si se cumple, hace `preventDefault()` y envía `copyToClipboard`. Si hay selección, no hace nada y se copia la selección como siempre.
- El botón principal anuncia el atajo con `aria-keyshortcuts="Control+C"`, o `"Meta+C"` en macOS.
- La plataforma se detecta en el webview con `navigator.userAgent.includes('Mac')`, solo para el texto del tooltip y para `aria-keyshortcuts`. Las dos combinaciones funcionan siempre, en cualquier sistema.
- VS Code reenvía al webview las pulsaciones que no consume. Con el foco dentro del webview, `Ctrl+C` llega al `keydown` del documento. Se comprueba en la tarea de F5.

### D6. Confirmación en la vista
- `App.tsx` atiende `copied` y guarda `{ commandId, seq }`, que se borra a los 2000 ms con un temporizador. `seq` aumenta en cada copia, así que copiar otra vez (aunque sea el mismo comando) reinicia el temporizador. El valor llega a `CommandList` a través de `CategoryScreen`.
- El botón de copiar de esa fila cambia el icono a `check` (color `testing.iconPassed`). "Copiado" solo existe para los lectores de pantalla. *Ajuste tras F5:* se probó una insignia visible "✓ Copiado", pero el autor prefirió quedarse solo con el icono.
- El texto de la región viva va en un `<span key={seq}>`: cada copia sustituye el nodo y el anuncio se repite.
- `CommandList` tiene una región `<span role="status" aria-live="polite" className="visually-hidden">` que siempre está en el DOM. Su texto es `t('copied')` mientras hay confirmación y vacío el resto del tiempo. Como la región ya existe antes de que cambie su contenido, el anuncio se produce, y el foco no se mueve.
- Se añade la clase `.visually-hidden` (recorte estándar) a `index.css`.

### D7. Textos (11 idiomas)
| Clave | en | es |
| --- | --- | --- |
| `copyCommand` | Copy command | Copiar comando |
| `copied` | Copied | Copiado |

El atajo (`Ctrl+C` / `⌘C`) no se traduce y se añade al tooltip en el código.

### D8. Mensajes webview ↔ extensión
| Mensaje | Dirección | Forma | Respuesta |
| --- | --- | --- | --- |
| `ready` | webview → extensión | `{ type: 'ready' }` | `init` + `catalog` |
| `sendToTerminal` | webview → extensión | `{ type: 'sendToTerminal', commandId }` | ninguna |
| `copyToClipboard` | webview → extensión | `{ type: 'copyToClipboard', commandId }` | `copied` si la copia funcionó |
| `init` | extensión → webview | `{ type: 'init', locale, version }` | — |
| `catalog` | extensión → webview | `{ type: 'catalog', categories }` | — |
| `copied` | extensión → webview | `{ type: 'copied', commandId }` | — |

Sin dependencias de runtime nuevas: `vscode.env.clipboard` es API estable desde VS Code 1.30.

## Risks / Trade-offs

- [`Ctrl+C` no llega al webview en alguna configuración (por ejemplo, un keybinding de usuario que lo captura)] → El botón de copiar sigue funcionando con el ratón y con los lectores de pantalla. Se comprueba con F5 y, si hiciera falta, se documenta.
- [Interceptar `Ctrl+C` puede sorprender a quien quería copiar el texto de la fila] → Solo se intercepta cuando el foco está en un comando y no hay selección. Con selección, se copia la selección.
- [Copias seguidas con el mismo texto ("Copiado") que no se anuncian] → Cada copia vuelve a montar el nodo del texto (`key={seq}`), así que se anuncia cada vez.
- [El botón de copiar no es accesible con Tab] → Es intencional (D4). El atajo cubre el teclado y está anunciado con `aria-keyshortcuts` y en el tooltip.
- [Placeholders copiados tal cual] → Igual que en la terminal: lo que se ve es lo que se copia. La 2.2 los resolverá.

## Migration Plan

No hay datos ni configuración nuevos. Rollback: revertir el squash merge.
