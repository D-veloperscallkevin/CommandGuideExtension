## 1. Confirmación (lógica sin `vscode`)

- [x] 1.1 Crear `src/risk/RiskConfirmer.ts` (D1, D3) e incluir `src/risk/**` en `test/unit/tsconfig.json`. Tests en `test/unit/risk/RiskConfirmer.test.ts` con una ventana falsa:
  - `git.status` (`safe`) y `git.amend` (`caution`): devuelve `true` y no llama a `showWarningMessage`;
  - `git.reset-hard` al enviar, con el idioma `es`: mensaje con el título en español, `modal: true`, detalle con el texto recibido y un único botón, el de enviar;
  - al copiar: detalle y botón de copiar;
  - pulsar el botón devuelve `true`; `undefined` devuelve `false`;
  - con `isEnabled()` a `false`: devuelve `true` sin mostrar nada;
  - `isEnabled` se consulta en cada llamada, no al construir.

  Verificar: `pnpm run test:unit`.

## 2. Ajuste y textos

- [x] 2.1 `package.json`: `contributes.configuration` con `devcommands.confirmDestructive` (D4: `boolean`, `default: true`, `scope: "application"`, `markdownDescription: "%config.confirmDestructive%"`). Añadir la clave a los 11 `package.nls*.json`.

  Verificar: el test del manifiesto localizado pasa con la clave nueva.
- [x] 2.2 `l10n/bundle.l10n.*.json`: los cinco textos de D3 en los 10 idiomas.

  Verificar: el test de traducciones de la extensión pasa tras el paso 3.1.

## 3. Integración en el proveedor

- [x] 3.1 `CommandsViewProvider` (D2):
  - `commandText(id, action)` confirma tras construir el texto y devuelve `declined` si se rechaza;
  - `sendToTerminal` y `copyToClipboard` registran el rechazo con `log.info` sin escribir ni copiar, y la copia no envía `copied`.

  `extension.ts` crea el `RiskConfirmer` con `vscode.window`, los textos de `vscode.l10n.t` y `isEnabled`, que lee la configuración en cada llamada.

  Verificar: `pnpm run check-types` y `pnpm run lint`.
- [x] 3.2 Test de integración en `src/test/extension.test.ts`: con `devcommands.confirmDestructive` a `false` en `ConfigurationTarget.Global`, `copyToClipboard('git.reset-hard')` devuelve `true` y el portapapeles contiene `git reset --hard`. El ajuste se restaura en `finally`.

  Verificar: `pnpm run verify`.
- [x] 3.3 Documentación:
  - `docs/ROADMAP.md`: en el flujo de un clic, la confirmación va después de los valores y también al copiar; marcar 2.3 ✅ y añadir la casilla de `risk-confirmation`;
  - `CHANGELOG.md` (`[Unreleased]`): el aviso modal y el ajuste;
  - `README.md`: el aviso y cómo desactivarlo.

  Verificar: lectura del diff.

## 4. Verificación manual

- [x] 4.1 F5 en Windows:
  - **PowerShell:**
    - enviar `git.reset-hard`: aparece el aviso con `git reset --hard` y "Escribir en la terminal"; al confirmar, se escribe sin ejecutarse;
    - enviar `terminal.remove-directory` con `mis cosas`: el aviso sale después del cuadro, con `Remove-Item -Recurse -Force 'mis cosas'`;
    - Escape en el cuadro del valor: no aparece ningún aviso.
  - **Escape en el aviso de `git.clean`:** no se escribe nada y el registro de DevCommands muestra una línea de info, no un error.
  - **Copiar `docker.system-prune`** con el botón y con `Ctrl+C`:
    - aparece el aviso con el botón "Copiar";
    - al confirmar, el portapapeles tiene el comando y la vista muestra ✓;
    - al cancelar, ni portapapeles ni ✓.
  - **`git.amend` (`caution`):** sin aviso.
  - **Ajuste:**
    - desactivar "Confirm Destructive" en la configuración de usuario: `git.reset-hard` se escribe sin aviso, sin recargar;
    - la descripción aparece en español;
    - en la configuración del workspace el ajuste no aparece.
  - **Lector de pantalla:** anuncia el mensaje y el detalle del aviso.

## 5. Cierre

- [x] 5.1 Dejar en verde `pnpm run verify` y `openspec validate risk-confirmation --strict`. Hacer `/opsx:archive` antes de abrir el PR a `develop`.
