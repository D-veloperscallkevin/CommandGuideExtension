## Context

- **El texto de hoy:** `CommandsViewProvider.commandText(id)` construye el texto de un comando: el ejemplo si no tiene parámetros, o los valores pedidos con `ParamPrompter` y escapados con `buildCommandText`. Devuelve `text`, `unknown` o `cancelled`, y lo usan `sendToTerminal` y `copyToClipboard`, así que enviar y copiar no pueden divergir.
- **El riesgo:** ya viaja en el catálogo (`risk` obligatorio) y el webview lo muestra con `RiskBadge` desde 1.3. No hay ningún aviso en la extensión ni ninguna sección `contributes.configuration` en `package.json`.
- **La traducción:**
  - el manifiesto ya usa `%clave%` con `package.nls*.json` en 11 idiomas, y un test unitario exige cada clave en los 11 archivos;
  - los textos de la extensión pasan por `vscode.l10n.t`, y otro test exige su traducción en los 10 `bundle.l10n.*.json`.
- **Los tests de integración** copian `git.status` y cancelan un cuadro con `workbench.action.closeQuickOpen`. Un aviso modal no se puede cerrar desde un test: bloquea hasta que alguien pulsa un botón.

## Goals / Non-Goals

**Goals:**
- Un único punto que decide si confirmar y cómo, reutilizable por `quick-pick` (2.8).
- Que el aviso muestre exactamente el texto que se va a escribir o copiar.
- Que la lógica se pruebe con Vitest, sin VS Code.

**Non-Goals:**
- Confirmar los comandos `caution`.
- Cambiar el webview, el protocolo o la etiqueta de riesgo.
- Una casilla "No volver a preguntar" en el aviso: para eso está el ajuste.
- Confirmar los comandos propios (2.6), que aún no existen. Cuando lleguen, usarán el mismo `risk`.

## Decisions

### D1. `RiskConfirmer` sobre interfaces mínimas
`src/risk/RiskConfirmer.ts` no importa `vscode`. Recibe:
- una ventana `{ showWarningMessage(message, options: { modal: true; detail: string }, ...items: string[]): Thenable<string | undefined> }`; en la extensión es `vscode.window`;
- una función `isEnabled(): boolean`, que lee el ajuste (D4);
- los textos traducidos (D3): funciones para el mensaje y los dos detalles, y las dos etiquetas de botón.

`confirm(command, locale, text, action: 'send' | 'copy'): Promise<boolean>`:
- si `command.risk !== 'destructive'` o el ajuste está desactivado, devuelve `true` sin mostrar nada;
- si no, muestra el aviso y devuelve `true` solo si el resultado es la etiqueta del botón de esa acción. Escape, Cancelar o cerrar devuelven `undefined`, que es `false`.

Alternativa descartada: llamar a `vscode.window.showWarningMessage` directamente en el proveedor. Se perderían los tests unitarios y 2.8 duplicaría la lógica.

### D2. Confirmar después de construir el texto
`commandText(id, action)` construye el texto (pidiendo antes los valores) y después llama a `riskConfirmer.confirm(...)`. Si se rechaza, devuelve `{ kind: 'declined' }`, un caso nuevo de `CommandText`. Así:
- el aviso nunca aparece si se cancelaron los valores, y muestra el texto final escapado;
- `sendToTerminal` registra `Envío no confirmado:` y `copyToClipboard` registra `Copia no confirmada:`, los dos con `log.info`. Ninguno escribe, y la copia no envía `copied`;
- el shell sigue fijado al pulsar, porque el texto ya está construido cuando se muestra el aviso.

`declined` va aparte de `cancelled` para que el registro distinga "cerró el cuadro del valor" de "rechazó el aviso".

### D3. Textos del aviso
Claves de `vscode.l10n.t`, con su traducción en los 10 bundles:
- mensaje: `'"{0}" is a destructive command.'` (`{0}` = título del comando en el idioma activo);
- detalle al enviar: `'It will be written to the terminal without running it. Review it before pressing Enter:\n\n{0}'`;
- detalle al copiar: `'It will be copied to the clipboard:\n\n{0}'`;
- botones: `'Write to Terminal'` y `'Copy'`.

El aviso modal añade su propio botón Cancelar, traducido por VS Code. En Windows es un diálogo nativo que el lector de pantalla anuncia con su mensaje y su detalle, y Escape lo cancela.

### D4. Ajuste `devcommands.confirmDestructive`
`package.json` gana:

```json
"configuration": {
  "title": "DevCommands",
  "properties": {
    "devcommands.confirmDestructive": {
      "type": "boolean",
      "default": true,
      "scope": "application",
      "markdownDescription": "%config.confirmDestructive%"
    }
  }
}
```

- La clave `config.confirmDestructive` va en los 11 `package.nls*.json`. Se usa `markdownDescription` para que los ejemplos entre comillas invertidas se vean como código.
- `isEnabled` lee `vscode.workspace.getConfiguration('devcommands').get('confirmDestructive', true)` en cada llamada, así que un cambio se aplica sin recargar la ventana.
- `scope: "application"`: solo se puede cambiar en la configuración de usuario. Un `.vscode/settings.json` de un repositorio clonado no puede desactivar el aviso a escondidas.

Alternativa descartada: ámbito `window` (el normal). Permitiría que un workspace desactivara la confirmación.

### D5. Tests
- **Unitarios** (`test/unit/risk/RiskConfirmer.test.ts`, con una ventana falsa):
  - `safe` y `caution` no muestran nada;
  - `destructive` muestra el mensaje con el título localizado, el detalle con el texto y el botón según la acción;
  - pulsar el botón devuelve `true`, y `undefined` devuelve `false`;
  - con el ajuste desactivado, devuelve `true` sin mostrar nada.

  `test/unit/tsconfig.json` incluye `src/risk/**`.
- **Integración:** con `confirmDestructive` a `false` (`ConfigurationTarget.Global`), copiar `git.reset-hard` devuelve `true` y deja `git reset --hard` en el portapapeles. El ajuste se restaura en `finally`. El caso con aviso no se automatiza porque el modal bloquea, y queda en la prueba manual.

## Risks / Trade-offs

- **[El modal bloquea toda la ventana]** → Es justo lo que se busca, y solo afecta a 7 comandos. Quien lo vea como un estorbo puede desactivar el ajuste.
- **[Detalle largo con valores de hasta 500 caracteres]** → El diálogo nativo ajusta el texto y no lo corta. Es raro en estos comandos, cuyos valores suelen ser rutas.
- **[`scope: "application"` no deja ajustarlo por proyecto]** → Se acepta a cambio de que un repositorio no pueda desactivarlo.
- **[El test de integración cambia la configuración global de la instancia de pruebas]** → La instancia usa un perfil temporal y el valor se restaura en `finally`.
