# Tasks

## 1. Categorías nuevas

Para cada categoría:
1. Comprobar los comandos en la documentación oficial (Context7 o la web oficial).
2. Escribir el JSON con:
   - `section: "frameworks"`, y `order`, `icon` y `detect` según la decisión 1 del design;
   - al menos 8 comandos traducidos a los 11 idiomas, con la forma de la decisión 2;
   - el aviso de pnpm, Yarn y Bun en los comandos `npx` y `npm create`;
   - el aviso de macOS en los comandos de iOS;
   - `risk` según la decisión 4;
   - `docs` en cada comando.
3. Verificar con `pnpm run test:unit`.

Tareas:
- [x] 1.1 `catalog/expo.json`, con los comandos de EAS y su instalación global.
- [x] 1.2 `catalog/react-native.json`.
- [x] 1.3 `catalog/ionic.json`, con la CLI de Ionic y la de Capacitor.
- [x] 1.4 `catalog/electron.json`, con Electron Forge.
- [x] 1.5 `catalog/tauri.json`, con la señal `src-tauri/tauri.conf.json`.

## 2. Tests

- [x] 2.1 `test/unit/catalog/content.test.ts`:
  - lista y orden de las 60 categorías, con las 5 nuevas detrás de `fastapi`;
  - `expo.start` es `npx expo start` en `bash` y en `powershell`, y el comando de `eas build` no lleva `npx`;
  - los comandos de iOS avisan de macOS en español;
  - `eas submit`, `eas update` y `electron-forge publish` son `caution`, y `expo prebuild --clean` es `destructive`.
- [x] 2.2 `test/unit/project/detect.test.ts` y `test/unit/project/ProjectDetector.test.ts`:
  - `package.json`, `app.json` y `eas.json` detectan `expo` y `node`;
  - `package.json` y `src-tauri/tauri.conf.json` detectan `node` y `tauri`;
  - `ionic.config.json` y `capacitor.config.ts` detectan `ionic`;
  - `app.json` solo no detecta nada;
  - el catálogo empaquetado vigila `{*,bin/*,src-tauri/*}`.
- [x] 2.3 `src/test/extension.test.ts`: lista de categorías del test de integración.

## 3. Documentación y verificación

- [x] 3.1 Actualizar la documentación:
  - README: herramientas incluidas, tabla de señales y la nota de rutas en subcarpetas (`src-tauri/tauri.conf.json`);
  - CHANGELOG: en `[Unreleased]`;
  - ROADMAP: marcar la 3.7c con ✅.

  Después, ejecutar:
  - `pnpm run verify`;
  - `pnpm run release:package`, y comprobar el tamaño del `.vsix`;
  - `openspec validate catalog-mobile-desktop --strict`.

## 4. Prueba manual

- [x] 4.1 Dar al autor la lista de comprobación para F5:
  - las 5 categorías aparecen en "Frameworks" después de FastAPI;
  - detección en vivo:
    - crear `eas.json` → `expo`;
    - crear la carpeta `src-tauri` con `tauri.conf.json` → `tauri`;
    - crear `forge.config.js` → `electron`;
  - los comandos de iOS avisan de macOS;
  - `npx expo prebuild --clean` pide confirmación;
  - repaso de los textos en español.

  Resultado (2026-11-06): todo correcto en F5 (sección Frameworks con los 5 de móvil y escritorio en orden, detección de Expo, Electron y Tauri por src-tauri/tauri.conf.json, app.json sin Expo, comandos iguales en PowerShell, aviso de macOS, avisos destructive y caution, aviso de pnpm create e idiomas).
