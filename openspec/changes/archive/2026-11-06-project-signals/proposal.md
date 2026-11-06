## Why

Cada lote de contenido de la Fase 3 trae categorías que deberían aparecer en "En este proyecto". Algunos ejemplos: Go con `go.mod`, .NET con `*.csproj`, Prisma con `prisma/schema.prisma` y Terraform con `*.tf`.

Hoy la detección no puede expresar esos casos:
- solo admite nombres exactos en la raíz, sin comodines ni rutas de un nivel;
- la lista de señales está fija en el código (`src/project/detect.ts`), así que cada lote tendría que editarla a mano.

Fase del roadmap: **Fase 3 (v1.x)**, change 3.2.

Es requisito previo de los lotes 3.3 a 3.14. Las señales de las categorías que aún no existen (Go, Rust, Python, Prisma…) no se añaden ahora: llegan con el lote que crea cada categoría.

## What Changes

- **Señales declaradas en el catálogo.**
  - Cada categoría puede declarar un campo opcional `detect` con sus patrones de detección, y el schema lo valida.
  - La lista fija `PROJECT_SIGNALS` del código desaparece. Las señales actuales pasan a los JSON de `git`, `node`, `pnpm`, `npm` y `docker`.
- **Tres formas de patrón:**
  - un nombre exacto en la raíz (`go.mod`);
  - un comodín `*` en la raíz (`*.csproj`, `*.tf`);
  - una ruta fija de un nivel (`prisma/schema.prisma`).

  Sigue sin leerse el contenido de ningún archivo y sin buscar en profundidad.
- **Detección con una lectura de la raíz.**
  - En lugar de un `stat` por señal, se lista una vez la raíz de cada carpeta del workspace y los patrones se comparan con esos nombres, sin distinguir mayúsculas y minúsculas.
  - Una ruta de un nivel solo se comprueba con `stat` si su carpeta aparece en la raíz.
- **Sin cargar el catálogo al arrancar.**
  - El build reúne los `detect` de todas las categorías y los inyecta en el bundle como una lista pequeña.
  - La detección sigue funcionando al activarse sin leer `dist/catalog/`, como exige la 3.1.
- **Señales nuevas para las categorías existentes:**
  - `.nvmrc` y `.node-version` → Node;
  - `npm-shrinkwrap.json` → npm;
  - `pnpm-workspace.yaml` → pnpm;
  - `Containerfile` y `.dockerignore` → Docker.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `project-detection`:
  - "Señales del proyecto" pasa a patrones declarados en el catálogo, con comodines y rutas de un nivel;
  - "Actualización en vivo" vigila también esas formas.
- `command-catalog`: el schema admite el campo opcional `detect`, y una regla del catálogo comprueba sus patrones.

## Impact

- **Catálogo:**
  - `catalog/schema.json` (campo `detect`);
  - `catalog/git.json`, `node.json`, `npm.json`, `pnpm.json` y `docker.json`;
  - `catalog/README.md`.
- **Código:**
  - `src/catalog/types.ts` (`Category.detect`) y `src/catalog/validate.ts` (reglas de los patrones);
  - `src/project/detect.ts` (patrones, comparación y glob);
  - `src/project/ProjectDetector.ts` y `vscodeProject.ts` (listado de la raíz con `workspace.fs.readDirectory`);
  - `esbuild.js` (inyecta las señales);
  - `src/extension.ts`.
- **Tests:** schema y fixtures, reglas del catálogo, detección, `ProjectDetector` e integración.
- **Docs:** README (tabla de señales), CHANGELOG y ROADMAP.
- **Mensajes webview↔extensión:** sin cambios.
- **Dependencias:** ninguna nueva.
