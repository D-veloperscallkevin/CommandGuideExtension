# Design

## Context

**Estado actual del paquete:**
- `package.json` ya declara `publisher: "aguilardigital"`, `name: "devcommands"`, `displayName: "DevCommands"`, `version: "0.1.0"`, `license: "MIT"`, `repository` y `categories: ["Other"]`.
- Sin icono de extensión: solo `media/icon.svg`, que es el icono monocromo de la barra de actividad.
- `LICENSE` es MIT a nombre del autor.
- El README abre con "Work in progress (pre-release)" y no tiene imágenes.

**Empaquetado actual:**
- `scripts/release-package.mjs` llama siempre a `vsce package` con `--pre-release`.
- `scripts/release-check.mjs` contiene las comprobaciones puras: tamaño, lista permitida y nombre del `.vsix`. Las prueba `test/unit/scripts/release-check.test.ts`.
- `.vscodeignore` ya excluye `docs/**`.

**Componentes de terceros dentro del `.vsix`:**
- El bundle del webview incluye React 19.3.1, react-dom 19.3.1 y scheduler 0.28.0, todos con licencia MIT.
- La fuente de `@vscode/codicons` 0.0.46-24: los iconos tienen licencia CC BY 4.0 y el código MIT.
- La extensión no tiene dependencias de runtime fuera del bundle (`vsce.dependencies: false`).

**Restricciones:**
- No usamos GitHub Actions ni servicios de pago.
- Usamos pnpm.
- El `.vsix` debe pesar menos de 2 MB.
- El repo es público, con `main` como rama por defecto.
- Chrome está instalado en el equipo del autor.

## Goals / Non-Goals

**Goals:**
- Dejar el `.vsix` de la `1.0.0` listo para publicarse en ambas tiendas sin tocar nada más.
- Ficha completa: nombre, icono, metadatos, licencia, avisos de terceros y README con capturas.
- `release:package` decide pre-release o estable según la versión y comprueba el icono y los avisos.
- Pasos de publicación manual documentados.

**Non-Goals:**
- Publicar. Lo hace el autor con sus tokens después del release a `main`.
- Automatizar la publicación (CI, Actions) o guardar tokens.
- Cambiar el comportamiento de la extensión, su API o sus mensajes webview↔extensión. Este change no afecta a ningún mensaje.
- Renombrar el id, la vista o la categoría de la paleta.
- Traducir el README. Sigue en inglés, como ahora.
- Tomar las capturas: las toma el autor con la lista de la tarea 6.1.

## Decisions

### D1. Nombre visible sin cambiar el id

**Qué cambia.**
- `displayName: "DevCommands Guide"`.
- `name` sigue siendo `devcommands`, así el id `aguilardigital.devcommands` y el estado guardado (globalState de favoritos e historial, ajustes `devcommands.*`) se mantienen.
- La vista y la categoría "DevCommands" de la paleta no cambian. Son cortas y ya están en los 11 idiomas.

**Metadatos que se añaden:**

| Campo | Valor |
| --- | --- |
| `categories` | `["Other", "Education"]` |
| `keywords` | git, npm, pnpm, node, docker, terminal, commands, cheatsheet |
| `homepage` | README del repo |
| `bugs.url` | issues del repo |
| `pricing` | `"Free"` |
| `galleryBanner` | `{ color: "#1E1E2E", theme: "dark" }`, el fondo del icono |

**Alternativa descartada:** renombrar también `name` a `devcommands-guide`. Cambiaría el id y haría perder favoritos e historial a quien ya tenga la v0.1.0.

### D2. Icono: SVG fuente y PNG exportado con Chrome headless

**El diseño (`media/logo.svg`, 128×128):**
- Un libro abierto en vista frontal sobre fondo transparente: dos páginas claras con el lomo central y la tapa en color de acento.
- En el espacio de las páginas, `>_` en trazo grueso y redondeado. Así se lee incluso a 32 px, el tamaño de la lista de extensiones.

**La exportación (`scripts/export-icon.mjs`):**
- Se ejecuta a mano (`node scripts/export-icon.mjs`) solo cuando cambia el logo, y el PNG resultante se versiona.
- Localiza Chrome (variable `CHROME_PATH` o rutas estándar de Windows, macOS y Linux) y abre en `--headless=new` un HTML temporal con el SVG a 128×128.
- Usa `--screenshot`, `--window-size=128,128` y `--default-background-color=00000000` para que el fondo quede transparente.
- No va dentro de `verify`. Así no hace falta Chrome para verificar ni en WSL.

