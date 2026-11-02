## ADDED Requirements

### Requirement: Copiar el texto del comando
Al recibir una petición válida de copiar un comando, la extensión SHALL copiar al portapapeles del sistema el texto del comando del catálogo cuyo `id` se recibe. El texto SHALL construirse en la extensión con la misma regla que el ejemplo visible: la variante del shell por defecto del sistema y los placeholders en el idioma activo. Copiar MUST NOT escribir nada en ninguna terminal ni ejecutar nada. Si el `id` no existe en el catálogo, la extensión MUST NOT modificar el portapapeles y SHALL registrar una advertencia.

#### Scenario: Copiar en Windows con PowerShell
- **WHEN** la extensión se ejecuta en Windows y el usuario copia `git.status`
- **THEN** el portapapeles contiene exactamente `git status`, sin salto de línea final, y no se abre ni se modifica ninguna terminal

#### Scenario: Copiar en Linux con bash
- **WHEN** la extensión se ejecuta en Linux con el idioma activo `es` y el usuario copia `git.new-branch`
- **THEN** el portapapeles contiene `git checkout -b feature/mi-cambio`

#### Scenario: Mismo texto que el ejemplo
- **WHEN** la vista muestra el ejemplo de un comando y el usuario lo copia
- **THEN** el texto del portapapeles es idéntico a ese ejemplo

#### Scenario: Id inexistente
- **WHEN** llega `{ "type": "copyToClipboard", "commandId": "git.nope" }`
- **THEN** el portapapeles conserva su contenido anterior y la extensión registra una advertencia

### Requirement: Confirmación de la copia
Cuando la copia termina bien, la extensión SHALL responder al webview con `copied`, que lleva el `commandId` copiado. Si la copia falla o el `id` no existe, la extensión MUST NOT enviar `copied`, MUST NOT lanzar errores no controlados y SHALL registrar el fallo en su registro.

#### Scenario: Copia correcta
- **WHEN** el webview envía `{ "type": "copyToClipboard", "commandId": "git.status" }` y el portapapeles acepta el texto
- **THEN** la extensión responde `{ "type": "copied", "commandId": "git.status" }`

#### Scenario: El portapapeles falla
- **WHEN** el sistema rechaza la escritura en el portapapeles
- **THEN** la extensión no envía `copied` y registra un error, y la vista sigue funcionando
