# Tasks

## 1. Idiomas y resolución

- [x] 1.1 Crear `src/i18n/locales.ts` con `SUPPORTED_LOCALES`, `Locale`, `REQUIRED_CATALOG_LOCALES` y `resolveLocale` (D1, D2). `src/catalog/types.ts` reexporta `Locale` y `CatalogService` reexporta `resolveLocale`. Añadir `src/i18n/**` al `include` de `test/unit/tsconfig.json`. Verificar con `pnpm run check-types`
- [x] 1.2 Crear `test/unit/i18n/locales.test.ts` con una tabla de casos de `resolveLocale`: `en`, `es`, `es-419`, `ES_es`, `pt`, `pt-PT`, `pt-BR`, `zh`, `zh-CN`, `zh-TW`, `zh-HK`, `zh-Hant`, `zh-Hans`, `de-CH`, `fr-CA`, `ja`, `ko-KR`, `ru`, `it`, `nl`, `xx` y la cadena vacía. Mover los casos de `resolveLocale` de `CatalogService.test.ts`. Verificar con `pnpm run test:unit`

## 2. Catálogo con idiomas opcionales

- [x] 2.1 Actualizar `LocalizedString` y `LocalizedTags` en `src/catalog/types.ts` y en `catalog/schema.json` (D3), y añadir el test que compara las propiedades del schema con `SUPPORTED_LOCALES`. Verificar con `pnpm run test:unit` (los JSON actuales siguen validando)
- [x] 2.2 Añadir a `test/unit/catalog/schema.test.ts` los escenarios "Idioma opcional" (`title` con `fr` valida) y "Clave de idioma desconocida" (`fr-fr` falla), con fixtures en `test/unit/fixtures/invalid-schema/`. Verificar con `pnpm run test:unit`
- [x] 2.3 `localize` con fallback a `en` y nuevo `localizeTags` (D4). Tests en `CatalogService.test.ts`: título `fr` presente, título `de` ausente (cae a `en`), ejemplo en `ja` con placeholder `en` y tags con fallback. Verificar con `pnpm run test:unit`

## 3. Manifiesto y textos de la extensión

- [x] 3.1 `package.json`: `"description": "%description%"` y `"l10n": "./l10n"`. Crear `package.nls.json` (en) y los 10 `package.nls.<idioma>.json` con la descripción traducida (D5, D8), y `l10n/bundle.l10n.<idioma>.json` vacíos para los 10 idiomas (D6). Verificar con `npx @vscode/vsce ls --no-dependencies` que entran los `package.nls*.json` y `l10n/`
- [x] 3.2 Crear `test/unit/i18n/manifest.test.ts`: cada `%clave%` del `package.json` existe y no está vacía en los 11 `package.nls`, sin claves sobrantes; y cada `l10n.t('…')` literal de `src/**/*.ts` existe en los 10 bundles, sin claves sobrantes y sin llamadas no literales (D6). Verificar con `pnpm run test:unit`, y que el test falla al añadir temporalmente un `vscode.l10n.t('Probe')` en `src/extension.ts`

## 4. Webview

- [x] 4.1 Crear `webview-ui/src/i18n/` con `en.ts`, los otros 10 diccionarios traducidos e `index.ts` (`Messages`, `translate`), y el hook `useT` (D7). Verificar con `pnpm run build:webview` sin errores, y que `tsc -b` falla al quitar temporalmente una clave de `ru.ts`
- [x] 4.2 `App.tsx` usa `t()` en todos los textos visibles. Antes del `init`, el idioma sale de `document.documentElement.lang` y, si no está soportado, se usa `en` (D7). Verificar con `pnpm run lint:webview` y `pnpm run build:webview`
- [x] 4.3 Crear `test/unit/i18n/webview-dictionaries.test.ts`: mismas claves en los 11 idiomas, ningún valor vacío y los mismos `{marcadores}` por clave. Verificar con `pnpm run test:unit`, y que falla al cambiar temporalmente un marcador en `es.ts`

## 5. Verificación manual

- [x] 5.1 F5 con VS Code en inglés: la vista muestra "Commands coming soon.". Con un idioma no inglés en la ventana de desarrollo (Configure Display Language, si hay paquete instalado, o el argumento `--locale=es` en `.vscode/launch.json` temporalmente): la vista y la descripción de la extensión salen traducidas. El autor confirma

## 6. Documentación

- [x] 6.1 `README.md` (sustituye la plantilla: descripción, idiomas disponibles y cómo contribuir traducciones), `catalog/README.md` (idiomas opcionales y obligatorios) y `CHANGELOG.md` (`[Unreleased]` → Added: "Interfaz en 11 idiomas…", Changed: "El catálogo admite 9 idiomas opcionales con fallback a inglés"). Verificar leyendo los archivos
- [x] 6.2 `docs/ROADMAP.md`: fila i18n con 11 idiomas, método de merge en la tabla de ramas, casilla "PR de release develop → staging" de la Fase 0 marcada y 1.1 `ui-i18n` ✅. Verificar con grep

## 7. Verificación final

- [x] 7.1 `pnpm run verify` en verde, `openspec validate ui-i18n --strict` sin errores y `/opsx:archive` antes de abrir el PR a `develop`
