# Proposal

## Why

DevCommands va a publicarse para todo el mundo, pero hoy solo admite dos idiomas fijados en el código: el schema del catálogo exige exactamente `en` y `es`, `Locale` es `'en' | 'es'` y cualquier idioma de VS Code que no sea español cae a inglés. Además, la interfaz no tiene ninguna infraestructura de traducción: el webview muestra textos en inglés escritos a mano y la descripción del manifiesto está en español. Antes de construir las vistas de la Fase 1 hace falta que todas nazcan traducidas.

**Fase del roadmap:** v0.1.0 pre-release, Fase 1 (change 1.1, el primero de la fase).

## What Changes

- La interfaz (manifiesto, textos de la extensión y webview) se traduce a **11 idiomas**: `en`, `es`, `pt-br`, `fr`, `de`, `it`, `ja`, `ko`, `zh-cn`, `zh-tw` y `ru`. El idioma activo es siempre el de VS Code, sin ajuste propio.
- Resolución del idioma generalizada: coincidencia exacta, después por idioma base (`es-419` → `es`, `pt` → `pt-br`, `zh-hk` → `zh-tw`) y fallback a inglés.
- **Catálogo:** `en` y `es` siguen siendo obligatorios. Los otros 9 idiomas pasan a ser **opcionales por campo**: si falta una traducción, se muestra la inglesa.
- Manifiesto localizado con `package.nls.json` (inglés por defecto) y un `package.nls.<idioma>.json` por idioma.
- Infraestructura `vscode.l10n` (`l10n/bundle.l10n.<idioma>.json`) para los textos de la extensión que lleguen en los changes siguientes.
- Diccionario tipado del webview con `t()`: TypeScript y los tests impiden que falte una clave en cualquier idioma.
- El mensaje `init` admite cualquiera de los 11 idiomas.
- Docs: idiomas disponibles en el README, guía de traducción del catálogo y método de merge de las releases en el ROADMAP.

Fuera de alcance: traducir el contenido del catálogo a los 9 idiomas opcionales (llegará con la comunidad y con `catalog-content` si se decide), y un ajuste para elegir idioma distinto al de VS Code.

## Capabilities

### New Capabilities
- `ui-localization`: idiomas soportados por la interfaz, manifiesto y textos de la extensión y del webview traducidos, y garantía de que ningún idioma tiene textos sin traducir.

### Modified Capabilities
- `command-catalog`: los textos localizados aceptan los 9 idiomas opcionales además de `en` y `es`, y la resolución del idioma pasa de "español o inglés" a los 11 idiomas con fallback por campo.
- `webview-messaging`: `init.locale` puede ser cualquiera de los 11 idiomas.

## Impact

- **Catálogo:** `catalog/schema.json`, `src/catalog/types.ts`, `src/catalog/CatalogService.ts` (`resolveLocale`, `localize`, `buildExample`) y `catalog/README.md`. Los JSON existentes siguen siendo válidos sin cambios.
- **Extensión:** nuevo `src/i18n/locales.ts` (lista de idiomas soportados), `package.json` (`%claves%`, campo `l10n`), `package.nls*.json` y `l10n/bundle.l10n.*.json`.
- **Webview:** nuevo `webview-ui/src/i18n/` (un diccionario por idioma y `t()`), `App.tsx` usa `t()`.
- **Tests:** Vitest para la resolución del idioma, el fallback, la completitud de diccionarios, `package.nls` y bundles.
- **Dependencias:** ninguna nueva.
- **Mensajes webview ↔ extensión:** `init.locale` amplía su tipo. Sin mensajes nuevos.
- **Tamaño:** los 11 diccionarios son unos pocos KB.
