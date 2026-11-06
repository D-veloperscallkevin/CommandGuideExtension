## MODIFIED Requirements

### Requirement: Indicador del shell de los ejemplos
La vista SHALL mostrar en la parte superior, en todas sus pantallas (inicio, búsqueda y categoría) y en la misma fila que el botón de patrocinio, el shell de la terminal en la que se escribiría, con el texto en el idioma activo (en español, "Terminal: PowerShell") y el nombre del shell legible: `PowerShell`, `bash`, `zsh` o `cmd`.

El nombre del shell SHALL mostrarse con un color propio que lo distinga del resto del texto: azul para PowerShell, verde para bash, morado para zsh y amarillo para cmd. Los colores SHALL tomarse de los colores de terminal del tema activo, en un tono claro en los temas oscuros y en un tono más oscuro en los temas claros, para mantener el contraste. En los temas de alto contraste SHALL usarse el color de texto del tema.

Cuando el shell cambie con la vista abierta, el nuevo texto SHALL anunciarse a los lectores de pantalla sin mover el foco. El texto del indicador SHALL existir en los 11 idiomas de la interfaz.

#### Scenario: Windows con PowerShell
- **WHEN** el idioma activo es `es` y el shell de destino es `powershell`
- **THEN** la vista muestra "Terminal: PowerShell", con "PowerShell" en azul

#### Scenario: Linux con bash
- **WHEN** el idioma activo es `es`, el tema es oscuro y el shell de destino es `bash`
- **THEN** la vista muestra "Terminal: bash", con "bash" en verde claro

#### Scenario: Cambio con lector de pantalla
- **WHEN** el foco está en un comando de la lista, el idioma activo es `en` y el shell de destino cambia de `powershell` a `bash`
- **THEN** el indicador pasa a "Terminal: bash", el lector de pantalla lo anuncia y el foco sigue en el mismo comando

#### Scenario: Alto contraste
- **WHEN** el tema activo es de alto contraste
- **THEN** el nombre del shell usa el color de texto del tema
