## 1. Comprobaciones puras

- [x] 1.1 Crear `scripts/release-check.mjs` (D2) con:
  - `MAX_VSIX_BYTES`, `checkSize`, `disallowedFiles`, `formatBytes` y `vsixName`.

  Tests en `test/unit/scripts/release-check.test.ts`:
  - el tamaño justo por debajo del límite pasa y 2 MB exactos fallan;
  - se permiten `dist/extension.js`, `dist/webview/assets/index.js`, `media/icon.svg`, `l10n/bundle.l10n.es.json`, `package.nls.ja.json`, `package.json`, `README.md`, `CHANGELOG.md` y `LICENSE`;
  - se rechazan `dist/extension.js.map`, `src/extension.ts`, `node_modules/x/index.js`, `catalog/git.json` y `devcommands-0.0.1.vsix`;
  - las rutas con `\` se normalizan;
  - `formatBytes` y `vsixName`.

  Verificar con `pnpm run test:unit` y `pnpm run check-types`; anotar en D2 cómo quedan los tipos.

## 2. vsce y manifiesto

- [x] 2.1 `pnpm add -D --save-exact @vscode/vsce`. Si la instalación pide revisar scripts, añadirlos a `allowBuilds` con `false` y un comentario (D3). Comprobar que `pnpm install --frozen-lockfile` pasa.
- [x] 2.2 En `package.json` (D4):
  - `publisher` `aguilardigital`, `repository`, `"vsce": { "dependencies": false }`, `version` `0.1.0` y el script `release:package`.

  En `src/test/extension.test.ts`, buscar la extensión con `getExtension('aguilardigital.devcommands')`.
- [x] 2.3 Añadir `*.vsix` a `.vscodeignore` (D5).

## 3. Script de empaquetado

- [x] 3.1 Crear `scripts/release-package.mjs` (D1): `vsce ls`, comprobación, `vsce package --no-dependencies --pre-release --out`, nueva comprobación de la lista, comprobación del tamaño y resumen. Cada fallo nombra su motivo y termina con código 1.
- [x] 3.2 Ejecutar `pnpm run release:package` en Windows y comprobar que:
  - genera `devcommands-0.1.0.vsix` de menos de 2 MB;
  - la lista de archivos es la esperada.

  Si `vsce ls` muestra algo no permitido, corregir `.vscodeignore` (D5). Probar el fallo con un archivo que `.vscodeignore` no excluya (por ejemplo `notas-temporales.txt` en la raíz) y borrarlo después. Un `dist/extension.js.map` no sirve: `.vscodeignore` ya lo excluye (`**/*.map`), así que nunca entra en el paquete, y la regla de D2 queda como segunda barrera.

  Resultado: 240 KB y 32 archivos. Con un archivo suelto en la raíz falla antes del build y lo nombra.

## 4. Versión y documentación

- [x] 4.1 `CHANGELOG.md`: `[Unreleased]` pasa a `[0.1.0] - 2026-11-02` y se añade un `[Unreleased]` vacío encima (D4).
- [x] 4.2 Documentación (D6):
  - en `docs/ROADMAP.md`:
    - sección "Empaquetado y prueba del `.vsix`";
    - quitar el publisher de las decisiones pendientes de la 2.9;
    - 1.8 ✅ y su checkbox;
  - en `README.md`, la sección "Packaging".

## 5. Verificación manual

- [x] 5.1 Instalar el `.vsix` y probarlo:
  - **Windows:**
    - `code --install-extension devcommands-0.1.0.vsix --force`;
    - en una ventana normal de VS Code (no F5), la extensión aparece como `aguilardigital.devcommands` y marcada como pre-release;
    - la vista carga, y de categoría a comando en una terminal PowerShell se llega en 3 clics o menos;
    - la búsqueda y el botón de copiar funcionan;
  - **WSL:**
    - abrir una carpeta con Remote-WSL e instalar el `.vsix` en WSL;
    - los ejemplos de Terminal salen en bash;
    - enviar un comando a una terminal bash funciona.

- [x] 5.2 Arreglo encontrado en la prueba en WSL (D7): en una terminal recién creada, esperar a que el shell esté listo antes de escribir (máximo 3 segundos).
  - `TerminalService.write` asíncrono y `CommandsViewProvider` sin bloquear la vista;
  - tests: la terminal activa no espera; la nueva espera al evento de su terminal (no al de otra); sin evento o sin la API, escribe al agotar la espera; nunca se ejecuta;
  - delta de `terminal-integration`;
  - reinstalar el `.vsix` y repetir en WSL el envío sin terminales abiertas: el comando queda detrás del prompt.

## 6. Cierre

- [x] 6.1 Dejar en verde `pnpm run verify` y `openspec validate release-pipeline --strict`. Hacer `/opsx:archive` antes de abrir el PR a `develop`, indicando en el PR el tamaño del `.vsix`.
