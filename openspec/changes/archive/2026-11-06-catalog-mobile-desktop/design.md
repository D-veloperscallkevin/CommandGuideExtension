## Context

La sección `frameworks` tiene 14 categorías: siete de frontend (`order` 100–112) y siete de backend (114–126). Ya existen estas convenciones:
- El generador añade a los comandos `npx …` el aviso de `pnpm dlx`, `yarn dlx` y `bunx`.
- Los comandos de `swift` con `xcodebuild` o `xcrun` y `flutter build ios` avisan de que solo funcionan en macOS.
- La detección admite rutas fijas de un nivel (`bin/rails`). El vigilante de archivos observa la raíz y cada carpeta de esas rutas (`{*,bin/*}`).

`flutter` ya existe en "Lenguajes y entornos" y no forma parte de este change.

## Goals / Non-Goals

**Goals:**
- Cinco categorías con los comandos del día a día: crear el proyecto, arrancar en desarrollo, generar o sincronizar los proyectos nativos, compilar, diagnosticar y publicar.
- Comandos que funcionen igual en bash, zsh, PowerShell y cmd.
- Avisar de lo que solo funciona en macOS y marcar con riesgo lo que publica o borra.

**Non-Goals:**
- electron-builder y otras herramientas de empaquetado de Electron.
- Herramientas nativas de Android e iOS (`adb`, `xcrun simctl`, CocoaPods, fastlane): son la 3.13.
- Detectar Expo o React Native leyendo `package.json` o `app.json`.

## Decisions

### 1. Identificadores, orden, iconos y detección

| id | Título | order | icon | detect |
| --- | --- | --- | --- | --- |
| `expo` | Expo | 128 | `broadcast` | `eas.json`, `app.config.*` |
| `react-native` | React Native | 130 | `preview` | `metro.config.*`, `react-native.config.js` |
| `ionic` | Ionic / Capacitor | 132 | `plug` | `capacitor.config.*`, `ionic.config.json` |
| `electron` | Electron | 134 | `window` | `forge.config.*` |
| `tauri` | Tauri | 136 | `vm` | `src-tauri/tauri.conf.json` |

- Los títulos son nombres propios y no se traducen.
- Los cinco iconos existen en `codicon.csv` y ninguna otra categoría los usa.
- `app.json` no sirve como señal: lo usan también proyectos de React Native sin Expo. Un proyecto Expo con `metro.config.js` detecta `expo` y `react-native`, lo que es correcto porque es una app de React Native.
- Con `src-tauri/tauri.conf.json`, `watchGlob` del catálogo empaquetado pasa de `{*,bin/*}` a `{*,bin/*,src-tauri/*}`. No cambia el código: las carpetas salen de las señales.

Alternativa descartada: siete categorías, con EAS separado de Expo y Capacitor separado de Ionic. El autor eligió cinco, porque EAS e Ionic solos quedarían con pocos comandos.

### 2. Forma de los comandos

| Herramienta | Forma | Ejemplo |
| --- | --- | --- |
| Expo CLI | `npx expo …` | `npx expo start` |
| EAS CLI (global) | `eas …` | `eas build --platform ${platform}` |
| React Native | `npx react-native …` | `npx react-native run-android` |
| Ionic CLI (global) | `ionic …` | `ionic serve` |
| Capacitor | `npx cap …` | `npx cap sync` |
| Electron Forge | `npx electron-forge …` | `npx electron-forge make` |
| Tauri | `npx tauri …` | `npx tauri dev` |

- Todos los comandos son iguales en todos los shells, sin variantes.
- Los proyectos nuevos se crean con `npx create-expo-app@latest`, `npx @react-native-community/cli@latest init ${name}`, `ionic start`, `npx create-electron-app@latest ${name}` y `npm create tauri-app@latest`. Llevan el aviso de pnpm, Yarn y Bun que ya añade el generador.
- `eas` e `ionic` se instalan con `npm install -g eas-cli` y `npm install -g @ionic/cli`, como sus documentaciones.
- **Aviso de macOS:** lo llevan, en los 11 idiomas, los comandos de iOS: `npx expo run:ios`, `npx react-native run-ios`, `npx cap open ios`, `npx cap run ios`, `npx tauri ios init`, `npx tauri ios dev` y similares.

