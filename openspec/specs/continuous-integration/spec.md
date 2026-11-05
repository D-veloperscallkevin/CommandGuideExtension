# continuous-integration Specification

## Purpose

Garantiza que todo cambio que se sube al repositorio compila, pasa lint y tests y produce un build completo, verificándolo en local antes de cada push y en Linux antes de cada release.

## Requirements

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

### Requirement: Empaquetado local verificado
`pnpm run release:package` SHALL generar el `.vsix` de la extensión en local, sin servicios externos, y MUST funcionar igual en Windows y en Linux. Antes de empaquetar SHALL ejecutar el build de producción completo. El comando MUST fallar, con un código de salida distinto de cero y nombrando el motivo, cuando:
- el `.vsix` pesa 2 MB o más;
- el paquete contiene un archivo fuera de la lista permitida: `dist/` (sin `.map`), `media/`, `l10n/`, `package.json`, `package.nls*.json`, `README.md`, `CHANGELOG.md`, `LICENSE` y `ThirdPartyNotices.txt`;
- al paquete le falta el icono que declara el manifiesto o el archivo `ThirdPartyNotices.txt`.

Si todo es correcto, SHALL imprimir la ruta del `.vsix`, su tamaño y su número de archivos.

#### Scenario: Paquete correcto
- **WHEN** se ejecuta `pnpm run release:package` con el proyecto en verde
- **THEN** se genera `devcommands-<versión>.vsix`, el comando termina con código 0 e imprime su ruta, su tamaño y su número de archivos

#### Scenario: Paquete correcto desde PowerShell y desde bash
- **WHEN** se ejecuta `pnpm run release:package` desde PowerShell en Windows y desde bash en WSL o Linux
- **THEN** ambos generan un `.vsix` con la misma lista de archivos y terminan con código 0

#### Scenario: Paquete demasiado grande
- **WHEN** el `.vsix` generado pesa 2 MB o más
- **THEN** el comando termina con código distinto de cero indicando el tamaño y el límite

#### Scenario: Archivo no permitido en el paquete
- **WHEN** el paquete incluiría `dist/extension.js.map`, cualquier archivo de `src/` o una captura de `docs/images/`
- **THEN** el comando termina con código distinto de cero nombrando cada archivo no permitido

#### Scenario: Falta un archivo obligatorio
- **WHEN** el paquete no incluiría `media/icon.png` o `ThirdPartyNotices.txt`
- **THEN** el comando termina con código distinto de cero nombrando cada archivo que falta

#### Scenario: Dependencias de desarrollo fuera del paquete
- **WHEN** se empaqueta la extensión
- **THEN** el `.vsix` no contiene ningún archivo de `node_modules/`

### Requirement: Identidad del paquete
El manifiesto de la extensión SHALL declarar `publisher` `aguilardigital`, el nombre visible "DevCommands Guide", el `repository` del proyecto en GitHub y la versión de la release en curso. La extensión SHALL identificarse como `aguilardigital.devcommands`. `release:package` SHALL marcar el paquete como pre-release solo cuando la versión del manifiesto sea `0.x`; a partir de `1.0.0` MUST empaquetarlo como versión estable.

#### Scenario: Id de la extensión
- **WHEN** la extensión está instalada desde el `.vsix`
- **THEN** VS Code la identifica como `aguilardigital.devcommands` y muestra el nombre "DevCommands Guide"

#### Scenario: Versión pre-release
- **WHEN** se empaqueta una versión `0.x`, como `0.1.0`
- **THEN** el `.vsix` se llama `devcommands-0.1.0.vsix` y está marcado como pre-release

#### Scenario: Versión estable
- **WHEN** se empaqueta la versión `1.0.0`
- **THEN** el `.vsix` se llama `devcommands-1.0.0.vsix` y no está marcado como pre-release

### Requirement: Paquete probado antes de pasar a main
Todo PR de release de `staging` a `main` SHALL ir precedido de un `pnpm run release:package` en verde y de una prueba manual del `.vsix` instalado en Windows (PowerShell) y en WSL o Linux (bash). La descripción del PR MUST dejar constancia del tamaño del `.vsix` y de ambas pruebas.

#### Scenario: PR de release a main
- **WHEN** se abre un PR de `staging` a `main`
- **THEN** su descripción indica el tamaño del `.vsix` generado y que se instaló y probó en PowerShell y en bash
