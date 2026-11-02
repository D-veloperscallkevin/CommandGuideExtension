## RENAMED Requirements

- FROM: `### Requirement: Ejemplo según el sistema operativo`
- TO: `### Requirement: Ejemplo según el shell de destino`

## MODIFIED Requirements

### Requirement: Ejemplo según el shell de destino
El ejemplo de cada comando SHALL construirse para el shell de destino (la terminal en la que se escribiría el comando): su variante en `shells` si existe y, si no, `command`.

#### Scenario: Windows con PowerShell
- **WHEN** el shell de destino es `powershell` y un comando define `shells.powershell`
- **THEN** su ejemplo se construye a partir de `shells.powershell`

#### Scenario: Linux con bash
- **WHEN** el shell de destino es `bash`
- **THEN** el ejemplo de cada comando se construye a partir de su variante `shells.bash` si existe, y si no a partir de `command`

#### Scenario: Windows con cmd
- **WHEN** el shell de destino es `cmd` y un comando define `shells.cmd`
- **THEN** su ejemplo se construye a partir de `shells.cmd`

## ADDED Requirements

### Requirement: Indicador del shell de los ejemplos
La vista SHALL mostrar, de forma discreta en la parte superior y en todas sus pantallas (inicio, búsqueda y categoría), para qué shell son los ejemplos, con el texto en el idioma activo (en español, "Ejemplos para: PowerShell") y el nombre del shell legible: `PowerShell`, `bash`, `zsh` o `cmd`. Cuando el shell cambie con la vista abierta, el nuevo texto SHALL anunciarse a los lectores de pantalla sin mover el foco. El texto del indicador SHALL existir en los 11 idiomas de la interfaz.

#### Scenario: Windows con PowerShell
- **WHEN** el idioma activo es `es` y el shell de destino es `powershell`
- **THEN** la vista muestra "Ejemplos para: PowerShell"

#### Scenario: Cambio con lector de pantalla
- **WHEN** el foco está en un comando de la lista, el idioma activo es `en` y el shell de destino cambia de `powershell` a `bash`
- **THEN** el indicador pasa a "Examples for: bash", el lector de pantalla lo anuncia y el foco sigue en el mismo comando
