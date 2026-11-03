# clipboard-integration Specification

## Purpose

Copia al portapapeles el texto de los comandos del catálogo que el usuario elige, sin tocar la terminal, y confirma la copia a la vista solo cuando ha funcionado.

## Requirements

### Requirement: Copiar el texto del comando
Al recibir una petición válida de copiar un comando, la extensión SHALL copiar al portapapeles del sistema el texto del comando del catálogo cuyo `id` se recibe. El texto SHALL construirse en la extensión con la misma regla que el texto que se enviaría a la terminal: la variante del shell de destino en el momento de la copia y, si el comando tiene parámetros, los valores que el usuario introduce, escapados para ese shell. Si el usuario cancela la petición de valores, la extensión MUST NOT modificar el portapapeles. Si el comando es `destructive` y la confirmación está activada, la extensión SHALL copiar el texto solo después de que el usuario confirme el aviso; si lo rechaza, MUST NOT modificar el portapapeles. Copiar MUST NOT escribir nada en ninguna terminal ni ejecutar nada. Si el `id` no existe en el catálogo, la extensión MUST NOT modificar el portapapeles y SHALL registrar una advertencia.

#### Scenario: Copiar en Windows con PowerShell
- **WHEN** el shell de destino es `powershell` y el usuario copia `git.status`
- **THEN** el portapapeles contiene exactamente `git status`, sin salto de línea final, y no se abre ni se modifica ninguna terminal

#### Scenario: Copiar en Linux con bash
- **WHEN** el shell de destino es `bash` y el usuario copia `git.new-branch` con el valor `feature/login`
- **THEN** el portapapeles contiene `git checkout -b feature/login`

#### Scenario: Copiar con Git Bash en Windows
- **WHEN** la extensión se ejecuta en Windows, la terminal activa es Git Bash y el usuario copia el comando de Terminal que borra una carpeta con el valor `mis cosas` y confirma el aviso
- **THEN** el portapapeles contiene `rm -rf 'mis cosas'`

#### Scenario: Mismo texto que el ejemplo
- **WHEN** la vista muestra el ejemplo de un comando sin parámetros y el usuario lo copia
- **THEN** el texto del portapapeles es idéntico a ese ejemplo

#### Scenario: Mismo texto que el envío
- **WHEN** el usuario copia un comando con parámetros y después lo envía con los mismos valores y el mismo shell de destino
- **THEN** el texto del portapapeles es idéntico al escrito en la terminal

#### Scenario: Copia cancelada
- **WHEN** el usuario copia `git.new-branch` y pulsa Escape en el cuadro del nombre de la rama
- **THEN** el portapapeles conserva su contenido anterior

#### Scenario: Confirmación rechazada
- **WHEN** el usuario copia `git.reset-hard` y cancela el aviso de comando destructivo
- **THEN** el portapapeles conserva su contenido anterior

#### Scenario: Id inexistente
- **WHEN** llega `{ "type": "copyToClipboard", "commandId": "git.nope" }`
- **THEN** el portapapeles conserva su contenido anterior y la extensión registra una advertencia

### Requirement: Confirmación de la copia
Cuando la copia termina bien, la extensión SHALL responder al webview con `copied`, que lleva el `commandId` copiado. Si la copia falla, el `id` no existe, el usuario cancela la petición de valores o rechaza el aviso de comando destructivo, la extensión MUST NOT enviar `copied` y MUST NOT lanzar errores no controlados. Un fallo de la copia o un `id` inexistente SHALL registrarse en el registro; una cancelación o un aviso rechazado SHALL registrarse como información, no como error.

#### Scenario: Copia correcta
- **WHEN** el webview envía `{ "type": "copyToClipboard", "commandId": "git.status" }` y el portapapeles acepta el texto
- **THEN** la extensión responde `{ "type": "copied", "commandId": "git.status" }`

#### Scenario: El portapapeles falla
- **WHEN** el sistema rechaza la escritura en el portapapeles
- **THEN** la extensión no envía `copied` y registra un error, y la vista sigue funcionando

#### Scenario: Copia cancelada
- **WHEN** el usuario copia `git.new-branch` y cancela el cuadro del valor
- **THEN** la extensión no envía `copied`, la vista no indica que se copió y el registro no contiene errores

#### Scenario: Aviso rechazado
- **WHEN** el usuario copia `git.clean` y cancela el aviso de comando destructivo
- **THEN** la extensión no envía `copied`, la vista no indica que se copió y el registro no contiene errores