**Alternativas descartadas:**
- `sharp` o `@resvg/resvg-js`: dependencias nativas y scripts de instalación para un uso único.
- Dibujar el PNG a mano byte a byte: inmantenible.

`media/logo.svg` queda en `media/` y entra en el `.vsix`, que ya permite esa carpeta. Ocupa unos 2 KB.

**Barra de actividad (`media/icon.svg`, 24×24).** La barra de actividad solo admite iconos de un color: VS Code usa la forma y la tiñe con el color del tema. Por eso se redibuja el mismo libro con `>_` como contorno con `stroke="currentColor"` y sin rellenos de color, con el estilo de trazo de 2 px del icono actual. La ruta `media/icon.svg` del manifiesto no cambia. *Decidido en la prueba manual:* el autor esperaba ver el logo también en la barra.

### D3. Licencia propietaria y avisos de terceros

**`LICENSE`:**
- "Copyright (c) 2026 Kevin Aguilar. All rights reserved."
- Concede una licencia gratuita, no exclusiva e intransferible para instalar y usar la extensión.
- Prohíbe copiar, modificar, redistribuir, sublicenciar o hacer ingeniería inversa salvo donde la ley lo permita.
- Aclara que los componentes de terceros se rigen por sus licencias (`ThirdPartyNotices.txt`).
- Excluye garantías y responsabilidad.
- **Nota:** es un texto estándar, no asesoramiento legal.

**`package.json`:** `"license": "SEE LICENSE IN LICENSE"`, la forma que entienden vsce y npm.

**`ThirdPartyNotices.txt` (raíz, entra en el `.vsix`):**
- Para cada componente: nombre, versión, URL, copyright y texto completo de su licencia.
- Componentes: React, react-dom y scheduler (MIT), y codicons (CC BY 4.0 para los iconos y MIT para el código).
- Los textos se copian de los `LICENSE` de `node_modules` de la versión instalada.

**El README:** su sección License describe la licencia y enlaza ambos archivos.

### D4. `release-check.mjs`: pre-release por versión y archivos obligatorios

**Dos funciones puras nuevas:**
- `isPreRelease(version)`: `true` si la versión mayor es `0`.
- `missingFiles(paths, required)`: devuelve los obligatorios que no están en la lista. Los obligatorios son `media/icon.png` (o el `icon` del manifiesto) y `ThirdPartyNotices.txt`.

**`ThirdPartyNotices.txt`** se añade a `ROOT_FILES`.

**`release-package.mjs`:**
- Pasa `--pre-release` solo si `isPreRelease(pkg.version)`.
- Tras `vsce ls` falla nombrando cada archivo que falte.

**Alternativa descartada:** un flag `--stable` en la línea de comandos. Es fácil de olvidar; la versión del manifiesto ya expresa la intención.

### D5. README de la tienda y capturas

**Estructura del README:**
- Título.
- Resumen de una frase y lista corta de lo que ofrece: más de 100 comandos, búsqueda en/es, nada se ejecuta solo, parámetros escapados, confirmación de destructivos, favoritos, recientes, comandos propios, detección del proyecto, buscador en la paleta y 11 idiomas.
- Las capturas.
- Las secciones actuales sin el aviso "Work in progress".

**Las capturas:**
- Van en `docs/images/` con nombres fijos:
  - `panel.png`
  - `search.png`
  - `params.png`
  - `destructive.png`
  - `quick-pick.png`
- Se enlazan con rutas relativas (`docs/images/panel.png`). vsce las reescribe a `https://github.com/D-veloperscallkevin/CommandGuideExtension/raw/HEAD/docs/images/...` porque el manifiesto tiene `repository` y el repo es público. Open VSX muestra el README que va en el `.vsix`, ya reescrito.
- `docs/**` ya está excluido del paquete.
- Formato PNG de un ancho aproximado de 1200–1600 px y menos de 500 KB cada una. No cuentan para el límite del `.vsix`.

La sección Packaging del README usa `devcommands-<version>.vsix` en lugar de `0.1.0`.

**Alternativa descartada:** `--baseImagesUrl` fijado a `main`. `raw/HEAD` ya apunta a la rama por defecto.

### D6. Versión 1.0.0, CHANGELOG y publicación manual

