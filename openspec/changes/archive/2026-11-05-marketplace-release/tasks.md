# Tasks

## 1. Empaquetado (lógica pura)

- [x] 1.1 `scripts/release-check.mjs` (D4):
  - `isPreRelease(version)` y `missingFiles(paths, required)`;
  - `ThirdPartyNotices.txt` en `ROOT_FILES`.

  Tests en `test/unit/scripts/release-check.test.ts` (D7). Verificar: `pnpm run test:unit`.
- [x] 1.2 `scripts/release-package.mjs`:
  - `--pre-release` solo si `isPreRelease(pkg.version)`;
  - tras `vsce ls`, falla nombrando cada archivo obligatorio que falte (el `icon` del manifiesto y `ThirdPartyNotices.txt`).

  Verificar: `pnpm run lint`.

## 2. Icono

- [x] 2.1 Dibujar `media/logo.svg` (128×128, D2): libro abierto con `>_` en el espacio de las páginas, fondo transparente.
- [x] 2.3 Redibujar `media/icon.svg` (24×24) como el libro con `>_` monocromo (`currentColor`, sin colores propios). Test en `listing.test.ts`: el SVG solo usa `currentColor` o `none`. Verificar: `pnpm run test:unit`.
- [x] 2.2 Crear `scripts/export-icon.mjs` (Chrome headless, D2) y generar `media/icon.png` de 128×128. Comprobar el resultado viendo la imagen.

## 3. Manifiesto, licencia y avisos

- [x] 3.1 `package.json` (D1, D6):
  - `displayName: "DevCommands Guide"` y `version: "1.0.0"`;
  - `license: "SEE LICENSE IN LICENSE"` e `icon: "media/icon.png"`;
  - `categories`, `keywords`, `homepage`, `bugs`, `pricing` y `galleryBanner`;
  - `ovsx` como `devDependency` (con `pnpm add -D`, revisando sus scripts de instalación en `pnpm-workspace.yaml` si los tiene).
- [x] 3.2 Reescribir `LICENSE` como licencia propietaria (D3). Crear `ThirdPartyNotices.txt` con React, react-dom, scheduler y codicons, copiando sus textos de licencia de `node_modules`.
- [x] 3.3 Test nuevo `test/unit/scripts/listing.test.ts` (D7):
  - manifiesto de tienda;
  - cabecera del PNG de 128×128;
  - avisos de terceros;
  - README sin "Work in progress" ni `.svg`, con sus imágenes relativas en `docs/images/*.png`.

  Verificar: `pnpm run test:unit`.

## 4. Documentación

- [x] 4.1 README (D5):
  - quitar el aviso "Work in progress";
  - resumen y lista de lo que ofrece;
  - las 5 capturas `docs/images/{panel,search,params,destructive,quick-pick}.png`;
  - sección License propietaria con enlace a `ThirdPartyNotices.txt`;
  - Packaging con `devcommands-<version>.vsix`.
- [x] 4.2 CHANGELOG (D6): `[Unreleased]` pasa a `[1.0.0] - <fecha>`, con un "Changed" de nombre visible, icono, licencia y paquete estable, y un `[Unreleased]` vacío encima.
- [x] 4.3 ROADMAP (D6, D6b):
  - 2.9 ✅ y su checkbox;
  - la entrada de la tabla con `vsce publish --packagePath`;
  - la sección "Publicación" con los pasos manuales;
  - la pregunta de la licencia y la decisión del nombre resueltas.
- [x] 4.4 Verificar: `pnpm run verify` y `pnpm run release:package`. Este último debe generar `devcommands-1.0.0.vsix` sin pre-release, con `media/icon.png` y `ThirdPartyNotices.txt`, sin `docs/` y por debajo de 2 MB.

## 5. Capturas (las toma el autor)

- [x] 5.1 Dar al autor la lista de capturas con sus nombres de archivo, y que las guarde en `docs/images/`:
  - `panel.png`: el panel con las categorías y la sección "En este proyecto";
  - `search.png`: una búsqueda con resultados;
  - `params.png`: el cuadro que pide un parámetro;
  - `destructive.png`: la confirmación de un destructivo;
  - `quick-pick.png`: el buscador de la paleta.

  Comprobar que el test del README sigue en verde y que la vista previa del README (`Ctrl+Shift+V`) muestra las 5 imágenes.

  *Lista entregada. El autor aplazó las capturas: se añaden antes del release v1.0.0, como paso de la lista de "Siguientes pasos" del ROADMAP. Hasta entonces el README de GitHub muestra las 5 imágenes rotas.*

## 6. Comprobación manual

- [x] 6.1 Con el `.vsix` instalado en una ventana normal de VS Code en Windows (`code --install-extension devcommands-1.0.0.vsix --force`):
  - la vista de extensiones muestra "DevCommands Guide", el icono del libro, la versión 1.0.0 sin la etiqueta de pre-release y la licencia propietaria;
  - el icono de la barra de actividad es el libro con `>_` monocromo y se ve bien en un tema claro y en uno oscuro;
  - la vista se sigue llamando "DevCommands" y conserva favoritos e historial;
  - enviar un comando a PowerShell funciona.

  Tras la prueba, desinstalar con `code --uninstall-extension aguilardigital.devcommands` si se quiere volver al modo F5.

  *Resultado:* todo correcto. Al reinstalar la misma versión, las ventanas abiertas mostraban el icono anterior hasta cerrar VS Code (caché); el `>` del icono monocromo se centró. Con Claude Code abierto en la terminal activa, el comando se escribió en esa terminal: queda para el change 2.10 `busy-terminal`.

## 7. Cierre

- [x] 7.1 Dejar en verde `pnpm run verify` y `openspec validate marketplace-release --strict`. Archivar el change antes de abrir el PR a `develop`.
