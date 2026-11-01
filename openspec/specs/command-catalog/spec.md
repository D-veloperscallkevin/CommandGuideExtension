# command-catalog Specification

## Purpose

Define el catálogo de comandos de DevCommands: su formato bilingüe, las reglas de validez y cómo la extensión lo consulta para mostrar categorías, comandos y ejemplos, y para enviarlos a la terminal.

## Requirements

### Requirement: Catálogo por categorías validado contra un schema
El catálogo SHALL estar formado por un archivo JSON por categoría dentro de `catalog/`. Cada archivo MUST validar contra `catalog/schema.json` y MUST declarar `version`, `id`, `title`, `icon`, `order` y `commands`. Cada comando MUST declarar `id`, `title`, `description`, `command`, `tags` y `risk`, y MAY declarar `params`, `shells` y `docs`. La validación MUST rechazar cualquier propiedad no definida en el schema, salvo `$schema`.

#### Scenario: Archivo de categoría válido
- **WHEN** un archivo de `catalog/` cumple todos los campos obligatorios del schema
- **THEN** la validación del catálogo pasa sin errores

#### Scenario: Falta un campo obligatorio
- **WHEN** un comando del catálogo no declara `risk`
- **THEN** la validación del catálogo falla e indica el archivo y la ruta del comando afectado

#### Scenario: Propiedad desconocida
- **WHEN** un comando declara una propiedad que no está en el schema, como `exampel`
- **THEN** la validación del catálogo falla

### Requirement: Textos bilingües obligatorios
Todo texto visible para el usuario (`title` de la categoría, `title` y `description` del comando, `label` y `placeholder` de cada parámetro) SHALL ser un objeto con las claves `en` y `es`, ambas obligatorias y no vacías, y MAY incluir además cualquiera de los idiomas `pt-br`, `fr`, `de`, `it`, `ja`, `ko`, `zh-cn`, `zh-tw` y `ru`, también no vacíos. Los `tags` SHALL ser un objeto con una lista de strings por idioma, con `en` y `es` obligatorios y los mismos idiomas opcionales. Cualquier otra clave de idioma MUST hacer fallar la validación.

#### Scenario: Falta una traducción
- **WHEN** un comando declara `title` solo con `es`
- **THEN** la validación del catálogo falla

#### Scenario: Tags en ambos idiomas
- **WHEN** un comando declara `tags` con `en: ["branch"]` y `es: ["rama"]`
- **THEN** la validación pasa y ambas listas quedan disponibles para la búsqueda

#### Scenario: Idioma opcional
- **WHEN** un comando declara `title` con `en`, `es` y `fr`
- **THEN** la validación pasa

#### Scenario: Clave de idioma desconocida
- **WHEN** un comando declara `title` con `en`, `es` y `fr-fr`
- **THEN** la validación del catálogo falla

### Requirement: Resolución del idioma con fallback a inglés
La extensión SHALL mostrar cada texto del catálogo en el idioma activo de la interfaz (ver `ui-localization`). Cuando un texto no tenga valor para ese idioma, SHALL mostrar su valor `en`. El fallback MUST aplicarse campo a campo, incluidos los `placeholder` usados en el ejemplo y las listas de `tags`.

#### Scenario: VS Code en español de Latinoamérica
- **WHEN** el idioma de VS Code es `es-419`
- **THEN** los textos del catálogo se resuelven a su valor `es`

#### Scenario: Idioma soportado con traducción
- **WHEN** el idioma activo es `fr` y el `title` de un comando tiene valor `fr`
- **THEN** el título se muestra en francés

#### Scenario: Idioma soportado sin traducción en el catálogo
- **WHEN** el idioma activo es `de` y el `title` de un comando solo tiene `en` y `es`
- **THEN** el título se muestra con su valor `en`

#### Scenario: VS Code en un idioma no soportado
- **WHEN** el idioma de VS Code es `nl`
- **THEN** los textos del catálogo se resuelven a su valor `en`

### Requirement: Identificadores únicos y con prefijo de categoría
Cada categoría SHALL tener un `id` en kebab-case. Cada comando SHALL tener un `id` con la forma `<id-de-categoría>.<nombre-kebab>`, único en todo el catálogo. El `id` del comando MUST ser la única referencia con la que otros componentes piden un comando.

#### Scenario: Id duplicado entre archivos
- **WHEN** dos archivos del catálogo contienen un comando con el mismo `id`
- **THEN** la validación del catálogo falla nombrando el id duplicado

#### Scenario: Prefijo incorrecto
- **WHEN** `catalog/git.json` contiene un comando con id `npm.install`
- **THEN** la validación del catálogo falla

#### Scenario: Búsqueda por id
- **WHEN** se pide el comando `git.new-branch`
- **THEN** se obtiene ese comando con todos sus campos

