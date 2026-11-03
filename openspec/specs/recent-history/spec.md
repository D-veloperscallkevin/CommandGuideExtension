# recent-history Specification

## Purpose

Guarda los últimos comandos escritos en la terminal con los valores de sus parámetros, y los reúne en una tarjeta y una pantalla propias para volver a enviarlos o copiarlos sin buscarlos ni teclear de nuevo los valores.

## Requirements

### Requirement: Registro de los comandos enviados
Cada vez que la extensión escribe un comando en la terminal, SHALL registrar en el historial una entrada con el id del comando y los valores de sus parámetros (sin valores si no tiene parámetros). Las reglas del registro:
- **Qué se guarda:** los valores tal como se aceptaron, no el texto final.
- **Orden:** el historial SHALL ordenarse del envío más reciente al más antiguo y guardar como máximo 20 entradas; al superar ese número, SHALL descartar la más antigua.
- **Repeticiones:** si ya existe una entrada con el mismo comando y exactamente los mismos valores, SHALL moverse al principio en lugar de duplicarse.
- **Qué no se registra:** la extensión MUST NOT registrar un comando copiado al portapapeles, un envío cancelado en el cuadro de un valor, un envío cuyo aviso de comando destructivo se rechaza, ni un envío que falla.
- **Dónde se guarda:** en el almacenamiento global de la extensión de este equipo. MUST NOT registrarse para Settings Sync.
- **Registro (log):** los valores MUST NOT escribirse en el registro de la extensión.

Al leer el historial guardado, la extensión SHALL omitir:
- las entradas de comandos que ya no existen en el catálogo;
- las entradas cuyos nombres de valores no coinciden exactamente con los parámetros actuales del comando;
- las entradas con valores vacíos, de más de 500 caracteres o con caracteres de control.

#### Scenario: Primer envío
- **WHEN** el historial está vacío y el usuario envía `git.status` a la terminal
- **THEN** el historial tiene una entrada, `git.status` sin valores

#### Scenario: Envío con valores
- **WHEN** el usuario envía `git.new-branch` con el valor `fix/login`
- **THEN** la primera entrada del historial es `git.new-branch` con el valor `fix/login` para `branch`

#### Scenario: Mismo comando con otros valores
- **WHEN** el historial contiene `git.new-branch` con `fix/login` y el usuario envía `git.new-branch` con `docs/readme`
- **THEN** el historial tiene dos entradas de `git.new-branch`, primero la de `docs/readme`

#### Scenario: Repetición exacta
- **WHEN** el historial contiene `docker.ps` y después `git.status`, y el usuario envía `git.status`
- **THEN** el historial es `git.status`, `docker.ps`, sin duplicados

#### Scenario: Límite de 20
- **WHEN** el historial tiene 20 entradas y el usuario envía un comando que no está en él
- **THEN** el historial sigue teniendo 20 entradas, la nueva primero, y la más antigua ya no está

#### Scenario: Copiar no registra
- **WHEN** el usuario copia `git.status` al portapapeles
- **THEN** el historial no cambia

#### Scenario: Envío cancelado o no confirmado
- **WHEN** el usuario pulsa Escape en el cuadro del nombre de la rama de `git.new-branch`, o rechaza el aviso de `git.reset-hard`
- **THEN** el historial no cambia

#### Scenario: Comando eliminado del catálogo
- **WHEN** el historial guardado contiene `git.antiguo`, que ya no está en el catálogo, y `git.status`
- **THEN** el historial que se muestra solo contiene `git.status`

### Requirement: Tarjeta de recientes
Si hay al menos una entrada en el historial, la lista de categorías SHALL mostrar una tarjeta "Recientes" (en el idioma activo) con un icono de historial y su número de comandos con la forma plural correcta. La tarjeta SHALL ir después de la tarjeta "Favoritos" si existe, o como primera entrada si no existe. Sin historial, la tarjeta MUST NOT mostrarse. La tarjeta SHALL comportarse con el teclado y el lector de pantalla como una entrada de categoría más.

#### Scenario: Con favoritos y recientes
- **WHEN** hay 2 favoritos, 3 entradas en el historial y el idioma activo es `es`
- **THEN** la lista empieza por "Favoritos", seguida de "Recientes" con el texto "3 comandos", y después Git

#### Scenario: Sin favoritos
- **WHEN** no hay favoritos y hay 1 entrada en el historial
- **THEN** la primera entrada de la lista es "Recientes" con "1 comando"

#### Scenario: Sin historial
- **WHEN** el historial está vacío
- **THEN** la lista de categorías no muestra la tarjeta "Recientes"

### Requirement: Pantalla de recientes
Activar la tarjeta "Recientes" SHALL mostrar una pantalla como la de una categoría:
- el título "Recientes" y el número de comandos;
- un control para volver;
- un botón "Borrar historial";
- las entradas del historial de la más reciente a la más antigua.

**Contenido de cada entrada:**
- el título del comando y el nombre de su categoría;
- su texto con los valores guardados, escapados para el shell de destino actual;
- si algún valor no es válido para ese shell, el texto con los valores tal como se escribieron, sin escapar, y debajo un aviso visible (en el idioma activo) de que no es válido en ese shell y de que el valor se pedirá al enviarlo. El aviso SHALL formar parte del nombre accesible de la entrada;
- la estrella de favorito, que SHALL funcionar igual que en cualquier lista.

**Orden mientras la pantalla está abierta:** las entradas SHALL conservar el orden con que se abrió la pantalla, aunque se envíen. Las entradas nuevas SHALL verse al volver a abrirla. Si el shell de destino cambia, los textos SHALL actualizarse sin cambiar el orden.

