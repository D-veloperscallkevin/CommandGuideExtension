## Context

- **Cómo se construye hoy el texto:** `CommandsViewProvider.commandText(id)` llama a `buildExample(command, locale, targetShell.current())`. Ese ejemplo sustituye cada `${x}` por su placeholder sin escapar, y es lo que se envía a la terminal y se copia.
- **Catálogo:** 57 de 108 comandos tienen `params` (`name`, `label`, `placeholder`, localizados). Los `${x}` aparecen:
  - sueltos (la gran mayoría): `git checkout -b ${branch}`, `docker run -d -p ${ports} --name ${name} ${image}`;
  - entre comillas dobles: `git commit -m "${message}"`, `node -e "${code}"`, `node -p "${expression}"`, `find . -name "${pattern}"`, `grep -rn "${text}" .`, y sus variantes `powershell`/`cmd` en Terminal;
  - la variante cmd de `terminal.follow-file` mete `${file}` en un `-Command "…"` de PowerShell.
- **Mensajes:** el webview envía `sendToTerminal` y `copyToClipboard` solo con `commandId`; `copied` se envía cuando la copia funciona. No cambian.
- **l10n:** `package.json` declara `"l10n": "./l10n"` y los 10 `bundle.l10n.*.json` existen vacíos. Un test unitario ya exige que todo `vscode.l10n.t` tenga traducción.
- **Tests de integración:** solo envían y copian `git.status` (sin parámetros), así que no se bloquean con los cuadros.

## Goals / Non-Goals

**Goals:**
- Pedir los valores con cuadros nativos y accesibles, con el paso visible, sin tocar el webview.
- Escapado correcto por shell y contexto, como función pura con tests exhaustivos.
- Que copiar y enviar compartan exactamente el mismo texto.

**Non-Goals:**
- Recordar los últimos valores o proponerlos rellenados (llega con el historial, 2.5).
- Confirmación de los comandos `destructive` (2.3); se pedirá después de los valores.
- Validar el contenido semántico de un valor (que una rama exista, que un puerto sea numérico).
- Variantes nuevas por shell fuera de la de `terminal.follow-file`.

## Decisions

### D1. Cuadros nativos en la extensión (`ParamPrompter`)
`src/params/ParamPrompter.ts` recibe una interfaz mínima `{ showInputBox(options): Thenable<string | undefined> }` (en la extensión, `vscode.window`) y pide los valores en orden. Opciones de cada cuadro:
- `title`: título del comando en el idioma activo, con ` (i/n)` si `n > 1`;
- `prompt`: etiqueta del parámetro; `placeHolder`: placeholder del parámetro;
- `ignoreFocusOut: true`, para que hacer clic en la terminal o en el editor no lo cancele;
- `validateInput`: la validación de D3, con los mensajes de `vscode.l10n.t`.

Devuelve `ReadonlyMap<string, string>` con los valores recortados, o `undefined` si se cancela. Si el usuario pulsa otro comando con un cuadro abierto, VS Code cierra el anterior (resuelve `undefined`) y ese flujo termina como cancelado.

Alternativa descartada: formulario en el webview. Obliga a que el webview mande valores arbitrarios a la extensión (más superficie que validar) y duplicaría el flujo para `quick-pick` (2.8), que no tiene webview.

### D2. Contexto de comillas de cada `${x}`
`src/params/escape.ts` recorre el comando efectivo de izquierda a derecha y anota, para cada `${x}`, en qué contexto está:
- `bash`, `zsh` y `powershell`: `'` y `"` abren y cierran comillas; dentro de unas, las otras son literales. Contextos: `bare`, `double`, `single`.
- `cmd`: solo `"` delimita. Dentro de `"…"`, una `'` abre un contexto `nestedSingle`, pensado para PowerShell incrustado (`powershell -Command "… '${file}' …"`). Fuera de comillas dobles, `'` no significa nada en cmd.

Un mismo parámetro puede aparecer varias veces; cada aparición se escapa según su propio contexto.

### D3. Validación del valor
`validateValue(value, shell)` devuelve `undefined` o el código del error, que `ParamPrompter` traduce:
- `empty`: vacío tras quitar espacios;
- `control`: U+0000–U+001F, U+007F–U+009F, U+2028 o U+2029 (incluye `\n`, `\r` y `\t`);
- `tooLong`: más de 500 caracteres;
- `cmdUnsafe`: shell `cmd` y el valor contiene `"` o `%`. cmd no tiene forma fiable de escapar `"` dentro de comillas ni de evitar la expansión de `%VAR%` en una sesión interactiva;
- `powershellUnsafe`: shell `powershell` y el valor contiene `"`. Comprobado en la tarea 1.2: Windows PowerShell 5.1 borra las `"` (y estropea `\"`) al pasar un argumento a un programa nativo. PowerShell 7.3+ no lo hace, y no hay un escapado que sirva para los dos.

El valor aceptado es el recortado (`trim()`).

### D4. Escapado por shell y contexto
`escapeValue(value, shell, context)`; las reglas son las de la tabla de la spec `command-params`.

