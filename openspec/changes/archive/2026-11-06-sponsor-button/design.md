## Context

- El webview envía mensajes validados por `isWebviewMessage()` (`src/messaging/protocol.ts`). Para cada tipo hay una lista exacta de campos, y `CommandsViewProvider` despacha cada uno con un `switch`.
- La extensión ya lee `context.extension.packageJSON` para obtener la versión.
- La CSP del webview no permite navegar: un `<a href>` dentro del webview no abre el navegador. Hay que pedírselo a la extensión.
- Los textos del webview viven en 11 diccionarios con las mismas claves, y un test unitario lo comprueba.

## Goals / Non-Goals

**Goals:**
- Un botón siempre visible en el panel que abre GitHub Sponsors.
- Que un mensaje manipulado del webview no pueda abrir otra dirección.

**Non-Goals:**
- Pagos dentro de la extensión, recuentos de patrocinadores o recordatorios. No hay notificaciones ni avisos que insistan.
- Icono en la cabecera nativa de la vista ni comando en la paleta. El autor eligió solo el botón dentro del panel.

## Decisions

### 1. La URL sale del manifiesto y se valida en la extensión

`sponsorUrl(packageJSON)` es una función pura. Devuelve `sponsor.url` si es una cadena que empieza por `https://github.com/sponsors/` y se puede convertir en URL; si no, devuelve `undefined`.

`openSponsor({ url, openExternal, log })`:
- sin URL válida, registra una advertencia y no abre nada;
- con URL válida, llama a `openExternal(Uri.parse(url))`.

`openExternal` es `vscode.env.openExternal`, que aplica la confirmación de enlaces de confianza de VS Code. Se inyecta para testear sin `vscode`.

Se descartó que el webview envíe la URL: obligaría a validar una dirección que llega de fuera. Con un mensaje sin campos no hay nada que validar salvo el tipo.

Se descartó también escribir la URL a mano en el código: el manifiesto ya la necesita para el botón de la ficha, y así hay una sola fuente.

### 2. Mensaje `openSponsor` sin campos

Se añade a `WebviewMessage` y a `webviewMessageFields` con `{ type: isString }`, igual que `clearHistory`. Con cualquier campo extra, por ejemplo `url`, el mensaje se descarta por la regla general de campos exactos.

En el `switch` del proveedor, `case 'openSponsor'` llama al callback `openSponsor`, que el proveedor recibe en el constructor (antes de `catalog`, que tiene valor por defecto). Los errores se registran con `log.error`.

### 3. Botón en `App.tsx`, fuera de `content`

El botón va en `<main>`, antes del `<p className="shell-indicator">`. Así se ve en el inicio, en las categorías, en Favoritos, en Recientes y en los resultados de búsqueda, sin tocar cada pantalla. No se muestra mientras carga, antes de `init`: hasta entonces el webview no sabe el idioma, y el requisito de carga solo pide el indicador.

Es un `<button type="button">` con `<Icon name="heart" />` y el texto `t('sponsor')`, más `aria-label={t('sponsorLabel')}`, por ejemplo "Sponsor DevCommands Guide on GitHub (opens in the browser)".

Usa la clase `back`, el estilo de botón secundario que ya usa "Borrar historial", más `sponsor` para el margen y el color del corazón (`--vscode-charts-red`, con el color del texto como reserva en alto contraste).

### 4. Textos

Dos claves nuevas en los 11 diccionarios: `sponsor` (el texto visible) y `sponsorLabel` (el nombre accesible). "Sponsor" es el término que usa GitHub, pero se traduce: "Patrocinar", "Sponsern", "Sponsoriser"… El test de diccionarios existente garantiza que no falta ninguna clave.

### 5. Ajustes tras la primera revisión del autor

- **Indicador:** "Ejemplos para: X" pasa a "Terminal: X", más corto, para que quepa en la misma fila que el botón.
- **Colores del shell:** se toman de los colores ANSI del tema de la terminal, así respetan el tema del usuario.
  - En los temas oscuros se usa la variante `Bright`, más clara, y en los claros la normal, más oscura, para mantener el contraste.
  - En alto contraste se usa el color de texto, porque es lo que garantiza el contraste en esos temas.
- **README:** un enlace de texto junto al título y no un badge: los badges habituales son SVG, que la spec del README prohíbe.
- **Sin confirmación propia:** VS Code no pregunta al abrir `github.com`, porque es un dominio de confianza, y el autor prefiere que se abra directamente.

## Risks / Trade-offs

- **Un botón siempre visible puede parecer insistente** → es pequeño, secundario, sin colores de llamada salvo el corazón, y no hay avisos ni ventanas emergentes.
- **El usuario puede tener bloqueado abrir enlaces externos** (entornos remotos o restringidos) → `openExternal` devuelve `false` y no pasa nada más. Se registra como información.
- **La URL del manifiesto podría cambiar** (otro usuario u organización) → basta con editar `package.json`. La validación solo exige el prefijo de GitHub Sponsors.

## Migration Plan

No hay nada que migrar. Para revertir el cambio basta con deshacer el commit.
