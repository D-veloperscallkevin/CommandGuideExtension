## MODIFIED Requirements

### Requirement: Señales del proyecto
La extensión SHALL detectar las categorías del proyecto a partir de los patrones de detección que declara cada categoría del catálogo incluido en su campo `detect`. Solo SHALL comprobar si existen entradas, sean archivos o carpetas, en la raíz de cada carpeta del workspace. MUST NOT leer su contenido ni buscar más allá del nivel que indique el patrón.

Un patrón SHALL tener una de estas formas:
- un nombre exacto de la raíz, como `go.mod` o `.git`;
- un nombre de la raíz con uno o más comodines `*`, donde `*` equivale a cualquier secuencia de caracteres salvo `/`, como `*.csproj`;
- una ruta fija de un nivel, `carpeta/nombre`, sin comodines, como `prisma/schema.prisma`.

La comparación con los nombres de la raíz MUST NOT distinguir entre mayúsculas y minúsculas, para que el resultado sea el mismo en Windows, macOS y Linux. Una categoría SHALL detectarse cuando al menos uno de sus patrones coincide en al menos una carpeta.

Las señales SHALL ser:
- `.git` → `git`;
- `package.json`, `.nvmrc` o `.node-version` → `node`;
- `pnpm-lock.yaml` o `pnpm-workspace.yaml` → `pnpm`;
- `package-lock.json` o `npm-shrinkwrap.json` → `npm`;
- `Dockerfile`, `Containerfile`, `compose.yaml`, `compose.yml`, `docker-compose.yml`, `docker-compose.yaml` o `.dockerignore` → `docker`.

Con varias carpetas en el workspace, las categorías detectadas SHALL ser la unión de las de todas. La categoría `terminal` MUST NOT detectarse nunca. Sin carpetas abiertas, no SHALL detectarse ninguna categoría. Las categorías propias del usuario MUST NOT detectarse. Si no se puede leer la raíz de una carpeta o falla una comprobación (por ejemplo, por falta de permisos), SHALL tratarse como si la entrada no existiera, sin aviso al usuario. La detección MUST NOT necesitar leer los archivos del catálogo, que solo se cargan bajo demanda.

#### Scenario: Proyecto con pnpm y Docker
- **WHEN** la raíz de la única carpeta contiene `package.json`, `pnpm-lock.yaml` y `Dockerfile`
- **THEN** las categorías detectadas son `node`, `pnpm` y `docker`

#### Scenario: Repositorio Git
- **WHEN** la raíz contiene la carpeta `.git`
- **THEN** `git` está entre las categorías detectadas

#### Scenario: Multi-root
- **WHEN** una carpeta del workspace contiene `package-lock.json` y otra contiene `compose.yaml`
- **THEN** las categorías detectadas son `npm` y `docker`

#### Scenario: Solo en subcarpetas
- **WHEN** `package.json` solo existe en `webview-ui/` y no en la raíz
- **THEN** `node` no se detecta

#### Scenario: Sin carpeta abierta
- **WHEN** VS Code no tiene ninguna carpeta abierta
- **THEN** no se detecta ninguna categoría

#### Scenario: Patrón con comodín
- **WHEN** una categoría declara `"detect": ["*.csproj"]` y la raíz contiene `Api.csproj`
- **THEN** esa categoría está entre las detectadas

#### Scenario: Comodín solo en la raíz
- **WHEN** una categoría declara `"detect": ["*.csproj"]` y `Api.csproj` solo existe en `src/Api/`
- **THEN** esa categoría no se detecta

#### Scenario: Ruta de un nivel
- **WHEN** una categoría declara `"detect": ["prisma/schema.prisma"]` y la raíz contiene la carpeta `prisma` con el archivo `schema.prisma`
- **THEN** esa categoría está entre las detectadas

#### Scenario: Ruta de un nivel sin el archivo
- **WHEN** una categoría declara `"detect": ["prisma/schema.prisma"]` y la raíz contiene la carpeta `prisma` vacía
- **THEN** esa categoría no se detecta

#### Scenario: Mayúsculas en Linux y en Windows
- **WHEN** la raíz contiene `dockerfile` en minúsculas, tanto en un sistema de archivos que distingue mayúsculas (Linux, bash) como en uno que no (Windows, PowerShell)
- **THEN** `docker` está entre las categorías detectadas en los dos casos

#### Scenario: Señales nuevas de las categorías existentes
- **WHEN** la raíz contiene solo `.nvmrc`, `pnpm-workspace.yaml` y `Containerfile`
- **THEN** las categorías detectadas son `node`, `pnpm` y `docker`

#### Scenario: Raíz ilegible
- **WHEN** no se puede listar la raíz de una carpeta del workspace y otra carpeta contiene `.git`
- **THEN** las categorías detectadas son solo `git`, sin aviso al usuario

#### Scenario: Activación sin cargar el catálogo
- **WHEN** la extensión se activa en un proyecto con `package.json`
- **THEN** `node` se detecta y los archivos del catálogo siguen sin leerse

### Requirement: Actualización en vivo
La extensión SHALL volver a detectar las categorías cuando se cree o se borre, en la raíz de una carpeta del workspace, una entrada que coincida con algún patrón de detección: un nombre exacto, un nombre con comodín o el archivo de una ruta de un nivel. También SHALL volver a detectarlas cuando se añadan o se quiten carpetas del workspace. Si el resultado cambia, SHALL notificarlo para que la vista se actualice. Varios cambios seguidos SHALL agruparse en una sola detección.

#### Scenario: Crear un Dockerfile
- **WHEN** la vista está abierta en un proyecto sin señales de Docker y el usuario crea `Dockerfile` en la raíz
- **THEN** `docker` pasa a estar entre las categorías detectadas, sin recargar VS Code

#### Scenario: Borrar el lockfile
- **WHEN** el usuario borra `pnpm-lock.yaml` de la raíz
- **THEN** `pnpm` deja de estar entre las categorías detectadas

#### Scenario: Añadir una carpeta
- **WHEN** el usuario añade al workspace una carpeta que contiene `.git`
- **THEN** `git` pasa a estar entre las categorías detectadas

#### Scenario: Crear un archivo que coincide con un comodín
- **WHEN** una categoría declara `"detect": ["*.csproj"]` y el usuario crea `Web.csproj` en la raíz
- **THEN** esa categoría pasa a estar entre las detectadas, sin recargar VS Code
