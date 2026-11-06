## Context

- **Cómo se añade una categoría:** basta un `catalog/<id>.json` con `section`, `detect` y los comandos. El build lo copia a `dist/catalog/` y sus señales entran en el bundle. No hay que tocar código.
- **Tests que ya vigilan el contenido:** schema y `checkCatalogRules`, al menos 15 comandos por categoría, traducción completa a 11 idiomas, iconos Codicon existentes, `docs` en cada comando, y la lista de categorías en `content.test.ts` y en `src/test/extension.test.ts`.
- **Orden:** `order` ordena dentro de la sección; la lista global de `getCategories()` usa el mismo número. En `languages` el último es conda (47). Terminal es 50, en `tools`.
- **Variantes por shell:** claves `bash`, `zsh`, `powershell` y `cmd`; no hay variante por sistema operativo.
- **Generador:** los JSON se escriben con el script local de la 3.3, que aplica el formato del catálogo. El script no se versiona.

## Goals / Non-Goals

**Goals:**
- Comandos útiles del día a día de Java, Maven, Gradle y .NET, con la sintaxis de su documentación actual.
- Ejemplos que funcionen tal cual en PowerShell y cmd en Windows, y en bash y zsh en Linux, macOS y WSL.
- Que el proyecto abierto muestre estas categorías en "En este proyecto".

**Non-Goals:**
- **Instaladores** (`curl -s "https://get.sdkman.io" | bash`, `dotnet-install.sh`): ejecutan scripts remotos.
- **`kotlinc` y Kotlin Multiplatform:** Kotlin se cubre a través de Gradle (`build.gradle.kts`). Casi nadie compila con `kotlinc` fuera de Gradle.
- **Ant, sbt y Bazel:** sbt queda para Scala en la 3.5; los demás, para lotes posteriores si hay demanda.
- **Frameworks** (Spring CLI, Quarkus CLI, Micronaut): solo entran los goals o tasks del plugin habitual (`spring-boot:run`, `bootRun`), porque se lanzan con Maven o Gradle.
- **C/C++, Go y Rust:** son de la 3.4b.

## Decisions

### 1. Categorías, orden, icono y señales

| id | order | icon | detect |
| --- | --- | --- | --- |
| `java` | 51 | `coffee` | `pom.xml`, `build.gradle`, `build.gradle.kts`, `.java-version` |
| `maven` | 52 | `library` | `pom.xml`, `mvnw` |
| `gradle` | 53 | `gear` | `build.gradle`, `build.gradle.kts`, `settings.gradle`, `settings.gradle.kts`, `gradlew` |
| `dotnet` | 56 | `symbol-class` | `*.csproj`, `*.fsproj`, `*.sln`, `*.slnx`, `global.json` |

- Todas en `languages`. En el panel aparecen al final de "Lenguajes y entornos", después de conda. En la lista global quedan detrás de Terminal (50, en `tools`); los tests usan ese orden.
- Los cuatro iconos existen en `@vscode/codicons` (comprobado en `codicon.csv`): `coffee` por Java, `library` por el repositorio de artefactos de Maven, `gear` por la automatización de Gradle y `symbol-class` por C#.
- `pom.xml` y los `build.gradle*` detectan también `java`, porque un proyecto Maven o Gradle casi siempre es Java o Kotlin.
- `*.vbproj` no entra: Visual Basic se usa poco con la CLI de `dotnet`. Se puede añadir sin código si alguien lo pide.
- `.sdkmanrc` detecta `version-managers`, igual que `.nvmrc` y `.python-version`.

### 2. Wrapper de Maven y Gradle por shell

Decidido con el autor: los comandos usan el wrapper del proyecto, que fija la versión de la herramienta.

