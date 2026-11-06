## Why

El catálogo no tiene comandos de Java, Kotlin ni .NET. Quien trabaje con Maven, Gradle o `dotnet` no encuentra sus comandos, y su proyecto no aparece en "En este proyecto".

Fase del roadmap: **Fase 3 (v1.x)**, change 3.4a.

El ROADMAP agrupaba en un único change 3.4 los lenguajes compilados (Java/Kotlin, .NET, C/C++, Go y Rust): unas 8 categorías y 140 comandos. Se divide en dos PR, como la 3.3:
- **3.4a `catalog-jvm-dotnet`**: este change;
- **3.4b `catalog-native`**: C/C++ (gcc, g++, clang, make), CMake, Go y Rust (cargo, rustc, rustup).

## What Changes

- **Cuatro categorías nuevas** en la sección `languages`, cada una con al menos 15 comandos traducidos a los 11 idiomas y con enlace `docs`:
  - **`java`**: `java` (archivo, `-jar`, versión, archivo fuente suelto), `javac`, `jar` y `jshell`;
  - **`maven`**: clean, compile, test, package, verify, install, un test concreto, saltar tests, `dependency:tree`, `versions:display-dependency-updates`, `spring-boot:run`, `help:effective-pom`, crear el wrapper…;
  - **`gradle`**: build, test, run, clean, tasks, dependencies, `bootRun`, un test concreto, `--refresh-dependencies`, `--stop`, `--scan`, crear el wrapper…;
  - **`dotnet`**: new, run, build, test, watch, restore, publish, add package, `sln add`, clean, `--info`, `tool install`, `ef migrations add`, `ef database update`….
- **Wrapper por shell.** Maven y Gradle se usan con el wrapper del proyecto, que se escribe distinto en cada shell:

  | Shell | Gradle | Maven |
  | --- | --- | --- |
  | bash, zsh | `./gradlew build` | `./mvnw package` |
  | PowerShell | `.\gradlew build` | `.\mvnw package` |
  | cmd | `gradlew build` | `mvnw package` |

  Un comando aparte crea el wrapper con la herramienta global (`gradle wrapper`, `mvn wrapper:wrapper`).
- **sdkman en Gestores de versiones**: `sdk install java`, `sdk use`, `sdk list java`, `sdk default`, `sdk env` y `sdk uninstall`. La descripción avisa de que no funciona en PowerShell ni en cmd.
- **Señales `detect`:**
  - `pom.xml`, `build.gradle`, `build.gradle.kts` y `.java-version` → `java`;
  - `pom.xml` y `mvnw` → `maven`;
  - `build.gradle`, `build.gradle.kts`, `settings.gradle`, `settings.gradle.kts` y `gradlew` → `gradle`;
  - `*.csproj`, `*.fsproj`, `*.sln`, `*.slnx` y `global.json` → `dotnet`;
  - `.sdkmanrc` → `version-managers`.
- **Riesgo:** `destructive` para `clean` (Maven, Gradle y `dotnet`) y `sdk uninstall`; `caution` para `ef database update`, `mvn install`, `dotnet publish`, `sdk default` y `--refresh-dependencies`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `command-catalog`: "Contenido mínimo del catálogo empaquetado" incluye las 4 categorías nuevas, su orden, la regla del wrapper por shell y el aviso de sdkman.
- `project-detection`: "Señales del proyecto" añade las señales de Java, Maven, Gradle, .NET y `.sdkmanrc`.

## Impact

- **Catálogo:** `catalog/java.json`, `maven.json`, `gradle.json` y `dotnet.json`, nuevos; `catalog/version-managers.json` gana los comandos de sdkman y la señal `.sdkmanrc`.
- **Tests:** `test/unit/catalog/content.test.ts` (lista de categorías, wrapper por shell, `clean` destructive), `test/unit/project/detect.test.ts` (señales nuevas) y `src/test/extension.test.ts` (lista de categorías).
- **Docs:** README (herramientas y tabla de señales), CHANGELOG y ROADMAP (3.4 se divide en 3.4a ✅ y 3.4b).
- **Código:** ninguno.
- **Mensajes webview↔extensión:** sin cambios.
- **Dependencias:** ninguna nueva.
- **Tamaño:** unos 200 KB más de JSON, unos 45 KB comprimidos en el `.vsix`.
