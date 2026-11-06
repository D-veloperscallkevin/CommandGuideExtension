## MODIFIED Requirements

### Requirement: Catálogo por categorías validado contra un schema
El catálogo SHALL estar formado por un archivo JSON por categoría dentro de `catalog/`. Cada archivo MUST validar contra `catalog/schema.json` y MUST declarar `version`, `id`, `title`, `icon`, `order`, `section` y `commands`.

`section` MUST ser uno de estos valores:
- `languages`;
- `vcs`;
- `frameworks`;
- `databases`;
- `infra`;
- `cloud`;
- `servers`;
- `quality`;
- `gamedev`;
- `tools`.

Cada comando MUST declarar `id`, `title`, `description`, `command`, `tags` y `risk`, y MAY declarar `params`, `shells` y `docs`. La validación MUST rechazar cualquier propiedad no definida en el schema, salvo `$schema`.

#### Scenario: Archivo de categoría válido
- **WHEN** un archivo de `catalog/` cumple todos los campos obligatorios del schema
- **THEN** la validación del catálogo pasa sin errores

#### Scenario: Falta un campo obligatorio
- **WHEN** un comando del catálogo no declara `risk`
- **THEN** la validación del catálogo falla e indica el archivo y la ruta del comando afectado

#### Scenario: Propiedad desconocida
- **WHEN** un comando declara una propiedad que no está en el schema, como `exampel`
- **THEN** la validación del catálogo falla

#### Scenario: Sección desconocida o ausente
- **WHEN** una categoría declara `"section": "misc"` o no declara `section`
- **THEN** la validación del catálogo falla

## REMOVED Requirements

### Requirement: Catálogo empaquetado sin acceso a disco ni red
**Reason**: Con unas 70 categorías, cargar el catálogo dentro del bundle en cada activación, que desde la 2.10 ocurre al arrancar VS Code, cuesta tiempo y memoria aunque el usuario no abra el panel.
**Migration**: Lo sustituye "Catálogo empaquetado cargado bajo demanda": los archivos viajan dentro del paquete de la extensión y se leen de disco solo cuando hacen falta, siempre sin red.

## ADDED Requirements

### Requirement: Catálogo empaquetado cargado bajo demanda
Los archivos del catálogo SHALL viajar dentro del paquete de la extensión (`.vsix`), en `dist/catalog/`, uno por categoría. La extensión MUST NOT leerlos durante la activación. SHALL leerlos la primera vez que necesita el catálogo (al abrir la vista o el buscador de la paleta, al enviar o copiar un comando, o al consultar favoritos y recientes) y SHALL conservarlos en memoria a partir de ese momento.

Consultar el catálogo MUST NOT hacer llamadas de red. Todo archivo de `catalog/`, salvo `schema.json`, SHALL formar parte del catálogo cargado. El `.vsix` MUST NOT superar los 2 MB.

#### Scenario: Activación sin abrir la vista
- **WHEN** VS Code arranca en Windows con PowerShell o en Linux con bash y el usuario no abre la vista ni ejecuta ningún comando de DevCommands
- **THEN** la extensión está activa y no ha leído ningún archivo del catálogo

#### Scenario: Primera apertura de la vista
- **WHEN** el usuario abre la vista por primera vez
- **THEN** la extensión lee los archivos de `dist/catalog/` una sola vez y la vista recibe todas las categorías

#### Scenario: Categoría añadida pero no empaquetada
- **WHEN** existe `catalog/npm.json` pero no forma parte del catálogo cargado o del `.vsix`
- **THEN** los tests del catálogo o la comprobación del empaquetado fallan nombrando `npm.json`

#### Scenario: Paquete demasiado grande
- **WHEN** el `.vsix` generado supera los 2 MB
- **THEN** `pnpm run release:package` falla indicando el tamaño
