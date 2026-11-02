## MODIFIED Requirements

### Requirement: Contenido mínimo del catálogo empaquetado
El catálogo empaquetado SHALL contener al menos 5 categorías, y cada una SHALL contener al menos 15 comandos. Incluirá como mínimo las categorías `git`, `npm`, `pnpm`, `node`, `docker` y `terminal`. Los comandos de `terminal` SHALL declarar `shells.powershell` siempre que su sintaxis en PowerShell difiera de la variante POSIX, y `shells.cmd` siempre que su sintaxis en cmd difiera de la variante POSIX.

#### Scenario: Categorías del catálogo empaquetado
- **WHEN** se cargan las categorías del catálogo empaquetado
- **THEN** están `git`, `npm`, `pnpm`, `node`, `docker` y `terminal`, en ese orden

#### Scenario: Categoría con pocos comandos
- **WHEN** una categoría del catálogo empaquetado tiene menos de 15 comandos
- **THEN** los tests del catálogo fallan nombrando la categoría y su número de comandos

#### Scenario: Ejemplo de Terminal en Windows
- **WHEN** el shell es `powershell` y se muestra el comando de Terminal que borra una carpeta
- **THEN** el ejemplo usa la sintaxis de PowerShell (`Remove-Item -Recurse -Force …`) y no `rm -rf`

#### Scenario: Ejemplo de Terminal en cmd
- **WHEN** el shell es `cmd` y se muestra el comando de Terminal que borra una carpeta
- **THEN** el ejemplo usa la sintaxis de cmd (`rmdir /s /q …`) y no `rm -rf` ni `Remove-Item`

#### Scenario: Ejemplo de Terminal en bash
- **WHEN** el shell es `bash` y se muestra el comando de Terminal que borra una carpeta
- **THEN** el ejemplo es la variante POSIX (`rm -rf …`)