**Versión y CHANGELOG:**
- `version: "1.0.0"`.
- El CHANGELOG renombra `[Unreleased]` a `[1.0.0] - <fecha del release>` y añade a "Changed": nombre visible, icono, licencia propietaria y paquete estable.
- Deja un `[Unreleased]` vacío encima.

**Publicación, documentada en `docs/ROADMAP.md` (sección "Publicación"):**

1. **Una sola vez:**
   - crear el publisher `aguilardigital` en https://marketplace.visualstudio.com/manage, con un token de Azure DevOps de alcance *Marketplace › Manage*;
   - crear una cuenta en open-vsx.org (firmar su acuerdo de publicador) y ejecutar `pnpm exec ovsx create-namespace aguilardigital -p <token>`.
2. **Tras fusionar `staging → main`:**
   - `git checkout main && git pull`;
   - `git tag v1.0.0 && git push origin v1.0.0`.
3. **Publicar el mismo `.vsix` probado:**
   - `pnpm exec vsce publish --packagePath devcommands-1.0.0.vsix`;
   - `pnpm exec ovsx publish devcommands-1.0.0.vsix -p <token>`.
   - Los tokens se pasan por variable de entorno (`VSCE_PAT`, `OVSX_PAT`) o se escriben en la terminal, y nunca se guardan en el repo.

**Nuevas dependencias de desarrollo:**
- `ovsx` (solo `devDependency`, para publicar y crear el namespace). Si declara scripts de instalación, se revisan en `pnpm-workspace.yaml` como las demás.
- No hay dependencias de runtime nuevas.

**Alternativa descartada:** `vsce publish --no-dependencies`, que vuelve a empaquetar. Se publicaría un `.vsix` distinto del probado.

### D6b. Por qué `--packagePath` en vez de la entrada del ROADMAP

La tabla del ROADMAP decía `vsce publish --no-dependencies`. Se corrige a `--packagePath`, por la misma razón: publicar exactamente el `.vsix` que se probó en Windows y WSL.

### D7. Tests

**`test/unit/scripts/release-check.test.ts`:**
- `isPreRelease` con `0.1.0`, `0.9.9`, `1.0.0` y `2.3.4`;
- `missingFiles`, con y sin el icono y los avisos, incluyendo rutas de Windows;
- `ThirdPartyNotices.txt` permitido y `docs/images/panel.png` rechazado.

**Test nuevo `test/unit/scripts/listing.test.ts`:**
- `displayName`, `license`, `icon`, `categories`, `keywords`, `pricing` y `galleryBanner` del manifiesto;
- el PNG del icono existe y mide 128×128, leído de su cabecera IHDR sin dependencias;
- `ThirdPartyNotices.txt` menciona los cuatro componentes;
- el README no contiene "Work in progress" ni imágenes `.svg`, y cada imagen relativa que enlaza está en `docs/images/` con extensión `.png`.
- **No se comprueba** que las capturas existan: las añade el autor. Esa comprobación se hace en la tarea manual previa al PR.

## Risks / Trade-offs

- **Las capturas no existen hasta que el autor las sube.** Mientras tanto la vista previa del README muestra imágenes rotas. *Mitigación:* la tarea 6.1 da la lista exacta y el PR no se abre sin ellas.
- **Imágenes rotas en la ficha.** `raw/HEAD` apunta a `main`, así que antes del release a `main` las imágenes de una ficha publicada estarían rotas. *Mitigación:* solo se publica desde `main` tras el tag (D6).
- **Chrome headless puede variar entre versiones.** Por ejemplo, el antialiasing o la transparencia del fondo. *Mitigación:* el PNG se versiona y se revisa a ojo en F5; el script solo se usa al cambiar el logo.
- **Licencia propietaria con repo público.** El código sigue siendo visible; la licencia limita su uso, no su lectura. *Mitigación:* README y LICENSE lo dicen claramente. Se recomienda revisión legal si la extensión pasa a tener valor comercial.
- **Avisos de terceros desactualizados.** Si se actualiza React o codicons, los avisos pueden quedar viejos. *Mitigación:* el test exige los cuatro componentes; las versiones se actualizan en el change que suba las dependencias.
- **Nombre ocupado al publicar.** "DevCommands Guide" estaba libre el 2026-11-04 en ambas tiendas, pero alguien podría registrarlo antes. *Mitigación:* el autor lo comprueba otra vez al registrar el publisher; si está ocupado, solo cambia `displayName`.
