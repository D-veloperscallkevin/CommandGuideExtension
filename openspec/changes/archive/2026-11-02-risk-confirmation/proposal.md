## Why

El catálogo marca 7 comandos como `destructive` (`git reset --hard`, `git clean -fd`, `git restore ${file}`, `docker system prune -a`, `docker compose down -v`, borrar un archivo y borrar una carpeta). Desde 1.3 llevan la etiqueta "Destructivo", pero un clic o un Enter en la lista los deja escritos en la terminal o en el portapapeles sin ninguna pausa: basta un Enter más para perder trabajo. El ROADMAP (fase 2, change 2.3) pide una confirmación modal antes de esos comandos.

## What Changes

- Al enviar o copiar un comando `destructive`, la extensión muestra un aviso modal de VS Code (`showWarningMessage` con `modal: true`) **después** de pedir los valores de los parámetros, si los tiene. El mensaje nombra el comando y dice que es destructivo; el detalle muestra el texto exacto que se va a escribir o copiar (`rm -rf 'mis cosas'`).
- El botón de confirmación es "Escribir en la terminal" al enviar y "Copiar" al copiar. Cancelar o Escape no escribe ni copia nada, se registra como información y, al copiar, no se envía `copied`.
- Nuevo ajuste `devcommands.confirmDestructive` (booleano, activado por defecto). Desactivado, los comandos `destructive` se envían y se copian sin aviso. Su descripción se traduce a los 11 idiomas con `package.nls`.
- Los comandos `caution` y `safe` no cambian: los `caution` siguen solo con su etiqueta.
- Textos nuevos de la extensión (mensaje, detalle y botones) en los 11 idiomas con `vscode.l10n.t`.
- ROADMAP: el flujo de un clic confirma después de pedir los valores y también al copiar.

## Capabilities

### New Capabilities
- `risk-confirmation`: confirmación modal de los comandos `destructive` al enviarlos o copiarlos, con el texto exacto, y el ajuste que la desactiva.

### Modified Capabilities
- `terminal-integration`: un comando `destructive` solo se escribe tras confirmarlo (salvo con el ajuste desactivado); rechazar la confirmación no escribe nada y no es un error.
- `clipboard-integration`: lo mismo para copiar; rechazar la confirmación no modifica el portapapeles ni envía `copied`.

## Impact

- Código nuevo: `src/risk/RiskConfirmer.ts` (aviso modal y lectura del ajuste sobre interfaces mínimas de `window` y de la configuración), reutilizable por `quick-pick` (2.8).
- `src/views/CommandsViewProvider.ts`: tras construir el texto, pide la confirmación si el comando es `destructive`; `src/extension.ts` crea el `RiskConfirmer`.
- `package.json`: `contributes.configuration` con `devcommands.confirmDestructive`; `package.nls*.json` (11 idiomas) con su título y descripción.
- `l10n/bundle.l10n.*.json` (10 idiomas) con los textos del aviso.
- Tests unitarios de `RiskConfirmer` con una ventana falsa y test de integración con el ajuste desactivado.
- `docs/ROADMAP.md`, `CHANGELOG.md` y `README.md`.
- Sin dependencias nuevas. Sin cambios en `src/messaging/protocol.ts` ni en el webview.