#### Scenario: Id inexistente
- **WHEN** se pide un id que no existe en el catálogo
- **THEN** no se obtiene ningún comando y no se produce ningún error no controlado

### Requirement: Plantillas y parámetros coherentes
Cada placeholder `${nombre}` que aparezca en `command` o en cualquier variante de `shells` SHALL corresponder a un parámetro declarado en `params`, y cada parámetro declarado SHALL aparecer en `command`. Los nombres de parámetro MUST ser únicos dentro de un comando.

#### Scenario: Placeholder sin declarar en bash
- **WHEN** `command` es `git checkout -b ${branch}` y `params` está vacío
- **THEN** la validación del catálogo falla nombrando `branch`

#### Scenario: Placeholder sin declarar en la variante PowerShell
- **WHEN** `shells.powershell` usa `${path}` y `params` no declara `path`
- **THEN** la validación del catálogo falla nombrando `path` y la variante `powershell`

#### Scenario: Parámetro declarado sin uso
- **WHEN** `params` declara `remote` pero `command` no contiene `${remote}`
- **THEN** la validación del catálogo falla

### Requirement: Variantes por shell
`command` SHALL ser la variante POSIX (bash y zsh). `shells` SHALL aceptar únicamente las claves `bash`, `zsh`, `powershell` y `cmd`. Para un shell dado, el comando efectivo SHALL ser su variante en `shells` si existe y `command` en caso contrario.

#### Scenario: Comando efectivo en PowerShell con variante
- **WHEN** un comando define `shells.powershell` y el shell es `powershell`
- **THEN** el comando efectivo es el de `shells.powershell`

#### Scenario: Comando efectivo en bash sin variante
- **WHEN** un comando no define `shells.bash` y el shell es `bash`
- **THEN** el comando efectivo es `command`

#### Scenario: Shell no soportado en el catálogo
- **WHEN** un comando declara `shells.fish`
- **THEN** la validación del catálogo falla

### Requirement: Ejemplo derivado de la plantilla
El ejemplo de un comando SHALL calcularse sustituyendo cada `${nombre}` del comando efectivo por el `placeholder` del parámetro en el idioma activo, o por su valor `en` si no hay traducción para ese idioma. Un comando sin parámetros SHALL usar como ejemplo su propio comando efectivo. El catálogo MUST NOT contener un campo de ejemplo escrito a mano.

#### Scenario: Ejemplo en español para bash
- **WHEN** el comando es `git checkout -b ${branch}`, el placeholder `es` es `feature/mi-cambio`, el idioma es español y el shell es `bash`
- **THEN** el ejemplo es `git checkout -b feature/mi-cambio`

#### Scenario: Ejemplo en inglés para PowerShell
- **WHEN** el mismo comando no tiene variante `powershell`, el placeholder `en` es `feature/my-change`, el idioma es inglés y el shell es `powershell`
- **THEN** el ejemplo es `git checkout -b feature/my-change`

#### Scenario: Ejemplo en un idioma sin traducción del placeholder
- **WHEN** el mismo comando no tiene placeholder `ja` y el idioma es japonés
- **THEN** el ejemplo usa el placeholder `en`: `git checkout -b feature/my-change`

#### Scenario: Comando sin parámetros
- **WHEN** el comando es `git status` y no tiene `params`
- **THEN** el ejemplo es `git status`

### Requirement: Nivel de riesgo obligatorio
Cada comando SHALL declarar `risk` con uno de los valores `safe`, `caution` o `destructive`.

#### Scenario: Comando destructivo
- **WHEN** un comando como `git reset --hard` declara `risk: "destructive"`
- **THEN** la validación pasa y el nivel de riesgo queda disponible para quien consuma el catálogo

#### Scenario: Valor de riesgo inválido
- **WHEN** un comando declara `risk: "danger"`
- **THEN** la validación del catálogo falla

### Requirement: Orden de categorías y comandos
Las categorías SHALL ordenarse por `order` ascendente y, si empatan, por `id`. Los comandos SHALL conservar el orden en el que aparecen en su archivo.

#### Scenario: Dos categorías con distinto orden
- **WHEN** `git` tiene `order: 10` y `npm` tiene `order: 20`
- **THEN** `git` aparece antes que `npm`

#### Scenario: Empate de orden
- **WHEN** `docker` y `bash` tienen el mismo `order`
- **THEN** `bash` aparece antes que `docker`

### Requirement: Catálogo empaquetado sin acceso a disco ni red
El catálogo SHALL viajar dentro del bundle de la extensión. Consultarlo MUST NOT requerir leer archivos en tiempo de ejecución ni hacer llamadas de red. Todo archivo de `catalog/` (salvo `schema.json`) SHALL formar parte del catálogo cargado.

#### Scenario: Categoría añadida pero no registrada
- **WHEN** existe `catalog/npm.json` pero no forma parte del catálogo cargado
- **THEN** los tests del catálogo fallan nombrando `npm.json`
