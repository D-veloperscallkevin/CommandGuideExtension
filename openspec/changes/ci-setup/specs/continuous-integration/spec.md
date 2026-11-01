# Spec Delta

## Purpose

Garantiza que todo cambio que llega a las ramas protegidas compila, pasa lint y tests y produce un build completo en Windows, Linux y macOS antes de poder fusionarse.

## ADDED Requirements

### Requirement: Verificación automática de cada pull request
Todo pull request cuyo destino sea `develop`, `staging` o `main` SHALL disparar automáticamente la verificación del proyecto, y cada push nuevo al PR SHALL volver a dispararla. Una verificación en curso del mismo PR MUST cancelarse cuando empieza una más reciente.

#### Scenario: PR de una feature a develop
- **WHEN** se abre un PR de `feature/x` hacia `develop`
- **THEN** la verificación se ejecuta sin intervención manual

#### Scenario: Push nuevo sobre un PR con verificación en curso
- **WHEN** se hace push a un PR cuya verificación anterior no ha terminado
- **THEN** la verificación anterior se cancela y se ejecuta una nueva sobre el último commit

#### Scenario: PR hacia una rama no protegida
- **WHEN** se abre un PR hacia una rama distinta de `develop`, `staging` o `main`
- **THEN** la verificación no se dispara

### Requirement: Verificación en Windows, Linux y macOS
La verificación SHALL ejecutarse en Windows, Linux y macOS. En cada sistema MUST incluir: typecheck y lint de la extensión y del webview, los tests unitarios, el build completo y los tests de integración dentro de VS Code. El fallo en un sistema MUST NOT cancelar la verificación en los demás.

#### Scenario: Verificación en Windows (PowerShell)
- **WHEN** se ejecuta la verificación de un PR
- **THEN** todos los pasos se ejecutan en un runner Windows y su resultado se informa por separado

#### Scenario: Verificación en Linux (bash)
- **WHEN** se ejecuta la verificación de un PR
- **THEN** todos los pasos se ejecutan en un runner Linux, y los tests de integración corren con una pantalla virtual

#### Scenario: Fallo solo en un sistema
- **WHEN** un test falla en Windows pero pasa en Linux y macOS
- **THEN** las verificaciones de Linux y macOS terminan, y el resultado global del PR es fallido

### Requirement: Un único check obligatorio para fusionar
La verificación SHALL publicar un único check agregado llamado `ci-ok`, que solo tiene éxito si la verificación ha tenido éxito en todos los sistemas. Las ramas `develop`, `staging` y `main` MUST exigir `ci-ok` en verde para permitir el merge de un PR.

#### Scenario: Todo en verde
- **WHEN** la verificación pasa en los tres sistemas
- **THEN** `ci-ok` está en verde y el PR se puede fusionar

#### Scenario: Algún sistema falla
- **WHEN** la verificación falla o se cancela en cualquiera de los sistemas
- **THEN** `ci-ok` falla y GitHub bloquea el merge del PR

### Requirement: Build completo de la extensión
El build de producción del proyecto SHALL generar tanto el bundle de la extensión como el webview compilado, y el paso de prepublicación del paquete MUST ejecutar ese build completo.

#### Scenario: Build en una copia limpia
- **WHEN** se clona el repositorio, se instalan dependencias y se ejecuta el build de producción
- **THEN** existen `dist/extension.js` y `dist/webview/index.html` con sus assets

#### Scenario: Fallo de compilación del webview
- **WHEN** el webview tiene un error de TypeScript
- **THEN** el build de producción falla y la verificación del PR también

### Requirement: Entorno reproducible
La versión de Node usada por la verificación SHALL ser la declarada en `.nvmrc` del repositorio. Los archivos de texto SHALL guardarse en el repositorio con finales de línea LF, independientemente del sistema operativo de quien hace el commit.

#### Scenario: Cambio de versión de Node
- **WHEN** se cambia la versión en `.nvmrc`
- **THEN** la siguiente verificación usa esa versión sin modificar el workflow

#### Scenario: Commit desde Windows
- **WHEN** se hace commit desde Windows de un archivo editado con finales CRLF
- **THEN** el archivo queda guardado en el repositorio con finales LF