**Parámetro nuevo del generador:** `platform` (`android`) para `eas build` y `eas submit`. Se reutilizan `name`, `package` y `branch`.

### 3. Comandos

Comprobados en Context7: Expo y EAS CLI, React Native 0.88, Ionic CLI, Capacitor, Electron Forge y Tauri 2.

| Categoría | Comandos |
| --- | --- |
| **Expo** (~15) | `npx create-expo-app@latest`, `npx expo start`, `npx expo start --tunnel`, `npx expo start --clear`, `npx expo install ${package}`, `npx expo install --fix` (caution), `npx expo-doctor`, `npx expo prebuild`, `npx expo prebuild --clean` (destructive), `npx expo run:android`, `npx expo run:ios` (macOS), `npm install -g eas-cli`, `eas build --platform ${platform}`, `eas submit --platform ${platform}` (caution), `eas update --branch ${branch}` (caution) |
| **React Native** (~9) | `npx @react-native-community/cli@latest init ${name}`, `npx react-native start`, `npx react-native start --reset-cache`, `npx react-native run-android`, `npx react-native run-ios` (macOS), `npx react-native doctor`, `npx react-native info`, `npx react-native build-android --mode=release`, `npx react-native log-android` |
| **Ionic / Capacitor** (~13) | `npm install -g @ionic/cli`, `ionic start`, `ionic serve`, `ionic build`, `ionic generate page ${name}`, `npx cap init`, `npx cap add ${platform}` (caution), `npx cap sync`, `npx cap copy`, `npx cap open android`, `npx cap open ios` (macOS), `npx cap run android`, `ionic cap run android -l --external`, `npx cap doctor` |
| **Electron** (~8) | `npx create-electron-app@latest ${name}`, `npx electron-forge start`, `npx electron-forge package`, `npx electron-forge make`, `npx electron-forge start --inspect-electron`, `npx electron-forge publish` (caution), `npx electron-forge import` (caution), `npx electron .` |
| **Tauri** (~13) | `npm create tauri-app@latest`, `npx tauri dev`, `npx tauri build`, `npx tauri build --debug`, `npx tauri info`, `npx tauri icon`, `npx tauri add ${plugin}` (caution), `npx tauri android init`, `npx tauri android dev`, `npx tauri android build`, `npx tauri ios init` (macOS), `npx tauri ios dev` (macOS), `npx tauri ios build` (macOS) |

La lista exacta se ajusta con la documentación al implementar, manteniendo el mínimo de 8 por categoría.

### 4. Riesgo

- **`caution`:**
  - publica fuera del equipo: `eas submit`, `eas update` y `electron-forge publish`;
  - cambia dependencias o configuración del proyecto: `npx expo install --fix`, `npx cap add`, `npx tauri add` y `electron-forge import`.
- **`destructive`:** `npx expo prebuild --clean`, que borra `android` e `ios` y pierde los cambios hechos a mano. Su descripción lo avisa.
- **`safe`:** el resto. `eas build` compila en los servidores de Expo y no publica nada.

### 5. Corrección de la spec de la 3.7b

El script que generó el delta de la 3.7b escribía `\r` dentro de una plantilla de JavaScript, y en la spec quedó un retorno de carro en lugar de `\r` (`ruby bin␍ails`); `.\mvnw` perdió la barra. El escenario "Spring Boot no se detecta" afirmaba que con `pom.xml` solo se detecta `maven`, pero también se detecta `java`, como dice el test. Como los dos requisitos se modifican aquí, el delta los incluye corregidos. Este delta se genera con `String.fromCharCode(92)` para la barra invertida.

## Risks / Trade-offs

- **React Native sin señal clara:** `metro.config.*` también aparece en proyectos Expo, que mostrarán las dos categorías. Es aceptable: los comandos de React Native funcionan también en esos proyectos.
- **Expo sin `eas.json` ni `app.config.*`:** un proyecto con solo `app.json` no se detecta. Mitigación: la búsqueda por `expo` llega a la categoría.
- **CLI globales:** `eas` e `ionic` necesitan estar instaladas. Los comandos de instalación están en la misma categoría, y la descripción de los demás lo recuerda.
- **Vigilar `src-tauri`:** añade una carpeta más al vigilante de archivos, de coste despreciable.
