# Design

## Context

- El proyecto es el esqueleto de `yo code` con el Hello World. `src/` no tiene lógica propia todavía.
- `tsconfig.json` usa `rootDir: "src"` y `module: "Node16"`, y `package.json` no declara `"type"` (CommonJS). Importar `catalog/*.json` desde `src/` choca con ese `rootDir`.
- Los tests de integración (Mocha + `@vscode/test-cli`) se compilan con `tsc -p . --outDir out` y se buscan en `out/test/**/*.test.js`.
- esbuild ya genera `dist/extension.js` en modo bundle y sabe incluir JSON importado de forma nativa.
- Las restricciones del proyecto exigen cero dependencias de runtime y un catálogo en JSON validado con JSON Schema (ver `proposal.md`).

## Goals / Non-Goals

**Goals:**
- Un formato de catálogo estable, bilingüe y validado automáticamente.
- Un módulo de catálogo de funciones puras, testeable con Vitest sin arrancar VS Code.
- Errores de validación con el archivo y la ruta exacta del fallo.

**Non-Goals:**
- Búsqueda, UI, mensajes webview ↔ extensión y envío a terminal (changes posteriores del MVP).
- Detección del shell (v1). Aquí el shell se recibe como argumento.
- Escapado de parámetros por shell (llega con los comandos con parámetros, v1).
- Validación en runtime de catálogos que no vengan del bundle, como comandos personalizados o packs (v1/v2).
- i18n de la interfaz de la extensión y del webview (change aparte).

## Decisions

### D1. Un archivo por categoría con metadatos de categoría
`catalog/<id>.json` = `{ "$schema": "./schema.json", version: 1, id, title, icon, order, commands: [] }`.
- *Por qué:* la vista de categorías necesita nombre, icono y orden, y así cada categoría se edita en un único sitio. `$schema` da autocompletado y validación en vivo en VS Code mientras se escribe el catálogo.
- *Alternativa descartada:* un `index.json` con las categorías más archivos que solo contienen arrays de comandos. Obliga a sincronizar dos archivos por categoría.

### D2. JSON Schema draft-07
- *Por qué:* es el dialecto que VS Code valida de forma más completa en el editor y el que Ajv soporta sin configuración extra.
- `docs` se valida con `pattern: "^https://"` en vez de `format: "uri"`, para no necesitar `ajv-formats`.
- Las definiciones reutilizables (`LocalizedString`, `LocalizedTags`, `Param`, `Command`, `ShellId`) van en `definitions`. Todos los objetos usan `additionalProperties: false`.

### D3. `LocalizedString = { en: string (minLength 1), es: string (minLength 1) }`
Los dos idiomas son obligatorios. El fallback es `en` porque la v1 es global. Al resolver el idioma, `vscode.env.language` pasa a `es` si empieza por `es` y a `en` en cualquier otro caso (`resolveLocale`, función pura).
- *Alternativa descartada:* `en` opcional. Permitiría llegar a la v1.0 con traducciones incompletas sin que nadie se entere.

### D4. Catálogo empaquetado mediante un índice explícito
`src/catalog/index.ts` importa cada `catalog/*.json` con imports estáticos y exporta la lista. esbuild los incluye en `dist/extension.js`.
- *Por qué:* no hay lectura de disco ni latencia en la activación, y el `.vsix` no necesita incluir `catalog/` (se añade a `.vscodeignore`).
- esbuild elimina los módulos sin importar: el catálogo solo aparece en `dist/extension.js` cuando un consumidor (la vista de categorías) importa `CatalogService`. Hasta entonces se verifica empaquetando el módulo por separado.
- Un test compara `fs.readdirSync('catalog')` con el índice para que no se olvide registrar ninguna categoría.
- *Alternativa descartada:* un plugin de esbuild con glob. Es más magia y depende del build, y en Vitest habría que replicarlo.

### D5. Tipos TypeScript escritos a mano y validación con Ajv en tests
`src/catalog/types.ts` define `Catalog`, `Category`, `Command`, `Param`, `LocalizedString`, `Locale`, `ShellId` y `Risk`. Los JSON importados se tipan como `unknown` y se convierten con `as Category`. La garantía de forma la dan los tests: Ajv más las reglas extra de D6.
- *Por qué:* TypeScript ensancha los literales de los JSON importados (`"safe"` pasa a ser `string`), así que el compilador no puede comprobar las uniones. Generar los tipos desde el schema añadiría tooling para pocos tipos.
- *Riesgo aceptado:* los tipos y el schema pueden desincronizarse. Se mitiga con un test que pasa los JSON validados por las funciones del módulo.

