## ADDED Requirements

### Requirement: Contenido mínimo del catálogo empaquetado
El catálogo empaquetado SHALL contener al menos 5 categorías, y cada una SHALL contener al menos 15 comandos. Incluirá como mínimo las categorías `git`, `npm`, `pnpm`, `node`, `docker` y `terminal`. Los comandos de `terminal` SHALL declarar `shells.powershell` siempre que su sintaxis en PowerShell difiera de la variante POSIX.

#### Scenario: Categorías del catálogo empaquetado
- **WHEN** se cargan las categorías del catálogo empaquetado
- **THEN** están `git`, `npm`, `pnpm`, `node`, `docker` y `terminal`, en ese orden

#### Scenario: Categoría con pocos comandos
- **WHEN** una categoría del catálogo empaquetado tiene menos de 15 comandos
- **THEN** los tests del catálogo fallan nombrando la categoría y su número de comandos

#### Scenario: Ejemplo de Terminal en Windows
- **WHEN** el shell es `powershell` y se muestra el comando de Terminal que borra una carpeta
- **THEN** el ejemplo usa la sintaxis de PowerShell (`Remove-Item -Recurse -Force …`) y no `rm -rf`

### Requirement: Catálogo empaquetado traducido a los 11 idiomas
Todo texto del catálogo empaquetado (`title` de la categoría, `title` y `description` de cada comando, `label` y `placeholder` de cada parámetro) SHALL tener valor no vacío en los 11 idiomas de la interfaz: `en`, `es`, `pt-br`, `fr`, `de`, `it`, `ja`, `ko`, `zh-cn`, `zh-tw` y `ru`. Los `tags` SHALL tener una lista no vacía en esos 11 idiomas. Esta obligación MUST comprobarse en los tests del catálogo empaquetado y MUST NOT añadirse al schema, que sigue aceptando los 9 idiomas adicionales como opcionales.

#### Scenario: Comando empaquetado sin un idioma
- **WHEN** un comando del catálogo empaquetado declara `description` sin valor `ko`
- **THEN** los tests del catálogo fallan nombrando el id del comando, el campo y el idioma

#### Scenario: Placeholder que no es texto
- **WHEN** un parámetro tiene un placeholder que no se traduce, como el nombre de una imagen `node:22-alpine`
- **THEN** declara ese mismo valor en los 11 idiomas y los tests pasan

#### Scenario: Schema sin cambios
- **WHEN** un archivo de categoría que no forma parte del catálogo empaquetado declara textos solo con `en` y `es`
- **THEN** la validación contra el schema pasa