**Volver:** con el control o con Escape SHALL mostrarse la lista de categorías con el foco en la tarjeta "Recientes", o en la primera entrada si la tarjeta ya no existe.

**Restauración:** la pantalla y la entrada con foco SHALL guardarse y restaurarse como las de una categoría.

**Historial vacío:** si al restaurar la pantalla, o tras borrarlo, el historial está vacío, la pantalla SHALL indicar que no hay comandos recientes.

#### Scenario: Abrir los recientes
- **WHEN** el usuario envió `git.status` y después `terminal.make-directory` con `src`, el shell de destino es `bash` y activa la tarjeta
- **THEN** la pantalla muestra "Recientes", "2 comandos", primero "Crear carpeta" con `mkdir -p src` y la categoría "Terminal", y después `git status` con "Git"

#### Scenario: Texto para PowerShell
- **WHEN** el historial contiene `terminal.make-directory` con `src` y el shell de destino es `powershell`
- **THEN** la entrada muestra `New-Item -ItemType Directory -Force src`

#### Scenario: Cambio de shell con la pantalla abierta
- **WHEN** la pantalla de recientes está abierta y el shell de destino cambia de `powershell` a `bash`
- **THEN** la entrada de `terminal.make-directory` pasa a mostrar `mkdir -p src`, en la misma posición

#### Scenario: Valor no válido para el shell actual
- **WHEN** el historial contiene `git.commit` con el mensaje `say "hi"`, guardado con `bash`, el shell de destino es `powershell` y el idioma activo es `es`
- **THEN** la entrada muestra `git commit -m "say "hi""` y debajo el aviso "No es válido en PowerShell: se te pedirá el valor al enviarlo."

#### Scenario: Volver con Escape
- **WHEN** el foco está en una entrada de la pantalla de recientes y el usuario pulsa Escape
- **THEN** se muestra la lista de categorías con el foco en la tarjeta "Recientes"

### Requirement: Reenvío y copia de una entrada
Enviar una entrada de la pantalla de recientes SHALL escribir en la terminal, sin ejecutarlo, el comando con los valores guardados, escapados para el shell de destino del momento, sin pedirlos de nuevo. Las reglas del reenvío:
- **Valor no válido:** si algún valor guardado no es válido para ese shell, la extensión SHALL pedir los valores con los cuadros de siempre, cada uno con el valor guardado ya escrito.
- **Destructivos:** si el comando es `destructive` y la confirmación está activada, SHALL pedir la confirmación como en cualquier envío.
- **Registro:** el reenvío SHALL registrarse en el historial como cualquier envío.

Copiar una entrada SHALL copiar al portapapeles ese mismo texto, con las mismas reglas de valores y de confirmación, sin registrarla en el historial. Si la entrada ya no existe en el historial, la extensión MUST NOT escribir ni copiar nada y SHALL registrar una advertencia.

#### Scenario: Reenviar con los valores guardados en bash
- **WHEN** el historial contiene `git.new-branch` con `fix/login`, el shell de destino es `bash` y el usuario envía esa entrada
- **THEN** la terminal recibe `git checkout -b fix/login` sin que aparezca ningún cuadro

#### Scenario: Reenviar en PowerShell un valor guardado desde bash
- **WHEN** el historial contiene `terminal.make-directory` con `mi carpeta`, guardado con el shell `bash`, el shell de destino es ahora `powershell` y el usuario envía esa entrada
- **THEN** la terminal recibe `New-Item -ItemType Directory -Force 'mi carpeta'` sin que aparezca ningún cuadro

#### Scenario: Valor no válido para el shell actual
- **WHEN** el historial contiene `git.commit` con el mensaje `say "hi"`, guardado con `bash`, el shell de destino es `powershell` y el usuario envía esa entrada
- **THEN** aparece el cuadro del mensaje con `say "hi"` ya escrito y su error de validación, y no se escribe nada hasta que el usuario lo corrige y lo acepta

#### Scenario: Reenviar un destructivo
- **WHEN** el historial contiene `terminal.remove-directory` con `tmp` y el usuario envía esa entrada
- **THEN** aparece el aviso de comando destructivo, y solo si lo confirma la terminal recibe el comando

#### Scenario: Copiar una entrada
- **WHEN** el historial contiene `git.new-branch` con `fix/login`, el shell de destino es `bash` y el usuario copia esa entrada
- **THEN** el portapapeles contiene `git checkout -b fix/login`, la entrada muestra la confirmación de copiado y el historial no cambia

#### Scenario: Entrada borrada
- **WHEN** llega un reenvío de una entrada que ya no está en el historial
- **THEN** no se escribe nada en ninguna terminal y la extensión registra una advertencia

### Requirement: Borrar el historial
El botón "Borrar historial" de la pantalla de recientes SHALL vaciar el historial guardado. Tras borrarlo, la pantalla SHALL indicar que no hay comandos recientes, el foco SHALL quedar en el título de la pantalla y, al volver, la lista de categorías MUST NOT mostrar la tarjeta "Recientes". Borrar el historial MUST NOT cambiar los favoritos.

#### Scenario: Borrar
- **WHEN** el historial tiene 3 entradas y el usuario pulsa "Borrar historial"
- **THEN** la pantalla indica que no hay comandos recientes y, al volver, no aparece la tarjeta "Recientes"

#### Scenario: Los favoritos no cambian
- **WHEN** `git.status` es favorito y está en el historial, y el usuario borra el historial
- **THEN** `git.status` sigue siendo favorito
