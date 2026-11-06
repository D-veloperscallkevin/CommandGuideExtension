# Tasks

## 1. Manifiesto y README

- [x] 1.1 Añadir `"sponsor": { "url": "https://github.com/sponsors/D-veloperscallkevin" }` a `package.json` y una sección `## Support` en el README, antes de `## License`, con el enlace a esa página. Verificar con casos nuevos en `test/unit/scripts/listing.test.ts`:
  - `pkg.sponsor.url` es esa URL;
  - el README tiene `## Support` antes de `## License`, con el enlace.

## 2. Protocolo y apertura de la URL

- [x] 2.1 Añadir `{ type: 'openSponsor' }` a `WebviewMessage` y a `webviewMessageFields` en `src/messaging/protocol.ts`, y actualizar su comentario. Verificar con casos nuevos en `test/unit/messaging/protocol.test.ts`:
  - `{ type: 'openSponsor' }` es válido;
  - con `url` o con cualquier otro campo extra se rechaza.
- [x] 2.2 Crear `src/sponsor/sponsorLink.ts`, sin importar `vscode`, con:
  - `sponsorUrl(packageJSON)`: `https://github.com/sponsors/…` válido, o `undefined`;
  - `openSponsor({ url, openExternal, parse, log })`: sin URL, advertencia y nada más; con URL, `openExternal(parse(url))`. Si devuelve `false`, se registra como información; si falla, como error.

  Verificar con `test/unit/sponsor/sponsorLink.test.ts`:
  - URL correcta;
  - `http://`, otro dominio, `https://github.com/sponsorsX`, un número, sin campo o sin `url` → `undefined`;
  - abre exactamente la URL dada;
  - sin URL no llama a `openExternal` y registra la advertencia;
  - con `openExternal` → `false` o con un rechazo no lanza.

## 3. Extensión

- [x] 3.1 En `CommandsViewProvider`, añadir el parámetro `openSponsor: () => Promise<void>` antes de `catalog` y el `case 'openSponsor'`. En `src/extension.ts`, pasarle `() => openSponsor({ url: sponsorUrl(context.extension.packageJSON), openExternal: vscode.env.openExternal, parse: vscode.Uri.parse, log })`. Verificar con `pnpm run check-types` y `pnpm run lint`, y con un test de integración nuevo en `src/test/extension.test.ts` que compruebe que el `packageJSON` de la extensión instalada da una `sponsorUrl` válida.

## 4. Panel

- [x] 4.1 Añadir las claves `sponsor` y `sponsorLabel` a los 11 diccionarios de `webview-ui/src/i18n/`:
  - inglés: "Sponsor" y "Sponsor DevCommands Guide on GitHub (opens in the browser)";
  - español: "Patrocinar" y "Patrocinar DevCommands Guide en GitHub (se abre en el navegador)";
  - el resto, traducidos.

  Verificar con `test/unit/i18n/webview-dictionaries.test.ts` en verde.
- [x] 4.2 En `webview-ui/src/App.tsx`, añadir el botón al principio de `<main>`, antes del indicador de shell, con:
  - `<Icon name="heart" />`, `t('sponsor')` y `aria-label={t('sponsorLabel')}`;
  - `onClick` → `postMessage({ type: 'openSponsor' })`;
  - estilos en `index.css` con las variables del tema.

  Verificar con `pnpm run lint:webview` y `pnpm run build:webview`.

## 5. Ajustes tras la primera revisión

- [x] 5.1 Cambiar `examplesFor` por "Terminal: {shell}" en los 11 idiomas, con el nombre del shell en un `<span>` con una clase por shell (`shell-powershell`, `shell-bash`, `shell-zsh`, `shell-cmd`).
  - Colores: `--vscode-terminal-ansiBright*` en los temas oscuros y `--vscode-terminal-ansi*` en los claros, con `body.vscode-light`.
  - En alto contraste, `--vscode-foreground`.

  Verificar con los tests de diccionarios en verde y con un test de `shellLabel`/clase.
- [x] 5.2 Poner el indicador y el botón Sponsor en una misma fila: indicador a la izquierda, botón a la derecha y salto de línea si el panel es estrecho. Separar el buscador de esa fila y dejar un espacio debajo del buscador antes de la lista. Verificar con `pnpm run lint:webview` y `pnpm run build:webview`, y en F5.
- [x] 5.3 Añadir al título del README un enlace de texto `[♥ Sponsor](https://github.com/sponsors/D-veloperscallkevin)` y actualizar `command-list` (spec del indicador) con su delta. Verificar con un caso nuevo en `listing.test.ts`: la primera línea es el título con el enlace.

## 6. Documentación

- [x] 6.1 En `CHANGELOG.md`, bajo `## [Unreleased]`, añadir `### Added` con el botón Sponsor en el panel y en la ficha. En `docs/ROADMAP.md`, marcar la fila 2.11 con ✅ y la casilla `sponsor-button`. Verificar con `pnpm run verify` en verde.

## 7. Prueba manual (F5)

- [x] 7.1 Dar al autor la lista de comprobación en F5:
  - el botón arriba, antes de "Ejemplos para", en el inicio, en una categoría, en Favoritos, en Recientes y en la búsqueda;
  - con Tab y Enter abre GitHub Sponsors (VS Code no pregunta: github.com es de confianza);
  - en español dice "Patrocinar";
  - con los temas claro, oscuro y de alto contraste;
  - el lector de pantalla (Narrador de Windows, `Ctrl+Win+Enter`) lee su nombre;
  - la terminal y el portapapeles no cambian.

  Anotar aquí el resultado.

  *Resultado:* en la primera revisión el autor pidió el botón en la misma fila que el indicador, "Terminal: …" con un color por shell, más separación del buscador y un enlace junto al título del README (tareas 5.1 a 5.3). Al abrir GitHub, VS Code no pregunta porque es un dominio de confianza, y se decidió no añadir un aviso propio. Tras corregir el ancho del botón (la clase `.back` lo forzaba al 100 %), todo funciona.
