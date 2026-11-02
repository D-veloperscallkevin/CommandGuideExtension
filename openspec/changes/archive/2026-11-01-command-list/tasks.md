# Tasks

## 1. Extensión: comandos en `catalog`

- [x] 1.1 Añadir `CommandSummary` y `defaultShellFor`; `buildCategorySummaries(categories, locale, shell)` incluye `commands` y elimina `commandCount` (D1). Tests en `CatalogService.test.ts`:
  - textos traducidos y fallback a `en`;
  - ejemplo con placeholder;
  - variante `shells.powershell` con `powershell` y `command` con `bash`;
  - solo las claves esperadas;
  - `defaultShellFor('win32' | 'linux' | 'darwin')`.

  Verificar con `pnpm run test:unit`
- [x] 1.2 `CommandsViewProvider` usa `defaultShellFor(process.platform)` (D1, D9). El test de integración comprueba que `git` incluye `git.status`, `git.new-branch` y `git.reset-hard` (este último con `risk` `destructive`) y que ningún `example` contiene `${`. Verificar con `pnpm run check-types`, `pnpm run lint` y `pnpm test`

## 2. Navegación persistida

- [x] 2.1 Ampliar `navigation.ts` con `focusCategory`, `focusCommand`, `parseSavedView` y el nuevo `resolveView` (D2), y sus tests en `navigation.test.ts`:
  - foco de comando y de categoría;
  - estado guardado válido, inválido (`{ screen: 42 }`, `null`, claves extra);
  - categoría inexistente y comando inexistente.

  Verificar con `pnpm run test:unit`
- [x] 2.2 Añadir `getState`/`setState` a `vscode.ts` (D8). `App` restaura la vista inicial y la guarda en cuanto ha llegado el catálogo (D2). Verificar con `pnpm run build:webview`

## 3. Vistas

- [x] 3.1 Crear `useRovingFocus` y migrar `CategoryList` a él, despachando `focusCategory` (D3). Verificar con `pnpm run lint:webview` y `pnpm run build:webview`
- [x] 3.2 Crear `CommandList.tsx` y `RiskBadge.tsx` e integrarlos en `CategoryScreen` (foco en el comando restaurado o en el título) (D4, D5). Añadir los textos de D7 en los 11 idiomas, eliminar `categoryPlaceholder` y añadir los estilos de D5 y D6. Verificar con `pnpm run test:unit` (diccionarios), `pnpm run lint:webview` y `pnpm run build:webview`

## 4. Verificación manual (F5)

- [x] 4.1 Con F5:
  - en Git se ven los 3 comandos con título, descripción y ejemplo (`git checkout -b feature/my-change`), y `git.reset-hard` muestra "Destructive" con icono;
  - Tab entra en la lista de comandos con una sola parada; flechas, Inicio y Fin funcionan;
  - con el foco en un comando, cambiar al Explorador y volver restaura la pantalla y el foco; Developer: Reload Window también;
  - el ejemplo se ajusta en una barra lateral estrecha;
  - temas claro, oscuro y alto contraste;
  - en español: "Destructivo";
  - el Narrador lee título, riesgo, descripción y ejemplo.

  El autor confirma

## 5. Documentación

- [x] 5.1 `CHANGELOG.md` (`[Unreleased]` → Added: lista de comandos con ejemplo y aviso de riesgo; la vista recuerda dónde estabas) y `docs/ROADMAP.md` (1.3 ✅ y casilla en Siguientes pasos). Verificar con grep

## 6. Verificación final

- [x] 6.1 `pnpm run verify` en verde, `openspec validate command-list --strict` sin errores y `/opsx:archive` antes de abrir el PR a `develop`
