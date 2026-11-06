# custom-commands Specification

## Purpose

Permite al usuario añadir sus propios comandos y categorías en su configuración de usuario, validados con las mismas reglas que el catálogo incluido, para usarlos en la vista igual que cualquier otro comando.

## Requirements

### Requirement: Ajuste de comandos propios
La extensión SHALL leer los comandos propios del ajuste `devcommands.customCommands`. El ajuste es una lista de categorías:
- **Ámbito:** el ajuste SHALL declararse con ámbito de aplicación, para que solo se pueda definir en la configuración de usuario. Un valor en la configuración de un espacio de trabajo MUST NOT tenerse en cuenta.
- **Esquema:** el ajuste SHALL declarar un esquema JSON con el que VS Code autocompleta y marca los errores al editarlo.
- **Categoría:**
  - `id`, en kebab-case, obligatorio;
  - `title`, obligatorio;
  - `icon`, opcional: un Codicon, y si falta, el de terminal;
  - `commands`, una lista obligatoria.
- **Comando:**
  - `id`, en kebab-case, obligatorio;
  - `title`, obligatorio;
  - `command`, obligatorio: la plantilla POSIX con placeholders `${x}`;
  - `description`, opcional;
  - `params`, opcional: cada uno con `name`, `label` y `placeholder`;
  - `risk`, opcional: `safe`, `caution` o `destructive`, y si falta, `safe`;
  - `shells`, opcional: variantes para `bash`, `zsh`, `powershell` o `cmd`;
  - `tags`, opcional.
- **Textos:** `title`, `description`, `label` y `placeholder` SHALL aceptar un texto simple, que se muestra en todos los idiomas, o un objeto con al menos uno de los 11 idiomas admitidos. Si falta el idioma activo, se usa `en`, después `es` y después el primero declarado. `tags` SHALL aceptar una lista de textos o un objeto con una lista por idioma.

#### Scenario: Categoría propia mínima
- **WHEN** el ajuste contiene `[{ "id": "mi-proyecto", "title": "Mi proyecto", "commands": [{ "id": "deploy", "title": "Desplegar", "command": "pnpm run deploy" }] }]`
- **THEN** la vista muestra la categoría "Mi proyecto" con el icono de terminal y el comando "Desplegar", sin etiqueta de riesgo, con el ejemplo `pnpm run deploy`

#### Scenario: Textos traducidos
- **WHEN** un comando propio declara `"title": { "en": "Deploy", "es": "Desplegar" }` y el idioma activo es `en`
- **THEN** la vista muestra "Deploy"

#### Scenario: Valor en la configuración del espacio de trabajo
- **WHEN** el archivo `.vscode/settings.json` de un proyecto define `devcommands.customCommands`
- **THEN** la vista no muestra esas categorías

### Requirement: Validación de los comandos propios
La extensión SHALL validar los comandos propios con las mismas reglas que el catálogo:
- ids en kebab-case;
- cada placeholder de `command` y de `shells` declarado en `params`, y cada parámetro usado en `command`;
- parámetros sin nombres repetidos;
- un `risk` válido;
- textos no vacíos.

Además, `command` y cada variante de `shells` MUST NOT contener saltos de línea ni otros caracteres de control, y MUST NOT superar 1000 caracteres.

La validación SHALL hacerse por partes:
- un comando no válido se omite y el resto de su categoría se muestra;
- una categoría sin `id` o `title` válidos, con un `id` repetido o sin ningún comando válido se omite entera;
- un comando con un `id` repetido dentro de su categoría se omite.

Por cada elemento omitido, la extensión SHALL registrar en el registro de DevCommands un mensaje con su posición o su id y el motivo. Si se omite alguno, SHALL mostrar un aviso con el número de comandos y categorías omitidos y los botones "Abrir configuración" y "Ver registro". El aviso SHALL mostrarse al leer el ajuste por primera vez y cada vez que cambie, y MUST NOT repetirse si el resultado no ha cambiado. Un valor del ajuste que no sea una lista SHALL tratarse como una lista vacía, con su mensaje y su aviso.

#### Scenario: Placeholder sin declarar
- **WHEN** un comando propio tiene `"command": "ssh ${host}"` sin `params`
- **THEN** el comando no aparece, el registro indica que `${host}` no está declarado y aparece el aviso

#### Scenario: Salto de línea en la plantilla
- **WHEN** un comando propio tiene `"command": "cd app\nrm -rf dist"`
- **THEN** el comando no aparece y el registro indica que la plantilla contiene caracteres de control

#### Scenario: Un comando inválido no afecta al resto
- **WHEN** una categoría propia tiene un comando válido y otro con `"risk": "danger"`
- **THEN** la categoría aparece con el comando válido y el registro indica el riesgo no válido del otro