Caracteres seguros (solo para `bare`; si el valor los cumple todos, se escribe sin comillas):
- `bash`/`zsh`: primer carácter de `[A-Za-z0-9_./-]`, el resto de `[A-Za-z0-9_./:@%+=,-]`. El primer carácter excluye `=` y `~`, que zsh y bash expanden al inicio de una palabra.
- `powershell`: primer carácter de `[A-Za-z0-9_./\\]`, el resto de `[A-Za-z0-9_./\\:@%+=-]`. Se excluyen la `,` (PowerShell la convierte en array) y el `-` o `@` iniciales, que un cmdlet tomaría como nombre de parámetro o splatting.
- `cmd`: todos de `[A-Za-z0-9_./\\:@+-]`. Se excluyen `=`, `,` y `;`, que cmd trata como separadores.

PowerShell trata como comillas también las tipográficas: `‘ ’ ‚ ‛` son simples y `“ ” „` son dobles, así que se escapan igual que `'` y `"`.

En bash/zsh, dentro de comillas dobles, `!` dispara la expansión del historial en una sesión interactiva y `\!` deja la barra. Por eso se cierra la comilla, se escribe `'!'` y se vuelve a abrir: `"'!'"`.

Barras invertidas finales: los programas nativos de Windows (reglas de la CRT) leen `\"` como comilla escapada, así que `"C:\mi dir\"` les llega como `C:\mi dir"`. Se duplican las `\` finales cuando el valor queda entre comillas dobles en cmd, y cuando tiene espacios en PowerShell, que entonces lo entrecomilla al pasarlo a un programa nativo. Los comandos internos de cmd y los cmdlets aceptan la ruta con la barra duplicada.

Comprobación con shells reales (tarea 1.2):
- 37 valores difíciles en cada contexto, con Git Bash, bash de WSL, Windows PowerShell 5.1 (cmdlet y programa nativo) y cmd, comparando el `argv` que recibe `node`;
- todo coincide tras los dos ajustes (`powershellUnsafe` y la barra final);
- con cmdlets, un valor con espacios y barra final llega con la barra duplicada, como se acepta arriba.

### D5. Texto del comando
`buildCommandText(command, shell, values)` sustituye cada `${x}` del comando efectivo por `escapeValue(values.get(x), shell, contexto)`. `buildExample` no cambia: el ejemplo de la vista sigue mostrando los placeholders sin escapar, para que se lea bien.

En `CommandsViewProvider`, `commandText(id)` pasa a `async resolveCommandText(id)`:
1. busca el comando; si no existe, `{ kind: 'unknown' }`;
2. fija `shell = targetShell.current()` (el shell al pulsar);
3. sin `params`, devuelve `buildExample(command, locale, shell)`, igual que hoy;
4. con `params`, llama a `ParamPrompter.ask(command, locale, shell)`; si devuelve `undefined`, `{ kind: 'cancelled' }`; si no, `buildCommandText(…)`.

`sendToTerminal` y `copyToClipboard` usan ese resultado: una cancelación se registra con `log.info` y no envía `copied`.

`DevCommandsApi` no cambia: `sendToTerminal` sigue devolviendo `void` y `copyToClipboard` sigue devolviendo `Promise<boolean>` (`false` si se cancela).

### D6. Variante cmd de `terminal.follow-file`
Pasa a `powershell -NoProfile -Command "Get-Content -LiteralPath '${file}' -Tail 50 -Wait"`:
- `-LiteralPath` evita que PowerShell interprete `[ ]` del nombre como comodines;
- las comillas simples dan al valor un contexto `nestedSingle` (D2): cmd ya rechaza `"` y `%` (D3), y la `'` se duplica para PowerShell.

Se comprueba en un cmd real con un archivo cuyo nombre lleva espacio y comilla simple.

### D7. Mensajes webview ↔ extensión
No cambian. `WebviewMessage` y `ExtensionMessage` siguen igual; los valores no salen nunca de la extensión. Lo único que cambia es cuándo se envía `copied`: no se envía si el usuario cancela.

### D8. Textos nuevos (l10n)
Cinco claves en inglés con `vscode.l10n.t`, traducidas en los 10 `bundle.l10n.*.json`:
- `Enter a value.`
- `The value can't contain line breaks or control characters.`
- `The value can't be longer than {0} characters.`
- `In cmd, the value can't contain " or %.`
- `In PowerShell, the value can't contain ".`

El título con el paso (`{0} ({1}/{2})`) no lleva palabras y no se traduce.

## Risks / Trade-offs

- **Un valor que empieza por `-` se toma como opción del programa** (por ejemplo `git checkout -b -f`). → Las comillas no lo evitan en ningún shell y validar opciones por comando no es objetivo. El texto queda escrito sin ejecutar, y el usuario lo revisa antes de pulsar Enter.
- **cmd rechaza `"` y `%`** → Son raros en nombres de archivos y ramas. El mensaje dice el motivo, y quien los necesite puede usar PowerShell.
- **`!` en bash dentro de comillas dobles produce un texto poco legible** (`"…"'!'"…"`) → Es correcto y solo aparece si el valor lleva `!`.
- **Cambiar de terminal mientras se escribe el valor** → El shell se fija al pulsar (D5), y el texto se escribe en la terminal activa al terminar. Si el usuario cambió a otro shell, el texto puede no encajar. Se acepta: volver a calcular con valores ya validados para otro shell podría dejar un valor inválido para cmd.
- **Sin dependencias de runtime nuevas.**
