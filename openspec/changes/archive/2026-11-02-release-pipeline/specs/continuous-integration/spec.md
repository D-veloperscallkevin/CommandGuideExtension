## ADDED Requirements

### Requirement: Empaquetado local verificado
`pnpm run release:package` SHALL generar el `.vsix` de la extensión en local, sin servicios externos, y MUST funcionar igual en Windows y en Linux. Antes de empaquetar SHALL ejecutar el build de producción completo. El comando MUST fallar, con un código de salida distinto de cero y nombrando el motivo, cuando:
- el `.vsix` pesa 2 MB o más;
- el paquete contiene un archivo fuera de la lista permitida: `dist/` (sin `.map`), `media/`, `l10n/`, `package.json`, `package.nls*.json`, `README.md`, `CHANGELOG.md` y `LICENSE`.

Si todo es correcto, SHALL imprimir la ruta del `.vsix`, su tamaño y su número de archivos.

#### Scenario: Paquete correcto
- **WHEN** se ejecuta `pnpm run release:package` con el proyecto en verde
- **THEN** se genera `devcommands-<versión>.vsix`, el comando termina con código 0 e imprime su ruta, su tamaño y su número de archivos

#### Scenario: Paquete demasiado grande
- **WHEN** el `.vsix` generado pesa 2 MB o más
- **THEN** el comando termina con código distinto de cero indicando el tamaño y el límite

#### Scenario: Archivo no permitido en el paquete
- **WHEN** el paquete incluiría `dist/extension.js.map` o cualquier archivo de `src/`
- **THEN** el comando termina con código distinto de cero nombrando cada archivo no permitido

#### Scenario: Dependencias de desarrollo fuera del paquete
- **WHEN** se empaqueta la extensión
- **THEN** el `.vsix` no contiene ningún archivo de `node_modules/`

### Requirement: Identidad del paquete
El manifiesto de la extensión SHALL declarar `publisher` `aguilardigital`, el `repository` del proyecto en GitHub y la versión de la release en curso. La extensión SHALL identificarse como `aguilardigital.devcommands`. Mientras el proyecto esté en versiones `0.x`, `release:package` SHALL marcar el paquete como pre-release.

#### Scenario: Id de la extensión
- **WHEN** la extensión está instalada desde el `.vsix`
- **THEN** VS Code la identifica como `aguilardigital.devcommands`

#### Scenario: Versión pre-release
- **WHEN** se empaqueta la versión `0.1.0`
- **THEN** el `.vsix` se llama `devcommands-0.1.0.vsix` y está marcado como pre-release

### Requirement: Paquete probado antes de pasar a main
Todo PR de release de `staging` a `main` SHALL ir precedido de un `pnpm run release:package` en verde y de una prueba manual del `.vsix` instalado en Windows (PowerShell) y en WSL o Linux (bash). La descripción del PR MUST dejar constancia del tamaño del `.vsix` y de ambas pruebas.

#### Scenario: PR de release a main
- **WHEN** se abre un PR de `staging` a `main`
- **THEN** su descripción indica el tamaño del `.vsix` generado y que se instaló y probó en PowerShell y en bash
