# Proposal

## Why

La Fase 2 (v1) se cierra con la extensión publicada en el Marketplace de VS Code y en Open VSX (puerta "v1.0.0 pública"). Hoy el paquete no se puede publicar tal cual:
- no tiene icono PNG;
- el README se presenta como "Work in progress" y no tiene capturas;
- la licencia del repo no es la elegida;
- `release:package` marca siempre el paquete como pre-release.

Este change, el 2.9 y último de la Fase 2 (v1), deja el paquete listo para que el autor lo publique a mano tras el tag `v1.0.0`.

## What Changes

- **Identidad de tienda.** El nombre visible pasa a ser "DevCommands Guide". El id sigue siendo `aguilardigital.devcommands`, así que se conservan los favoritos, el historial y los ajustes. El manifiesto gana:
  - `icon`, `keywords`, `homepage`, `bugs`, `galleryBanner` y `pricing`;
  - las categorías `Other` y `Education`.
- **Icono.** Un libro abierto con `>_` en el espacio de las páginas (`media/logo.svg`), exportado a `media/icon.png` de 128×128. El icono de la barra de actividad (`media/icon.svg`) pasa a ser el mismo libro con `>_` en versión monocroma, porque VS Code solo admite ahí iconos de un color que tiñe según el tema.
- **Licencia propietaria (BREAKING en lo legal, no en el funcionamiento).**
  - `LICENSE` pasa de MIT a "All rights reserved", con permiso para instalar y usar la extensión gratis.
  - `package.json` declara `SEE LICENSE IN LICENSE`.
  - Nuevo `ThirdPartyNotices.txt` con los avisos de React, react-dom, scheduler y codicons, que van dentro del paquete.
- **README para la tienda.**
  - Sin el aviso "Work in progress".
  - Un resumen de lo que ofrece y capturas en `docs/images/*.png`. Las toma el autor con una lista fija; quedan fuera del `.vsix` y vsce las enlaza al repo público.
  - La sección License describe la licencia nueva.
- **Versión 1.0.0.**
  - `release:package` solo marca pre-release las versiones `0.x`.
  - Acepta `ThirdPartyNotices.txt` en el paquete y exige que el paquete incluya el icono.
  - El CHANGELOG cierra `[Unreleased]` como `[1.0.0]`.
- **Publicación manual documentada en el ROADMAP.**
  - Registro del publisher en el Marketplace y del namespace en Open VSX.
  - Tras el tag `v1.0.0` en `main`: `vsce publish --no-dependencies` y `ovsx publish`, con tokens del autor.
  - Sin GitHub Actions ni servicios de pago.

## Capabilities

### New Capabilities
- `marketplace-listing`: lo que muestra la extensión en las tiendas:
  - nombre visible, icono, metadatos, licencia y avisos de terceros;
  - README con capturas;
  - procedimiento de publicación manual.

### Modified Capabilities
- `continuous-integration`:
  - **Empaquetado local verificado:** la lista de archivos permitidos incluye `ThirdPartyNotices.txt`, y el paquete debe incluir `media/icon.png`.
  - **Identidad del paquete:** el nombre visible es "DevCommands Guide" y solo las versiones `0.x` son pre-release; la `1.0.0` se empaqueta como estable.

## Impact

- **Manifiesto y documentación:** `package.json` (`displayName`, `version`, `license`, `icon` y metadatos), `LICENSE`, `ThirdPartyNotices.txt` (nuevo), `README.md`, `CHANGELOG.md` y `docs/ROADMAP.md`.
- **Recursos:** `media/logo.svg` y `media/icon.png`, ambos nuevos. Las capturas en `docs/images/` las añade el autor.
- **Scripts:**
  - `scripts/release-check.mjs` (lista permitida, pre-release según la versión, icono obligatorio);
  - `scripts/release-package.mjs`;
  - `scripts/export-icon.mjs` (nuevo), que exporta el PNG con Chrome headless de una sola vez, sin dependencias nuevas.
- **Tests:** `test/unit/scripts/release-check.test.ts` y un test nuevo del manifiesto de tienda.
- **Sin cambios de comportamiento** en la extensión ni en su API. Los nombres de la vista y de la categoría "DevCommands" de la paleta no cambian.
