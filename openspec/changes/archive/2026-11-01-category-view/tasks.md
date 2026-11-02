# Tasks

## 1. Extensión: resumen y mensaje `catalog`

- [x] 1.1 Añadir `CategorySummary` y `buildCategorySummaries` a `src/catalog/CatalogService.ts` (D1), con tests en `CatalogService.test.ts` (orden, título traducido, fallback a `en` en `ja`, conteo de comandos). Verificar con `pnpm run test:unit`
- [x] 1.2 Añadir `catalog` a `ExtensionMessage` en `src/messaging/protocol.ts`. `CommandsViewProvider` envía `catalog` tras `init` y expone `onDidSendCatalog` en lugar de `onDidReceiveReady` (D2). Verificar con `pnpm run check-types` y `pnpm run lint`
- [x] 1.3 Actualizar `src/test/extension.test.ts`: espera `onDidSendCatalog` y comprueba que incluye `git` con `commandCount` 3. Verificar con `pnpm test`

## 2. Diccionarios con plurales

- [x] 2.1 Ampliar `webview-ui/src/i18n`: tipo `PluralForms`, `intlLocale` y `translate` con `Intl.PluralRules` (D5). Añadir las claves de D8 en los 11 idiomas y eliminar `comingSoon` y `version`. Verificar con `pnpm run build:webview`
- [x] 2.2 Ampliar `test/unit/i18n/webview-dictionaries.test.ts` (D5): categorías plurales exactas por idioma, marcadores en todas las formas y claves plurales coherentes. Tests de `translate`: `en` 1/3, `ru` 1/3/5, `ja` 3 y `es` 1/3. Verificar con `pnpm run test:unit`, y que falla al quitar temporalmente la forma `few` de `ru`

## 3. Codicons

- [x] 3.1 Añadir `@vscode/codicons` (versión exacta) a `webview-ui`, importar su CSS en `main.tsx` y crear `webview-ui/src/codicons.ts` e `Icon.tsx` con fallback a `symbol-misc` (D6). Verificar con `pnpm run build:webview` que `codicon.ttf` está en `dist/webview/assets/`
- [x] 3.2 Crear `test/unit/catalog/icons.test.ts`: cada `icon` del catálogo empaquetado existe en `codicon.css`. Verificar con `pnpm run test:unit`, y que falla con un icono inexistente en una categoría de prueba

## 4. Navegación y vistas

- [x] 4.1 Crear `webview-ui/src/navigation.ts` con `navigate`, `resolveView` y `nextIndex` (D3, D4), y `test/unit/webview/navigation.test.ts` (abrir, volver con foco, categoría que desaparece, flechas en los extremos, Inicio y Fin, lista vacía). Verificar con `pnpm run test:unit`
- [x] 4.2 Crear `CategoryList.tsx` (roving tabindex, ARIA) y `CategoryScreen.tsx` (título enfocado, Atrás, Escape). `App.tsx` gestiona los estados de carga, vacío, lista y categoría, y escucha `catalog` (D4, D8). Estilos de D7 en `index.css`. Verificar con `pnpm run lint:webview` y `pnpm run build:webview`

## 5. Verificación manual (F5)

- [x] 5.1 Con F5:
  - la vista muestra "Git · 3 commands" con su icono;
  - Tab entra en la lista con una sola parada; flechas, Inicio y Fin se mueven; Enter abre;
  - en la pantalla de Git el foco está en el título; Atrás y Escape vuelven con el foco en Git;
  - hover, foco y alto contraste se ven bien;
  - con el paquete de idioma español se lee "3 comandos".

  El autor confirma

## 6. Documentación

- [x] 6.1 `CHANGELOG.md` (`[Unreleased]` → Added: "Lista de categorías del catálogo con iconos, teclado y lector de pantalla") y `docs/ROADMAP.md` (1.2 ✅ y casilla en Siguientes pasos). Verificar con grep

## 7. Verificación final

- [x] 7.1 `pnpm run verify` en verde, `openspec validate category-view --strict` sin errores y `/opsx:archive` antes de abrir el PR a `develop`