| Shell | Forma | Motivo |
| --- | --- | --- |
| bash, zsh | `./gradlew …`, `./mvnw …` | script POSIX en la raíz |
| PowerShell | `.\gradlew …`, `.\mvnw …` | PowerShell no ejecuta archivos del directorio actual sin `.\`; resuelve `gradlew.bat` y `mvnw.cmd` por la extensión |
| cmd | `gradlew …`, `mvnw …` | cmd busca primero en el directorio actual |

- Todos los comandos de `maven` y `gradle` que empiezan por `./mvnw` o `./gradlew` llevan las dos variantes. Un test lo comprueba.
- **Crear el wrapper** usa la herramienta global, igual en todos los shells: `gradle wrapper` y `mvn wrapper:wrapper`. Es el único comando sin wrapper en cada categoría.
- En Git Bash sobre Windows, `./gradlew` y `./mvnw` funcionan: los wrappers incluyen el script POSIX.

### 3. sdkman en Gestores de versiones

Decidido con el autor. Comandos: `sdk install java ${version}`, `sdk use java ${version}`, `sdk list java`, `sdk default java ${version}` (caution), `sdk env` (lee `.sdkmanrc`) y `sdk uninstall java ${version}` (destructive). Los títulos llevan el prefijo "sdkman: ", como los demás gestores.

sdkman solo funciona en shells POSIX (bash y zsh, incluidos WSL y Git Bash). No lleva variantes de PowerShell ni de cmd: la descripción lo avisa en los 11 idiomas. Así el comando se muestra igual y el usuario de Windows sabe por qué no funciona en PowerShell.

### 4. Contenido de cada categoría

Lista de partida. Cada comando se comprueba en la documentación oficial (Context7 o la web oficial) antes de escribirlo; si no se confirma, no entra.

- **`java`:** `java --version`, `javac --version`, `java ${file}` (archivo fuente suelto, Java 11+), `java -jar ${file}`, `java -cp ${classpath} ${class}`, `javac ${file}`, `javac -d ${outdir} ${file}`, `jar cfe` (crear un jar ejecutable), `jar tf` (listar), `jshell`, `jps -l` (procesos Java), `jcmd ${pid} GC.heap_info`, `jstack ${pid}`, `keytool -list -keystore ${file}`, `javadoc -d ${outdir} ${file}`.
- **`maven`:** clean, compile, test, `test -Dtest=${class}`, package, `package -DskipTests`, verify, install, `dependency:tree`, `dependency:resolve`, `versions:display-dependency-updates`, `help:effective-pom`, `spring-boot:run`, `-v`, `mvn wrapper:wrapper`, `-U` (forzar actualización de snapshots), `-pl ${module} -am` (un módulo).
- **`gradle`:** build, test, `test --tests ${class}`, run, clean, tasks, dependencies, `bootRun`, `build --refresh-dependencies`, `--stop`, `build --scan`, `--version`, `build -x test`, `${task} --continuous`, `gradle wrapper`, `wrapper --gradle-version ${version}`.
- **`dotnet`:** `new list`, `new ${template} -n ${name}`, run, `watch run`, build, test, restore, `publish -c Release`, `add package ${package}`, `remove package`, `list package --outdated`, `sln add ${file}`, clean, `--info`, `tool install --global ${tool}`, `ef migrations add ${name}`, `ef database update`, `format`.

### 5. Riesgo

- **`destructive`:**
  - borrar la salida de compilación: `./mvnw clean`, `./gradlew clean`, `dotnet clean`;
  - `sdk uninstall`.
- **`caution`:**
  - `ef database update` (cambia el esquema de la base de datos);
  - `mvn install` (escribe en el repositorio local `~/.m2` compartido por todos los proyectos);
  - `dotnet publish`, `sdk default`, `dotnet tool install --global`;
  - `--refresh-dependencies` y `-U` (vuelven a descargar dependencias);
  - `gradle wrapper --gradle-version` (cambia la versión de Gradle del proyecto).
- **`safe`:** el resto.

### 6. Parámetros, placeholders y traducciones

Se reutilizan los nombres de parámetro habituales (`package`, `file`, `version`, `name`, `tool`, `outdir`, `template`) y se añaden los que hagan falta (`class`, `module`, `task`, `pid`, `classpath`). Los placeholders de código no se traducen (`Main.java`, `com.example.AppTest`, `21.0.5-tem`, `webapi`) y llevan el mismo valor en los 11 idiomas. Los textos siguen el estilo de las categorías actuales: título corto en imperativo, descripción de una línea y `tags` con sinónimos en cada idioma.

### 7. Mensajes webview↔extensión y dependencias

- **Mensajes:** sin cambios. Las categorías nuevas viajan en el mensaje `catalog` igual que las actuales.
- **Dependencias:** ninguna nueva.

## Risks / Trade-offs

- **Proyecto sin wrapper:** `./gradlew` falla si el proyecto no lo tiene. Mitigación: el comando "Crear el wrapper" está en la misma categoría, y la descripción de los comandos principales lo menciona. Como nada se ejecuta solo, el usuario ve el comando antes de pulsar Enter.
- **sdkman en Windows nativo:** el ejemplo en PowerShell no funcionará. Mitigación: el aviso en la descripción.
- **`dotnet ef`** necesita la herramienta `dotnet-ef` instalada. Mitigación: la descripción lo dice y la categoría incluye `dotnet tool install --global`.
- **Volumen de traducción:** unos 75 comandos en 11 idiomas. El test impide huecos, pero no valida la calidad. La prueba en F5 y la revisión del PR miran al menos `es` y `en`.
