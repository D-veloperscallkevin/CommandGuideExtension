# Tasks

## 1. Categorías nuevas

Para cada categoría:
- comprobar los comandos en la documentación oficial (Context7 o la web oficial);
- escribir el JSON con `section: "languages"`, `order`, `icon` y `detect` según la decisión 1 del design, al menos 15 comandos traducidos a los 11 idiomas, `risk` según la decisión 5 y `docs`;
- verificar con `pnpm run test:unit`: schema, reglas, mínimo de comandos, traducción completa e iconos.

- [x] 1.1 `catalog/java.json`.
- [x] 1.2 `catalog/maven.json`, con el wrapper por shell de la decisión 2 y el comando que crea el wrapper.
- [x] 1.3 `catalog/gradle.json`, con el wrapper por shell de la decisión 2 y el comando que crea el wrapper.
- [x] 1.4 `catalog/dotnet.json`, con el aviso de `dotnet-ef` en los comandos de `ef`.
- [x] 1.5 `catalog/version-managers.json`: comandos de sdkman con el aviso de PowerShell y cmd (decisión 3), y `.sdkmanrc` en `detect`.

## 2. Tests

- [x] 2.1 En `test/unit/catalog/content.test.ts`:
  - actualizar la lista y el orden de las 19 categorías;
  - añadir el caso de `./gradlew build` en `bash` y `zsh`, `.\gradlew build` en `powershell` y `gradlew build` en `cmd`;
  - añadir el caso de `mvnw package` en `bash`, `powershell` y `cmd`;
  - comprobar que todo comando de `maven` y `gradle` que empieza por el wrapper declara sus variantes de `powershell` y `cmd`;
  - comprobar que los `clean` de `maven`, `gradle` y `dotnet` son `destructive`.
- [x] 2.2 En `test/unit/project/detect.test.ts`, añadir los escenarios Maven con wrapper, Gradle con Kotlin, solución de .NET, proyecto de C# y `.sdkmanrc`.
- [x] 2.3 En `src/test/extension.test.ts`, actualizar la lista de categorías del test de integración.

## 3. Documentación y verificación

- [x] 3.1 Actualizar:
  - el README: herramientas incluidas en "Usage" y tabla de señales;
  - el CHANGELOG, en `[Unreleased]`;
  - el ROADMAP: dividir la fila 3.4 en 3.4a `catalog-jvm-dotnet` ✅ y 3.4b `catalog-native` (C/C++, CMake, Go y Rust).

  Ejecutar `pnpm run verify`, `pnpm run release:package` (comprobar el tamaño del `.vsix`) y `openspec validate catalog-jvm-dotnet --strict`.

## 4. Prueba manual

- [x] 4.1 Dar al autor la lista de comprobación en F5:
  - las 4 categorías al final de "Lenguajes y entornos", en el orden de la decisión 1;
  - detección en vivo creando `pom.xml`, `build.gradle.kts` y `App.csproj` en la raíz;
  - los ejemplos del wrapper de Gradle y Maven con PowerShell, con cmd y con Git Bash como terminal activa;
  - el aviso de sdkman en Gestores de versiones;
  - el comando se escribe en la terminal sin ejecutarse (`sendText(cmd, false)`, como el resto);
  - la búsqueda de `gradlew test`, `mvn package` y `dotnet ef`;
  - un comando `destructive` (`clean`) pide confirmación;
  - repaso de los textos en español.

  Resultado (2026-11-06): todo correcto en F5 (orden de las categorías, detección en vivo de Java, Maven, Gradle y .NET, wrapper por shell en PowerShell, cmd y Git Bash, aviso de sdkman, envío sin ejecutar, búsqueda, confirmación de clean y textos en español).
