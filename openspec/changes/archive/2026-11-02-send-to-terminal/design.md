# Design

## Context

- `protocol.ts` define `WebviewMessage = { type: 'ready' }`, y `isWebviewMessage` comprueba que sea un objeto plano, que su `type` sea conocido y que tenga exactamente las claves de `webviewMessageKeys`. No comprueba el tipo de los valores.
- `CommandsViewProvider` atiende `ready`, construye los resúmenes con `buildCategorySummaries(categories, locale, defaultShellFor(process.platform))` y descarta con `log.warn` los mensajes inválidos.
- `CatalogService.getCommand(id)` y `buildExample(cmd, locale, shell)` ya existen. El ejemplo visible es `buildExample` con el mismo idioma y shell.
- `CommandList.tsx` pinta cada comando como un `<div role="group">` enfocable con `aria-labelledby` (título, riesgo, descripción y ejemplo). El change 1.3 dejó prevista su conversión a botón.
- No hay `src/terminal/` todavía. El roadmap lo reserva para `TerminalService.ts`.

## Goals / Non-Goals

**Goals:**
- Tercer clic del flujo: el comando queda escrito en la terminal, con el foco puesto para pulsar Enter.
- Seguridad: la terminal solo recibe texto construido por la extensión a partir del catálogo.
- `TerminalService` testeable sin VS Code.

**Non-Goals:**
- Confirmación de destructivos (2.3), parámetros (2.2), detección del shell real (2.1), copiar (1.5), historial y respuesta `sent`.
- Limpiar la línea de entrada antes de escribir, o detectar si la terminal está ocupada con un proceso. Depende del shell y de la integración de shell; se documenta como limitación.

## Decisions

### D1. Mensaje y validación por campo
```ts
export type WebviewMessage = { readonly type: 'ready' } | { readonly type: 'sendToTerminal'; readonly commandId: string };
```
- `webviewMessageKeys` pasa a `webviewMessageFields: Record<type, Record<campo, (v: unknown) => boolean>>`:
  ```ts
  ready: { type: isString },
  sendToTerminal: { type: isString, commandId: isCommandId }, // string, 1..200 caracteres
  ```
- `isWebviewMessage` exige exactamente esas claves y que cada validador devuelva `true`. Sigue rechazando los prototipos no planos y los `type` heredados.
- *Por qué 200:* ningún id del catálogo se acerca a esa longitud, y el límite acota lo que se registra en el log.

### D2. `TerminalService` con dependencias inyectadas
```ts
export interface TerminalLike { show(preserveFocus?: boolean): void; sendText(text: string, shouldExecute?: boolean): void }
export interface TerminalHost { readonly activeTerminal: TerminalLike | undefined; createTerminal(options: { name: string }): TerminalLike }
export class TerminalService {
  static readonly terminalName = 'DevCommands';
  constructor(private readonly host: TerminalHost) {}
  /** Escribe `text` sin ejecutarlo en la terminal activa o en una nueva "DevCommands". */
  write(text: string): TerminalLike
}
```
- `write` toma `host.activeTerminal ?? host.createTerminal({ name: 'DevCommands' })`, y después llama a `terminal.show(false)` (foco en la terminal) y a `terminal.sendText(text, false)`.
- En la extensión, `host` es `vscode.window`, cuyas formas encajan estructuralmente. `TerminalService` no importa `vscode`, así que se testea con Vitest. Se añade `src/terminal` al `include` de `test/unit/tsconfig.json`.
- *Por qué `show` antes de `sendText`:* así la terminal recién creada ya está visible y enfocada cuando llega el texto.
- *Por qué no reutilizar una "DevCommands" ya existente cuando la activa es otra:* el usuario espera que el comando vaya a la terminal que está mirando. Si no hay ninguna activa, se crea "DevCommands" (las cerradas no cuentan).

### D3. Atender `sendToTerminal` en el proveedor
- `CommandsViewProvider.sendToTerminal(commandId)` es público, porque lo usan también los tests:
  1. busca el comando con `catalog.getCommand(commandId)`; si no existe, `log.warn` y termina;
  2. construye `buildExample(cmd, resolveLocale(vscode.env.language), defaultShellFor(process.platform))`, la misma regla que el ejemplo visible;
  3. llama a `terminalService.write(texto)` y registra en el log (nivel info) el id enviado, no el texto.
- `TerminalService` se crea en `activate` con `vscode.window` y se pasa al proveedor.
- La API de pruebas (`DevCommandsApi`) añade `sendToTerminal(commandId: string): void`, que delega en el proveedor. Si el id no existe, solo registra la advertencia.

### D4. Botón de comando
- `<button type="button" className="command">` sustituye al `<div role="group">`. Conserva `aria-labelledby` (título, riesgo, descripción y ejemplo) y añade `aria-describedby="send-hint"`, que apunta a un `<span hidden id="send-hint">` único en la lista con `t('sendToTerminalHint')`. También lleva `title={t('sendToTerminalHint')}`.
- Contenido: el mismo que antes, más un Codicon `terminal` alineado a la derecha del encabezado. Es decorativo (`aria-hidden`) y solo es visible al pasar el ratón o con el foco. Si se pulsara antes de tiempo, el clic sigue funcionando igual.
- El `onClick` llama a `postMessage({ type: 'sendToTerminal', commandId })`. Enter y Espacio llegan gratis al ser un botón.
- `<button>` no puede contener un `<p>`, así que la descripción pasa a `<span className="command-description">` con `display: block`. Pasa lo mismo con `<code>`, que ya es un elemento en línea.

### D5. Textos (11 idiomas)
| Clave | en | es |
| --- | --- | --- |
| `sendToTerminalHint` | Writes the command in the terminal without running it | Escribe el comando en la terminal sin ejecutarlo |

### D6. Mensajes webview ↔ extensión
| Mensaje | Dirección | Forma | Respuesta |
| --- | --- | --- | --- |
| `ready` | webview → extensión | `{ type: 'ready' }` | `init` + `catalog` |
| `sendToTerminal` | webview → extensión | `{ type: 'sendToTerminal', commandId }` | ninguna (la terminal recibe el foco) |
| `init` | extensión → webview | `{ type: 'init', locale, version }` | — |
| `catalog` | extensión → webview | `{ type: 'catalog', categories }` | — |

## Risks / Trade-offs

- [La terminal activa está ejecutando un proceso (p. ej. `pnpm dev`) y el texto le llega a ese proceso] → Nunca se envía un salto de línea, así que no se ejecuta nada. Se documenta en el README, y la integración de shell podrá detectarlo más adelante.
- [Texto ya escrito en la línea de entrada] → El comando se añade detrás. Limpiar la línea depende del shell (Ctrl+U en bash, Escape en PSReadLine), así que se deja para la 2.1.
- [Shell real distinto del supuesto (Git Bash en Windows)] → La variante puede no encajar. Hoy ningún comando del catálogo define `shells`, y la 2.1 lo resuelve.
- [Placeholder enviado tal cual (`feature/my-change`)] → Es intencional (lo que se ve es lo que se escribe) y no se ejecuta. La 2.2 pedirá el valor.
- [`sendToTerminal` repetido rápidamente] → Cada clic añade el texto otra vez. Es aceptable: no se ejecuta y el usuario lo ve.

## Migration Plan

Sin datos ni configuración nueva. Rollback: revertir el squash merge.
