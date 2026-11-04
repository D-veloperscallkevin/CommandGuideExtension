# project-detection Specification

## Purpose

Detecta qué categorías del catálogo usa el proyecto abierto, a partir de los archivos de la raíz de cada carpeta del workspace, para que la vista las muestre primero.

## Requirements

### Requirement: Señales del proyecto
La extensión SHALL detectar las categorías del proyecto comprobando solo si existen ciertas entradas, sean archivos o carpetas, en la raíz de cada carpeta del workspace. MUST NOT leer su contenido ni buscar en subcarpetas. Las señales SHALL ser:
- `.git` → `git`;
- `package.json` → `node`;
- `pnpm-lock.yaml` → `pnpm`;
- `package-lock.json` → `npm`;
- `Dockerfile`, `compose.yaml`, `compose.yml`, `docker-compose.yml` o `docker-compose.yaml` → `docker`.

Con varias carpetas en el workspace, las categorías detectadas SHALL ser la unión de las de todas. La categoría `terminal` MUST NOT detectarse nunca. Sin carpetas abiertas, no SHALL detectarse ninguna categoría. Si una comprobación falla (por ejemplo, por falta de permisos), SHALL tratarse como si la entrada no existiera, sin aviso al usuario. Cada señal MUST corresponder a una categoría del catálogo incluido, y un test MUST comprobarlo.

#### Scenario: Proyecto con pnpm y Docker
- **WHEN** la raíz de la única carpeta contiene `package.json`, `pnpm-lock.yaml` y `Dockerfile`
- **THEN** las categorías detectadas son `node`, `pnpm` y `docker`

#### Scenario: Repositorio Git
- **WHEN** la raíz contiene la carpeta `.git`
- **THEN** `git` está entre las categorías detectadas

#### Scenario: Multi-root
- **WHEN** una carpeta del workspace contiene `package-lock.json` y otra contiene `compose.yaml`
- **THEN** las categorías detectadas son `npm` y `docker`

#### Scenario: Solo en subcarpetas
- **WHEN** `package.json` solo existe en `webview-ui/` y no en la raíz
- **THEN** `node` no se detecta

#### Scenario: Sin carpeta abierta
- **WHEN** VS Code no tiene ninguna carpeta abierta
- **THEN** no se detecta ninguna categoría

### Requirement: Actualización en vivo
La extensión SHALL volver a detectar las categorías cuando se cree o se borre una de las entradas de las señales en la raíz de una carpeta del workspace, y cuando se añadan o se quiten carpetas del workspace. Si el resultado cambia, SHALL notificarlo para que la vista se actualice. Varios cambios seguidos SHALL agruparse en una sola detección.

#### Scenario: Crear un Dockerfile
- **WHEN** la vista está abierta en un proyecto sin señales de Docker y el usuario crea `Dockerfile` en la raíz
- **THEN** `docker` pasa a estar entre las categorías detectadas, sin recargar VS Code

#### Scenario: Borrar el lockfile
- **WHEN** el usuario borra `pnpm-lock.yaml` de la raíz
- **THEN** `pnpm` deja de estar entre las categorías detectadas

#### Scenario: Añadir una carpeta
- **WHEN** el usuario añade al workspace una carpeta que contiene `.git`
- **THEN** `git` pasa a estar entre las categorías detectadas

### Requirement: Ajuste para desactivar la detección
El ajuste `devcommands.detectProject` SHALL ser un boolean con valor por defecto `true` y descripción traducida a los 11 idiomas. Con `false`, no SHALL detectarse ninguna categoría ni vigilarse ningún archivo. Al cambiar el ajuste, la detección SHALL actualizarse sin recargar VS Code.

#### Scenario: Desactivar
- **WHEN** hay categorías detectadas y el usuario pone `devcommands.detectProject` en `false`
- **THEN** no queda ninguna categoría detectada y la portada vuelve a su orden normal

#### Scenario: Volver a activar
- **WHEN** el ajuste estaba en `false` y el usuario lo pone en `true`
- **THEN** se detectan de nuevo las categorías del proyecto
