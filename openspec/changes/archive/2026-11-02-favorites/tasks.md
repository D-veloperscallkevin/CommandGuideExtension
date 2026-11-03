## 1. Almacén y protocolo (extensión)

- [x] 1.1 Crear `src/favorites/FavoritesStore.ts` (D1) e incluir `src/favorites/**` en `test/unit/tsconfig.json`. Tests en `test/unit/favorites/FavoritesStore.test.ts` con un `Memento` falso:
  - `list()` sin nada guardado y con un valor corrupto (`42`, `[1, "a"]`) da `[]` o solo los strings válidos;
  - quita duplicados y filtra los ids que no existen, sin escribir;
  - `toggle` añade al final y quita;
  - con un id inexistente devuelve `undefined` sin llamar a `update`;
  - al guardar, limpia los ids desaparecidos.

  Verificar: `pnpm run test:unit`.
- [x] 1.2 `src/messaging/protocol.ts` (D2): `toggleFavorite` en `WebviewMessage` (con su validador) y `favorites` en `ExtensionMessage`. Tests en `test/unit/messaging/protocol.test.ts`:
  - válido;
  - sin `commandId`;
  - con campos de más;
  - `commandId` vacío o de más de 200 caracteres.

  Verificar: `pnpm run test:unit`.

## 2. Integración en la extensión

- [x] 2.1 `CommandsViewProvider` y `extension.ts` (D1, D2):
  - el proveedor recibe el almacén y envía `favorites` tras `catalog` en cada `ready`;
  - `toggleFavorite` alterna y responde, o registra `log.warn` si el id no existe;
  - `extension.ts` crea el almacén con `context.globalState` y `catalog.getCommand`, y llama a `setKeysForSync(['favorites'])`;
  - la API de tests gana `toggleFavorite(id)` y `onDidSendFavorites`.

  Test de integración en `src/test/extension.test.ts`: alternar `git.status` emite `['git.status']`, alternarlo de nuevo emite `[]`, y un id inexistente no emite nada.

  Verificar: `pnpm run verify`.

## 3. Navegación y textos (webview, lógica pura)

- [x] 3.1 `webview-ui/src/navigation.ts` (D4): pantalla `favorites`, acción `openFavorites`, `back` con el foco en `FAVORITES_CARD_ID`, `parseSavedView` y `resolveView`. Tests en `test/unit/webview/navigation.test.ts`:
  - abrir y volver;
  - foco en un comando;
  - estado guardado válido e inválido (`{ screen: 'favorites', focusCommandId: 3 }`);
  - comando desaparecido;
  - foco en la tarjeta conservado sin favoritos.

  Verificar: `pnpm run test:unit`.
- [x] 3.2 Diccionarios del webview (D7): las seis claves en `en.ts` y en los otros 10 idiomas.

  Verificar: el test de diccionarios pasa.

## 4. Interfaz del webview

- [x] 4.1 `CommandList` (D6):
  - botón de estrella con `aria-pressed`, nombre, tooltip, `tabIndex={-1}` y sin mover el foco;
  - atajo `Ctrl+D`/`Cmd+D` y `aria-keyshortcuts` con los dos atajos;
  - región viva para el anuncio;
  - CSS: visible con hover o foco, y siempre si es favorito; padding para los dos botones.

  `App` guarda `favorites` y deriva `favoriteIds`, `favoriteCommands` y `starred` (D3). Pasa todo a `CategoryScreen` y a `SearchResults`.

  Verificar: `pnpm run lint:webview` y `pnpm run build:webview`.
- [x] 4.2 Tarjeta y pantalla (D5):
  - `CategoryList` con la tarjeta "Favoritos" primera, solo si hay favoritos;
  - `FavoritesScreen.tsx`: lista congelada al montarse, estado vacío, Atrás, Escape y restauración;
  - `App` muestra la pantalla según `view.screen`.

  Verificar: `pnpm run verify`.
- [x] 4.3 Documentación:
  - `docs/ROADMAP.md`: marcar 2.4 ✅ y añadir la casilla de `favorites`;
  - `CHANGELOG.md` (`[Unreleased]`): estrella, `Ctrl+D`, tarjeta y pantalla, y sincronización;
  - `README.md`: cómo marcar y dónde verlos.

  Verificar: lectura del diff.

## 5. Verificación manual

- [x] 5.1 F5 en Windows:
  - **Pantalla de Git:**
    - pasar el ratón muestra la estrella vacía junto a copiar; clic en ella: se rellena, se queda visible y el foco no se mueve;
    - `Ctrl+D` sobre otro comando lo marca; comprobar que VS Code no intercepta el atajo.
  - **Volver:** aparece "★ Favoritos" primera, con "2 comandos" y el foco en Git.
  - **Pantalla de favoritos:**
    - los dos comandos en orden de marcado, con su categoría;
    - enviar y copiar funcionan;
    - `Ctrl+D` en uno lo deja con la estrella vacía, y al volver y entrar ya no está;
    - Escape vuelve con el foco en la tarjeta.
  - **Búsqueda:** los resultados muestran la estrella rellena en los favoritos.
  - **Persistencia:** recargar la ventana (`Developer: Reload Window`); los favoritos y la pantalla abierta se conservan.
  - **Al desmarcar el último:** la tarjeta desaparece.
  - **Lector de pantalla:** anuncia la estrella como botón alternable y los mensajes "Añadido a favoritos" y "Quitado de favoritos".
    - Con Narrador no se oían los mensajes al principio: la región cambiaba en el mismo render que la estrella. Se publica 150 ms después y con `aria-atomic` (D3); comprobado con Narrador.
  - **Vista estrecha:** el título y la etiqueta de riesgo no quedan tapados por los dos botones.

## 6. Cierre

- [x] 6.1 Dejar en verde `pnpm run verify` y `openspec validate favorites --strict`. Hacer `/opsx:archive` antes de abrir el PR a `develop`.
