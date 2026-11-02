## MODIFIED Requirements

### Requirement: Copiar el texto del comando
Al recibir una petición válida de copiar un comando, la extensión SHALL copiar al portapapeles del sistema el texto del comando del catálogo cuyo `id` se recibe. El texto SHALL construirse en la extensión con la misma regla que el ejemplo visible: la variante del shell de destino en el momento de la copia y los placeholders en el idioma activo. Copiar MUST NOT escribir nada en ninguna terminal ni ejecutar nada. Si el `id` no existe en el catálogo, la extensión MUST NOT modificar el portapapeles y SHALL registrar una advertencia.

#### Scenario: Copiar en Windows con PowerShell
- **WHEN** el shell de destino es `powershell` y el usuario copia `git.status`
- **THEN** el portapapeles contiene exactamente `git status`, sin salto de línea final, y no se abre ni se modifica ninguna terminal

#### Scenario: Copiar en Linux con bash
- **WHEN** el shell de destino es `bash`, el idioma activo es `es` y el usuario copia `git.new-branch`
- **THEN** el portapapeles contiene `git checkout -b feature/mi-cambio`

#### Scenario: Copiar con Git Bash en Windows
- **WHEN** la extensión se ejecuta en Windows, la terminal activa es Git Bash y el usuario copia el comando de Terminal que borra una carpeta
- **THEN** el portapapeles contiene la variante POSIX (`rm -rf …`)

#### Scenario: Mismo texto que el ejemplo
- **WHEN** la vista muestra el ejemplo de un comando y el usuario lo copia
- **THEN** el texto del portapapeles es idéntico a ese ejemplo

#### Scenario: Id inexistente
- **WHEN** llega `{ "type": "copyToClipboard", "commandId": "git.nope" }`
- **THEN** el portapapeles conserva su contenido anterior y la extensión registra una advertencia