### D6. Reglas semánticas en código, fuera del schema
`src/catalog/validate.ts` exporta `checkCatalogRules(categories): string[]`, una función pura que devuelve mensajes de error. Comprueba:
- ids de comando únicos en todo el catálogo;
- que el id del comando empiece por `<categoría>.`;
- que los placeholders de `command` y de cada `shells.*` estén declarados en `params`;
- que cada param aparezca en `command`;
- nombres de param únicos.

Los placeholders se extraen con `/\$\{([A-Za-z][A-Za-z0-9_]*)\}/g`.
- *Por qué en `src/` y no en el test:* los comandos personalizados de la v1 van a necesitar las mismas reglas en runtime. Hoy solo la usan los tests.

### D7. Funciones de consulta puras (`src/catalog/CatalogService.ts`)
- `getCategories()`: ordenadas por `order` y después por `id`.
- `getCommand(id)`: devuelve `Command | undefined`. Se apoya en un `Map` construido una sola vez.
- `localize(text, locale)`.
- `effectiveCommand(cmd, shell)`: `shells[shell] ?? command`.
- `buildExample(cmd, locale, shell)`: sustituye cada `${x}` por `localize(param.placeholder, locale)`.

Todas reciben el catálogo por inyección (con el del bundle como valor por defecto), así los tests pueden usar fixtures. No importan `vscode`.

### D8. Vitest para los tests unitarios; Mocha se queda para la integración
- Los tests unitarios viven en `test/unit/**/*.test.ts` con `vitest.config.mts` (entorno `node`). Script: `"test:unit": "vitest run"`.
- Los fixtures inválidos (`test/unit/fixtures/*.json`) cubren cada escenario de fallo de la spec.
- El test de Ajv carga `catalog/schema.json` y valida cada archivo con `allErrors: true`, mostrando `instancePath`.

### D9. Ajuste de `tsconfig.json`
`rootDir` pasa a `"."` y se añaden `resolveJsonModule: true` e `include: ["src", "catalog"]`. En consecuencia, los tests de Mocha compilados pasan a `out/src/test/**`, y hay que actualizar `.vscode-test.mjs`. `test/unit` queda fuera del `tsconfig` raíz: Vitest lo transpila solo y tiene su propio `tsconfig` con los tipos de Vitest, para no mezclar los globals de Mocha y de Vitest.
- *Alternativa descartada:* mover `catalog/` dentro de `src/`. Contradice la estructura del roadmap y mezcla datos con código.

### D10. Mensajes webview ↔ extensión
Este change **no añade ni modifica mensajes**. Queda anotado para el change de la vista: la extensión enviará `{ type: "catalog", locale, categories }` con los textos ya localizados y los ejemplos calculados, y el webview seguirá mandando solo `commandId` + `params`.

### D11. Dependencias
- **Runtime:** ninguna.
- **Desarrollo:** `vitest` (runner de tests unitarios, previsto en el roadmap) y `ajv` (validador de JSON Schema, previsto en el roadmap).

## Risks / Trade-offs

- [Tipos escritos a mano desincronizados del schema] → El test pasa cada categoría validada por `getCategories`, `buildExample` y `effectiveCommand`, así que un campo renombrado rompe en CI.
- [Olvidar registrar una categoría nueva en el índice] → El test de cobertura del índice (D4) falla nombrando el archivo.
- [El cambio de `rootDir` mueve la salida de los tests de Mocha] → Se actualiza `.vscode-test.mjs` en la misma tarea y se verifica con `npm test`.
- [Escribir cada string en dos idiomas cuesta más] → Se acepta. `$schema` en cada archivo da autocompletado y marca en el editor la traducción que falta.
- [Un placeholder de ejemplo que se parece a un valor real] → Es solo para mostrar. El escapado y la entrada real de valores llegan en la v1.

## Migration Plan

No hay datos previos. Rollback: revertir el squash merge del PR.
