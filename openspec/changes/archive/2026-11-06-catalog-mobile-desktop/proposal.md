## Why

La sección "Frameworks" ya tiene los frameworks de frontend (3.7a) y de backend (3.7b), pero no los de apps móviles y de escritorio. Quien trabaja con Expo, React Native, Ionic/Capacitor, Electron o Tauri no encuentra los comandos para crear el proyecto, arrancarlo en un emulador o en el escritorio, generar los proyectos nativos, compilar los instaladores ni publicar.

Fase del roadmap: **Fase 3 (v1.x)**, change 3.7c `catalog-mobile-desktop`, la tercera de las cuatro partes de la 3.7.

## What Changes

- **Cinco categorías nuevas** en la sección `frameworks`, detrás de las de backend: `expo`, `react-native`, `ionic`, `electron` y `tauri`. Cada una tiene al menos 8 comandos traducidos a los 11 idiomas y con enlace `docs`.
  - `expo` incluye los comandos de EAS (`eas build`, `eas submit`, `eas update`).
  - `ionic` reúne la CLI de Ionic y la de Capacitor (`npx cap …`).
  - `electron` cubre solo Electron Forge.
- **Forma de los comandos:**
  - las CLI del proyecto se usan con `npx`, igual en todos los shells y con el aviso de pnpm, Yarn y Bun que ya añade el catálogo;
  - las CLI globales (`eas`, `ionic`) se instalan con `npm install -g` y se usan sin `npx`;
  - no se usa `npm run …`, porque depende de los scripts de cada proyecto.
- **Comandos de iOS:** los que compilan, abren o arrancan el proyecto de iOS avisan, en los 11 idiomas, de que solo funcionan en macOS.
- **Riesgo:**
  - **`caution`:** lo que publica fuera del equipo (`eas submit`, `eas update`, `electron-forge publish`) y lo que añade dependencias o cambia la configuración (`npx expo install --fix`, `npx cap add`, `tauri add`, `electron-forge import`);
  - **`destructive`:** `npx expo prebuild --clean`, que borra y regenera las carpetas `android` e `ios`.
- **Señales `detect`:**

  | Señales | Categoría |
  | --- | --- |
  | `eas.json`, `app.config.*` | `expo` |
  | `metro.config.*`, `react-native.config.js` | `react-native` |
  | `capacitor.config.*`, `ionic.config.json` | `ionic` |
  | `forge.config.*` | `electron` |
  | `src-tauri/tauri.conf.json` | `tauri` |

  Con `src-tauri/tauri.conf.json`, la detección vigila también la carpeta `src-tauri`, igual que ya vigila `bin`.
- **Corrección de la spec:** el requisito de contenido de la 3.7b quedó con `ruby bin\rails` y `.\mvnw` mal escritos (con un carácter de control en vez de la barra invertida). El escenario de `pom.xml` decía que solo se detecta `maven`, pero también se detecta `java`. Este change los corrige al modificar esos requisitos.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- **`command-catalog`:** el requisito "Contenido mínimo del catálogo empaquetado" añade las 5 categorías, su forma de comandos, el aviso de macOS en iOS y sus reglas de riesgo. Además corrige las barras invertidas de Rails y Spring Boot.
- **`project-detection`:** el requisito "Señales del proyecto" añade las señales de las 5 categorías y corrige el escenario de `pom.xml`.

## Impact

- **Catálogo:** se añaden cinco archivos `catalog/<id>.json`.
- **Tests:**
  - `test/unit/catalog/content.test.ts`: orden, aviso de macOS, CLI globales y riesgo;
  - `test/unit/project/detect.test.ts`: escenarios de detección y el patrón de vigilancia con `src-tauri`;
  - `test/unit/project/ProjectDetector.test.ts`: patrón de vigilancia;
  - `src/test/extension.test.ts`: lista de categorías.
- **Docs:**
  - README: herramientas incluidas y tabla de señales;
  - CHANGELOG;
  - ROADMAP: 3.7c ✅.
- **Sin cambios:** código, schema y dependencias.
- **Tamaño:** unos 70 KB más en el `.vsix`.
