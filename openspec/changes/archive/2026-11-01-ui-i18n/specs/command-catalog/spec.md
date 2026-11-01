# Spec Delta

## MODIFIED Requirements

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
