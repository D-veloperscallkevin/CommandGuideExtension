## MODIFIED Requirements

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
