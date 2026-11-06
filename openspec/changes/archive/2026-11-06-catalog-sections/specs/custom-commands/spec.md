## MODIFIED Requirements

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
