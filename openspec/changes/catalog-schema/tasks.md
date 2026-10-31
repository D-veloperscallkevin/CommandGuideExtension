# Tasks

## 1. Preparación del entorno

- [ ] 1.1 Instalar `vitest` y `ajv` como devDependencies y añadir el script `"test:unit": "vitest run"`. Verificar que `npm ls vitest ajv` los lista y que `dependencies` sigue sin existir o vacío en `package.json`
- [ ] 1.2 Crear `vitest.config.ts` (entorno `node`, `include: ["test/unit/**/*.test.ts"]`) y `test/unit/tsconfig.json` con los tipos de Vitest. Verificar con un test trivial temporal que `npm run test:unit` lo detecta y pasa, y borrarlo después
- [ ] 1.3 Ajustar `tsconfig.json` (`rootDir: "."`, `resolveJsonModule: true`, `include: ["src", "catalog"]`) y cambiar `.vscode-test.mjs` a `out/src/test/**/*.test.js`. Verificar que `npm run check-types` y `npm test` siguen pasando con el test de ejemplo existente
- [ ] 1.4 Añadir `catalog/**`, `test/**` y `vitest.config.ts` a `.vscodeignore`. Verificar con `npx @vscode/vsce ls` que no aparecen en el paquete

## 2. Schema y categoría semilla

- [ ] 2.1 Escribir `catalog/schema.json` (draft-07) con `definitions` para `LocalizedString`, `LocalizedTags`, `Param`, `ShellId`, `Command` y `additionalProperties: false` en todos los objetos, según D2 y D3. Verificar que VS Code reconoce el schema al abrir un JSON que lo referencia con `$schema`
- [ ] 2.2 Crear `catalog/git.json` con `$schema`, `version: 1`, `icon: "git-branch"`, `order: 10` y 3 comandos: `git.status` (sin params, `safe`), `git.new-branch` (param `branch`, `safe`) y `git.reset-hard` (`destructive`). Verificar que el editor no marca errores de schema
- [ ] 2.3 Crear `test/unit/catalog/schema.test.ts`: valida con Ajv (`allErrors: true`) cada `catalog/*.json` menos `schema.json`, y cada fixture inválido de `test/unit/fixtures/` (sin `risk`, propiedad desconocida, `title` sin `en`, `risk: "danger"`, `shells.fish`). Verificar que `npm run test:unit` pasa, que los inválidos fallan y que el mensaje incluye archivo e `instancePath`

## 3. Módulo de catálogo

- [ ] 3.1 Crear `src/catalog/types.ts` con `Locale`, `ShellId`, `Risk`, `LocalizedString`, `LocalizedTags`, `Param`, `Command`, `Category` y `Catalog`, sin importar `vscode`. Verificar con `npm run check-types`
- [ ] 3.2 Crear `src/catalog/index.ts` con el import estático de `catalog/git.json` y la lista exportada de categorías (D4). Añadir un test que compare `fs.readdirSync('catalog')` con el índice y falle nombrando el archivo que falte. Verificar que pasa, y que falla si se crea temporalmente un `catalog/tmp.json` sin registrar
- [ ] 3.3 Implementar `src/catalog/validate.ts` con `checkCatalogRules` (D6) y tests con fixtures para: id duplicado entre categorías, prefijo incorrecto, placeholder sin declarar en `command`, placeholder sin declarar en `shells.powershell`, param sin uso y nombre de param repetido. Añadir una aserción de que el catálogo real devuelve `[]`. Verificar con `npm run test:unit`
- [ ] 3.4 Implementar `src/catalog/CatalogService.ts` con `resolveLocale`, `localize`, `getCategories`, `getCommand`, `effectiveCommand` y `buildExample` (D3, D7), con el catálogo inyectable. Tests que cubran cada escenario de la spec: `es-419` da `es`, `de` da `en`, orden por `order` y desempate por `id`, `getCommand` de un id existente e inexistente, variante PowerShell frente a `command` en bash, ejemplo en español para bash, ejemplo en inglés para PowerShell y ejemplo de un comando sin params. Verificar con `npm run test:unit`
- [ ] 3.5 Verificar que el catálogo queda en el bundle: `npm run package` genera `dist/extension.js` con el contenido de `git.json`, comprobado buscando `"git.new-branch"` en el archivo, y la extensión arranca con F5 sin errores

## 4. Documentación

- [ ] 4.1 Actualizar `CHANGELOG.md` en `[Unreleased]`: "Added: catálogo de comandos bilingüe validado con JSON Schema (semilla: Git)". Verificar que el archivo tiene la entrada
- [ ] 4.2 Actualizar `docs/ROADMAP.md`: el "Modelo de un comando" pasa al formato con `LocalizedString`, `label` y `placeholder` localizados y `tags` por idioma, y la fila de i18n pasa de v2 a v1 indicando que la interfaz también necesita traducción. Verificar que el JSON de ejemplo del roadmap valida contra `catalog/schema.json` envuelto en una categoría
- [ ] 4.3 Añadir `catalog/README.md` con cómo añadir una categoría o un comando (campos, `$schema`, registro en `src/catalog/index.ts`, `npm run test:unit`). Verificar siguiendo los pasos con un comando de prueba que después se descarta

## 5. Verificación final

- [ ] 5.1 Ejecutar `npm run check-types`, `npm run lint`, `npm run test:unit` y `npm test` y confirmar que todo pasa. Ejecutar `openspec validate catalog-schema --strict` sin errores
