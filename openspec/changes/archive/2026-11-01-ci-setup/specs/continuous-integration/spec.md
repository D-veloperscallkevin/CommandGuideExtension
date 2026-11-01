# Spec Delta

## Purpose

Garantiza que todo cambio que se sube al repositorio compila, pasa lint y tests y produce un build completo, verificándolo en local antes de cada push y en Linux antes de cada release.

## ADDED Requirements

### Requirement: Verificación antes de cada push
Todo `git push` desde un clon con dependencias instaladas SHALL ejecutar la verificación del proyecto antes de enviar nada al remoto. Si la verificación falla, el push MUST abortarse sin enviar commits. Saltarse la verificación MUST requerir una acción explícita (`git push --no-verify`).

#### Scenario: Push con todo en verde
- **WHEN** se hace `git push` y la verificación pasa
- **THEN** el push se envía al remoto

#### Scenario: Push con un test roto
- **WHEN** se hace `git push` y un test unitario falla
- **THEN** el push se aborta, no se envía ningún commit y la salida nombra el paso que falló

#### Scenario: Salto explícito
- **WHEN** se hace `git push --no-verify`
- **THEN** el push se envía sin ejecutar la verificación

### Requirement: Contenido de la verificación
`pnpm run verify` SHALL ejecutar, en este orden: comprobación de la versión de Node, typecheck, lint de la extensión y del webview, tests unitarios, build de producción completo y tests de integración dentro de VS Code. MUST detenerse en el primer paso que falle, nombrar ese paso y terminar con un código de salida distinto de cero. El mismo comando MUST funcionar en Windows y en Linux.

#### Scenario: Verificación en Windows (PowerShell)
- **WHEN** se ejecuta `pnpm run verify` desde PowerShell en Windows
- **THEN** se ejecutan todos los pasos en orden y termina con código 0 si todos pasan

#### Scenario: Verificación en Linux (bash)
- **WHEN** se ejecuta `pnpm run verify` desde bash en Linux o WSL, con una pantalla disponible para los tests de integración
- **THEN** se ejecutan los mismos pasos en el mismo orden con el mismo resultado

#### Scenario: Fallo en un paso intermedio
- **WHEN** el lint falla
- **THEN** no se ejecutan los tests ni el build, la salida nombra el lint y el código de salida es distinto de cero

### Requirement: Activación automática del hook
Instalar las dependencias en un clon del repositorio (`pnpm install`) SHALL activar el hook de verificación sin pasos manuales, incluso si la configuración de npm del usuario desactiva los scripts de ciclo de vida. Instalar fuera de un repositorio git MUST NOT fallar por este motivo.

#### Scenario: Clon nuevo
- **WHEN** se clona el repositorio y se ejecuta `pnpm install`
- **THEN** el siguiente `git push` ejecuta la verificación

#### Scenario: Usuario con ignore-scripts en npm
- **WHEN** el `~/.npmrc` del usuario contiene `ignore-scripts=true` y se ejecuta `pnpm install` en un clon nuevo
- **THEN** el hook queda activo igualmente

#### Scenario: Instalación fuera de git
- **WHEN** se instalan las dependencias en una copia sin carpeta `.git`
- **THEN** la instalación termina con éxito y no configura ningún hook

### Requirement: Verificación en Linux antes de cada release
Todo PR de release de `develop` a `staging` SHALL ir precedido de una verificación completa en verde en Linux (WSL o nativo), y la descripción del PR MUST dejar constancia de ello.

#### Scenario: PR de release con verificación en Linux
- **WHEN** se abre un PR de `develop` a `staging`
- **THEN** su descripción indica que `pnpm run verify` pasó en Linux sobre el commit del PR

### Requirement: Instalación segura de dependencias
Instalar las dependencias MUST NOT ejecutar scripts de ciclo de vida de paquetes de terceros salvo los autorizados explícitamente en la configuración del repositorio. Una dependencia con scripts de instalación que no se haya revisado (ni autorizada ni denegada) MUST hacer fallar la instalación. La instalación de referencia SHALL usar el lockfile sin modificarlo.

#### Scenario: Dependencia con scripts sin revisar
- **WHEN** una dependencia con script `postinstall` no figura en la lista de builds revisados y se ejecuta la instalación
- **THEN** la instalación falla nombrando esa dependencia y no ejecuta su script

#### Scenario: Lockfile desactualizado
- **WHEN** `package.json` declara una dependencia que no está en `pnpm-lock.yaml` y se ejecuta `pnpm install --frozen-lockfile`
- **THEN** la instalación falla sin modificar el lockfile

### Requirement: Build completo de la extensión
El build de producción del proyecto SHALL generar tanto el bundle de la extensión como el webview compilado, y el paso de prepublicación del paquete MUST ejecutar ese build completo.

#### Scenario: Build en una copia limpia
- **WHEN** se clona el repositorio, se instalan las dependencias y se ejecuta el build de producción
- **THEN** existen `dist/extension.js` y `dist/webview/index.html` con sus assets

#### Scenario: Fallo de compilación del webview
- **WHEN** el webview tiene un error de TypeScript
- **THEN** el build de producción falla y la verificación también

### Requirement: Entorno reproducible
La versión de Node del proyecto SHALL declararse en `.nvmrc`, y la verificación MUST fallar si la versión mayor de Node en uso no coincide con la declarada. Los archivos de texto SHALL guardarse en el repositorio con finales de línea LF, independientemente del sistema operativo de quien hace el commit.

#### Scenario: Node distinto del declarado
- **WHEN** `.nvmrc` declara `24` y se ejecuta la verificación con Node 22
- **THEN** la verificación falla indicando la versión esperada y la encontrada

#### Scenario: Commit desde Windows
- **WHEN** se hace commit desde Windows de un archivo editado con finales CRLF
- **THEN** el archivo queda guardado en el repositorio con finales LF
