# Tasks

## 1. Protocolo

- [x] 1.1 Añadir `sendToTerminal` a `WebviewMessage` y validar campo a campo en `isWebviewMessage` (D1). Tests en `protocol.test.ts`:
  - acepta `sendToTerminal` con id válido;
  - rechaza `commandId` ausente, numérico, vacío o de 201 caracteres;
  - rechaza la clave extra `text`;
  - los casos de `ready` siguen pasando.

  Verificar con `pnpm run test:unit`

## 2. Terminal

- [x] 2.1 Crear `src/terminal/TerminalService.ts` (D2) y `test/unit/terminal/TerminalService.test.ts` con un host falso:
  - usa la terminal activa sin crear otra;
  - sin terminal activa crea "DevCommands";
  - llama a `show(false)` antes que a `sendText(texto, false)`;
  - nunca pasa `shouldExecute` `true`.

  Añadir `src/terminal` al `include` de `test/unit/tsconfig.json`. Verificar con `pnpm run test:unit`
- [x] 2.2 `CommandsViewProvider` atiende `sendToTerminal` con `sendToTerminal(commandId)` público (D3); `activate` crea `TerminalService(vscode.window)` y la API de pruebas expone `sendToTerminal`. Test de integración: cerrar las terminales, llamar a `api.sendToTerminal('git.status')` y comprobar que la terminal activa se llama "DevCommands"; con `'git.nope'` no se crea ninguna terminal. Verificar con `pnpm run check-types`, `pnpm run lint` y `pnpm test`

## 3. Webview

- [x] 3.1 Convertir las filas de `CommandList.tsx` en botones que envían `sendToTerminal`, con el icono `terminal` al pasar el ratón o enfocar, `aria-describedby` y `title` (D4). Añadir `sendToTerminalHint` en los 11 idiomas (D5) y ajustar los estilos (`cursor`, icono visible solo con hover o foco). Verificar con `pnpm run test:unit` (diccionarios), `pnpm run lint:webview` y `pnpm run build:webview`

## 4. Verificación manual (F5)

- [x] 4.1 Con F5, en Windows con PowerShell:
  - sin terminales abiertas, clic en "Show status" crea "DevCommands", le da el foco y deja `git status` escrito sin ejecutar; Enter lo ejecuta;
  - con una terminal ya activa, el comando va a esa terminal;
  - Enter y Espacio sobre un comando enfocado también lo envían;
  - "Create a branch" escribe `git checkout -b feature/my-change`;
  - el icono de terminal aparece al pasar el ratón o con el foco, y el tooltip se ve;
  - en español, el tooltip dice "Escribe el comando en la terminal sin ejecutarlo".

  El autor confirma. La prueba en bash queda cubierta por el test de integración en WSL antes de la release

## 5. Documentación

- [x] 5.1 `CHANGELOG.md` (`[Unreleased]` → Added: clic en un comando lo escribe en la terminal sin ejecutarlo), `README.md` (uso y limitaciones: terminal ocupada y texto ya escrito en la línea) y `docs/ROADMAP.md` (1.4 ✅ y casilla en Siguientes pasos). Verificar con grep

## 6. Verificación final

- [x] 6.1 `pnpm run verify` en verde, `openspec validate send-to-terminal --strict` sin errores y `/opsx:archive` antes de abrir el PR a `develop`
