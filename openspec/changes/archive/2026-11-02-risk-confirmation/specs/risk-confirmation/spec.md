## Purpose

Pide una confirmación explícita antes de escribir en la terminal o copiar un comando marcado como `destructive`, mostrando el texto exacto que se va a usar, para que un clic o un Enter no deje a un paso de perder trabajo sin una pausa.

## ADDED Requirements

### Requirement: Confirmar los comandos destructivos
Al enviar o copiar un comando con `risk` `destructive`, la extensión SHALL mostrar un aviso modal de VS Code antes de escribir en la terminal o modificar el portapapeles. El aviso SHALL mostrarse después de pedir los valores de los parámetros, si el comando los tiene, y nunca si el usuario los ha cancelado. El mensaje SHALL incluir el título del comando en el idioma activo y decir que es destructivo; el detalle SHALL incluir el texto exacto que se escribirá o copiará, ya con los valores escapados, y recordar al enviar que el comando no se ejecuta hasta pulsar Enter. El aviso SHALL tener un único botón de confirmación, "Escribir en la terminal" al enviar y "Copiar" al copiar, además de la cancelación propia del aviso. Si el usuario cancela o cierra el aviso (Escape), la extensión MUST NOT escribir en ninguna terminal ni modificar el portapapeles y SHALL registrar la cancelación como información, no como error. Los comandos `safe` y `caution` MUST NOT mostrar el aviso.

#### Scenario: Enviar un comando destructivo sin parámetros
- **WHEN** el idioma activo es `es` y el usuario envía `git.reset-hard`
- **THEN** aparece un aviso modal que nombra "Descartar todos los cambios locales" (el título del comando) como destructivo, con `git reset --hard` en el detalle y el botón "Escribir en la terminal", y no se escribe nada hasta que el usuario lo pulsa

#### Scenario: Confirmar el envío
- **WHEN** el aviso de `git.reset-hard` está abierto y el usuario pulsa "Escribir en la terminal"
- **THEN** la terminal muestra `git reset --hard` sin ejecutarlo

#### Scenario: Comando destructivo con parámetros
- **WHEN** el shell de destino es `bash`, el usuario envía `terminal.remove-directory` y escribe `mis cosas` en el cuadro de la carpeta
- **THEN** después del cuadro aparece el aviso con `rm -rf 'mis cosas'` en el detalle

#### Scenario: Cancelar el valor no muestra el aviso
- **WHEN** el usuario envía `terminal.remove-directory` y pulsa Escape en el cuadro de la carpeta
- **THEN** no aparece ningún aviso y no se escribe nada

#### Scenario: Cancelar el aviso al enviar
- **WHEN** el aviso de `git.clean` está abierto y el usuario pulsa Escape
- **THEN** no se escribe nada en ninguna terminal, no se crea ninguna terminal y el registro no contiene errores

#### Scenario: Copiar un comando destructivo
- **WHEN** el usuario copia `docker.system-prune`
- **THEN** aparece el aviso con `docker system prune -a` en el detalle y el botón "Copiar", y el portapapeles solo cambia si el usuario lo pulsa

#### Scenario: Cancelar el aviso al copiar
- **WHEN** el aviso de copiar `docker.system-prune` está abierto y el usuario lo cancela
- **THEN** el portapapeles conserva su contenido anterior y la vista no indica que se copió

#### Scenario: Comando con precaución
- **WHEN** el usuario envía `git.amend`, marcado como `caution`
- **THEN** no aparece ningún aviso y el comando se escribe directamente

### Requirement: Ajuste para desactivar la confirmación
La extensión SHALL ofrecer el ajuste `devcommands.confirmDestructive`, booleano y activado por defecto, con su descripción en los 11 idiomas de la interfaz. Con el ajuste desactivado, los comandos `destructive` SHALL enviarse y copiarse sin aviso, igual que los demás. El ajuste SHALL leerse en cada envío o copia, de modo que un cambio se aplica sin recargar la ventana.

#### Scenario: Ajuste por defecto
- **WHEN** el usuario no ha cambiado el ajuste y envía `git.reset-hard`
- **THEN** aparece el aviso modal

#### Scenario: Ajuste desactivado
- **WHEN** el usuario ha puesto `devcommands.confirmDestructive` a `false` y copia `git.reset-hard`
- **THEN** no aparece ningún aviso y el portapapeles contiene `git reset --hard`

#### Scenario: Cambio sin recargar
- **WHEN** el usuario desactiva el ajuste con la vista abierta y después envía `git.clean`
- **THEN** el comando se escribe sin aviso, sin recargar la ventana

#### Scenario: Descripción traducida
- **WHEN** VS Code está en francés y el usuario busca el ajuste en la configuración
- **THEN** la descripción del ajuste aparece en francés