#### Scenario: Categoría repetida
- **WHEN** el ajuste contiene dos categorías con `"id": "mi-proyecto"`
- **THEN** solo aparece la primera y el registro indica el id repetido

#### Scenario: Todo válido
- **WHEN** todos los comandos propios son válidos
- **THEN** no aparece ningún aviso

### Requirement: Integración con el catálogo
Las categorías propias válidas SHALL aparecer en la lista de categorías en una sección propia, "Mis comandos" en el idioma activo, situada después de las secciones del catálogo incluido, en el orden del ajuste y con sus comandos en el orden en que se declaran.

Internamente, el id de una categoría propia SHALL ser `custom-<id>` y el de un comando `custom-<id-de-categoría>.<id>`, para que nunca coincidan con los del catálogo incluido.

Los comandos propios SHALL comportarse como los del catálogo en todo lo demás:
- búsqueda;
- envío a la terminal sin ejecutar, con la variante del shell de destino;
- copia;
- petición y escapado de parámetros;
- confirmación de los destructivos;
- favoritos;
- recientes.

#### Scenario: Orden en la lista
- **WHEN** hay dos categorías propias, "B" y "A", en ese orden en el ajuste, y el usuario despliega "Mis comandos"
- **THEN** la sección "Mis comandos" aparece después de las del catálogo y muestra "B" y "A"

#### Scenario: Sin categorías propias
- **WHEN** el ajuste no define ninguna categoría propia válida
- **THEN** la lista no muestra la sección "Mis comandos"

#### Scenario: Enviar con parámetros en PowerShell
- **WHEN** un comando propio tiene `"command": "ssh ${host}"` con el parámetro `host`, el shell de destino es `powershell` y el usuario lo envía con el valor `mi servidor`
- **THEN** la terminal recibe `ssh 'mi servidor'` sin ejecutarlo

#### Scenario: Variante para bash
- **WHEN** un comando propio tiene `"command": "ls -la"` y `"shells": { "powershell": "Get-ChildItem -Force" }`, y el shell de destino es `bash`
- **THEN** el ejemplo y el texto enviado son `ls -la`

#### Scenario: Destructivo propio
- **WHEN** un comando propio declara `"risk": "destructive"` y el usuario lo envía
- **THEN** aparece el aviso de comando destructivo antes de escribirlo

#### Scenario: Búsqueda
- **WHEN** el usuario busca "desplegar" y existe el comando propio "Desplegar"
- **THEN** los resultados incluyen ese comando con el nombre de su categoría propia

### Requirement: Recarga al cambiar el ajuste
Cuando cambia `devcommands.customCommands`, la extensión SHALL volver a leerlo y validarlo, y enviar al webview listo `catalog`, `favorites` e `history` con el resultado, sin recargar VS Code. La vista SHALL conservar la pantalla, la búsqueda y el foco si siguen existiendo. Los favoritos y las entradas de recientes de comandos propios que ya no existen SHALL dejar de mostrarse, como los de comandos eliminados del catálogo.

#### Scenario: Añadir un comando
- **WHEN** la vista está en la lista de categorías y el usuario guarda `settings.json` con una categoría propia nueva
- **THEN** la nueva categoría aparece al final de la lista sin recargar la ventana

#### Scenario: Borrar un comando favorito
- **WHEN** `custom-mi-proyecto.deploy` es favorito y el usuario lo quita del ajuste
- **THEN** la tarjeta "Favoritos" deja de contarlo y la pantalla de favoritos no lo muestra

#### Scenario: Categoría abierta eliminada
- **WHEN** la vista muestra la categoría propia "Mi proyecto" y el usuario la quita del ajuste
- **THEN** la vista vuelve a la lista de categorías

### Requirement: Editar los comandos propios
La extensión SHALL ofrecer en la paleta de comandos "DevCommands: Editar comandos propios" (en el idioma activo). El comando SHALL abrir el `settings.json` de usuario en el ajuste `devcommands.customCommands`. Si el ajuste no tiene ninguna categoría, SHALL añadir antes una categoría de ejemplo con un comando que use un parámetro, con textos en el idioma activo y riesgo `safe`.

#### Scenario: Ajuste vacío
- **WHEN** el ajuste no está definido y el usuario ejecuta "DevCommands: Editar comandos propios"
- **THEN** se abre `settings.json` en el ajuste, que contiene la categoría de ejemplo, y la vista la muestra

#### Scenario: Ajuste con categorías
- **WHEN** el ajuste ya tiene categorías y el usuario ejecuta el comando
- **THEN** se abre `settings.json` en el ajuste sin modificarlo
