# Proposal

## Why

Todas las funcionalidades del MVP (vista de categorías, lista de comandos, búsqueda, enviar a terminal) leen del catálogo de comandos, y hoy no existe ni el formato ni un solo comando. Hay que fijar el modelo antes de escribir los ~75 comandos de la Fase 1, y fijarlo ya bilingüe (inglés y español), porque la v1.0 se publica para todo el mundo y migrar cada string más tarde sería un cambio incompatible sobre todo el catálogo.

**Fase del roadmap:** MVP, Fase 0 ("Base lista": el catálogo valida contra `schema.json`).

## What Changes

- Nuevo `catalog/schema.json` (JSON Schema) que define un archivo por categoría: `version`, `id`, `title`, `icon` (nombre de Codicon), `order` y `commands[]`.
- Modelo de comando completo desde el inicio: `id`, `title`, `description`, `command` (plantilla POSIX con `${param}`), `params[]` (`name`, `label`, `placeholder`), `tags`, `risk` (`safe` | `caution` | `destructive`, obligatorio), `shells` opcional (`bash` | `zsh` | `powershell` | `cmd`) y `docs` opcional.
- Textos visibles como `LocalizedString` `{ en, es }`, con los dos idiomas obligatorios. Los `tags` también van por idioma.
- El ejemplo de cada comando no se escribe a mano: se calcula sustituyendo los placeholders de la plantilla por su `placeholder` en el idioma activo.
- Reglas que JSON Schema no puede expresar, comprobadas por tests: ids únicos en todo el catálogo, prefijo del id igual al id de la categoría, y coherencia entre `${x}` y `params`.
- Módulo de catálogo en la extensión (sin dependencias de runtime): carga el catálogo incluido en el bundle, lo ordena, busca por id, resuelve el idioma con fallback a inglés y calcula el ejemplo.
- Categoría semilla `catalog/git.json` con 3 comandos para estrenar el formato. Las 5 categorías × 15 comandos llegan en la Fase 1.
- Vitest y Ajv como devDependencies, con un script `test:unit`.

## Capabilities

### New Capabilities
- `command-catalog`: formato, validación, localización y consulta del catálogo de comandos que consumen la UI y la terminal.

### Modified Capabilities
<!-- Ninguna: no existen specs previas. -->

## Impact

- **Archivos nuevos:** `catalog/schema.json`, `catalog/git.json`, `src/catalog/*`, `test/unit/**`, `vitest.config.ts`.
- **Archivos modificados:** `package.json` (devDeps y script), `tsconfig.json` (`rootDir` y `resolveJsonModule`), `.vscode-test.mjs` (nueva ruta de los tests compilados), `.vscodeignore`, `CHANGELOG.md`, `docs/ROADMAP.md` (modelo de comando y fila de i18n).
- **Dependencias:** solo de desarrollo (`vitest`, `ajv`). Cero dependencias de runtime.
- **Mensajes webview ↔ extensión:** ninguno todavía. Este change prepara los datos que más adelante enviará el mensaje `catalog`.
- **Tamaño del `.vsix`:** el catálogo va dentro de `dist/extension.js`. Unos pocos KB por categoría, muy lejos del límite de 2 MB.
