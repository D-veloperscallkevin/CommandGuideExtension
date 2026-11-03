## 1. Escapado y validación (funciones puras)

- [x] 1.1 Crear `src/params/escape.ts` con `quoteContexts`, `validateValue`, `escapeValue` y `buildCommandText` (D2–D5). Tests en `test/unit/params/escape.test.ts`:
  - contextos: suelto, dentro de `"…"`, dentro de `'…'`, comillas de un tipo dentro del otro; en cmd, `'` fuera de comillas dobles es literal y dentro abre `nestedSingle`;
  - validación: vacío y solo espacios, `\n`, `\r`, `\t`, U+0085, U+2028, 501 caracteres, `"` y `%` solo en cmd, `trim()`;
  - valores seguros sin comillas en cada shell (`feature/login`, `node:20`, `8080:80`, `C:\temp\log.txt` en powershell y cmd) y los que dejan de serlo (`~/x` y `=x` en bash, `-x`, `@x` y `a,b` en powershell, `a=b` en cmd);
  - cada celda de la tabla de la spec, con `'`, `"`, `$`, `` ` ``, `!`, espacios y comillas tipográficas;
  - todos los escenarios de la spec `command-params` (`git.commit` en bash y powershell, `terminal.follow-file` en cmd, `terminal.find-files` con `*.ts`…);
  - un parámetro que aparece dos veces se escapa en cada sitio según su contexto.

  Verificar: `pnpm run test:unit`.
- [x] 1.2 Comprobación con shells reales: un script temporal (no se sube) que, para una lista de valores difíciles, construya `printf '%s\n' ${x}` en bash, `Write-Output ${x}` en PowerShell y `echo ${x}` en cmd en sus tres contextos, lo ejecute y compare la salida con el valor. Anotar en D4 los ajustes que salgan.

  Verificar: todos los valores vuelven idénticos en bash (Git Bash y WSL) y PowerShell; en cmd, los valores admitidos.

## 2. Petición de valores

- [x] 2.1 Crear `src/params/ParamPrompter.ts` (D1, D8) sobre una interfaz mínima de `window`. Tests en `test/unit/params/ParamPrompter.test.ts` con una ventana falsa:
  - un parámetro: título sin paso, `prompt`, `placeHolder` e `ignoreFocusOut`;
  - dos parámetros: `(1/2)` y `(2/2)`, en orden;
  - cancelar el segundo devuelve `undefined` y no abre más;
  - `validateInput` devuelve los mensajes traducidos y acepta valores válidos;
  - los valores se devuelven recortados;
  - textos en `es` y fallback a `en` de etiqueta y placeholder.

  Verificar: `pnpm run test:unit`.
- [x] 2.2 `l10n/bundle.l10n.*.json`: las cinco claves de D8 en los 10 idiomas.

  Verificar: el test de l10n existente pasa.

## 3. Integración

- [x] 3.1 `CommandsViewProvider` (D5): `resolveCommandText` asíncrono con el shell fijado al pulsar; `sendToTerminal` y `copyToClipboard` lo usan; la cancelación se registra con `log.info` y no envía `copied`. `extension.ts` pasa `new ParamPrompter(vscode.window)` (u otra forma de inyección) al proveedor.

  Verificar: `pnpm run check-types`, `pnpm run test:unit` y los tests de integración (`git.status` sigue sin cuadros).
- [x] 3.2 `catalog/terminal.json`: variante cmd de `terminal.follow-file` (D6). Probarla en un cmd real con `it's log.txt`.

  Verificar: `pnpm run test:unit` (validación y contenido del catálogo).
- [x] 3.3 Documentación:
  - `docs/ROADMAP.md`: el flujo de un clic y la regla de seguridad dicen que el webview envía solo el `id`; 2.2 ✅ y la casilla de `command-params`;
  - `CHANGELOG.md` `[Unreleased]`: los valores de los parámetros se piden y se escapan según el shell;
  - `README.md`: el texto sobre "replace it before pressing Enter" pasa a describir los cuadros.

  Verificar: revisar el diff de la documentación.

## 4. Verificación manual

- [x] 4.1 F5 en Windows:
  - PowerShell: `git.new-branch` con `feature/login`; `terminal.remove-directory` con `mis cosas`; `git.commit` con `usa $env:PATH y 'comillas'`; Escape en el segundo cuadro de `terminal.copy` no escribe nada;
  - Git Bash: `git.commit` con `fix: "hola"!` y `terminal.show-file` con `it's.txt`;
  - cmd: `terminal.remove-directory` con `mis cosas`; `terminal.follow-file` con `it's log.txt`; un valor con `%` se rechaza;
  - copiar `git.new-branch` con el botón y con `Ctrl+C`: el portapapeles tiene el valor escrito y la vista confirma; al cancelar, no confirma;
  - con el lector de pantalla, el cuadro anuncia el título, la etiqueta y los errores.

  En WSL (Remote-WSL, con el `.vsix`), `git.new-branch` con `feature/login` funciona. Pendiente: se comprobará en la prueba en WSL previa al release.

  Nota: en Git Bash, si la línea ha recibido antes un Escape, readline toma la primera letra como Alt+letra (`cat` llega como `at`). Es comportamiento de bash, no de la extensión: en una terminal sin ese Escape el comando llega completo.

## 5. Cierre

- [x] 5.1 Dejar en verde `pnpm run verify` y `openspec validate command-params --strict`. Hacer `/opsx:archive` antes de abrir el PR a `develop`.
