## MODIFIED Requirements

### Requirement: Identificadores únicos y con prefijo de categoría
Cada categoría SHALL tener un `id` en kebab-case. Cada comando SHALL tener un `id` con la forma `<id-de-categoría>.<nombre-kebab>`, único en todo el catálogo. El `id` del comando MUST ser la única referencia con la que otros componentes piden un comando. El prefijo `custom-` queda reservado para los comandos propios del usuario: ningún `id` de categoría del catálogo incluido MUST empezar por `custom-`.

#### Scenario: Id duplicado entre archivos
- **WHEN** dos archivos del catálogo contienen un comando con el mismo `id`
- **THEN** la validación del catálogo falla nombrando el id duplicado

#### Scenario: Prefijo incorrecto
- **WHEN** `catalog/git.json` contiene un comando con id `npm.install`
- **THEN** la validación del catálogo falla

#### Scenario: Prefijo reservado
- **WHEN** el catálogo incluido contiene una categoría con id `custom-tools`
- **THEN** la validación del catálogo falla indicando que el prefijo está reservado

#### Scenario: Búsqueda por id
- **WHEN** se pide el comando `git.new-branch`
- **THEN** se obtiene ese comando con todos sus campos

#### Scenario: Id inexistente
- **WHEN** se pide un id que no existe en el catálogo
- **THEN** no se obtiene ningún comando y no se produce ningún error no controlado
