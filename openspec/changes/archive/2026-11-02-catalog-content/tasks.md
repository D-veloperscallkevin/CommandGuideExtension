## 1. Tests de contenido

- [x] 1.1 Crear `test/unit/catalog/content.test.ts` (D5) con:
  - `undersized(catalog, min)` y `missingTranslations(catalog)`, puras y probadas con fixtures: una categoría con pocos comandos, un comando sin `description.ko`, un placeholder sin `ja` y tags vacíos;
  - un test por cada regla sobre `bundledCatalog`: las 6 categorías en orden, al menos 15 comandos por categoría, los 11 idiomas en cada texto y `docs` en cada comando;
  - el ejemplo de PowerShell de `terminal.remove-directory`.

  Estos tests fallan hasta completar el paso 2. Verificar que fallan por la razón esperada.

## 2. Catálogo, una categoría por paso (D1–D4)

Cada paso termina con `pnpm run test:unit`: el schema, `checkCatalogRules` y los Codicons tienen que pasar para esa categoría.

- [x] 2.1 `catalog/git.json`:
  - completar los 3 comandos actuales en los 11 idiomas, sin cambiar sus ids ni sus textos `en`/`es`;
  - añadir el resto de comandos de Git de D2.
- [x] 2.2 Crear `catalog/npm.json` y registrarlo en `src/catalog/index.ts`.
- [x] 2.3 Crear `catalog/pnpm.json` y registrarlo.
- [x] 2.4 Crear `catalog/node.json` y registrarlo.
- [x] 2.5 Crear `catalog/docker.json` y registrarlo.
- [x] 2.6 Crear `catalog/terminal.json`, con `shells.powershell` en cada comando que difiera, y registrarlo. Con esto pasan todos los tests de 1.1.

## 3. Tests existentes

- [x] 3.1 `test/unit/catalog/CatalogService.test.ts`: el test de `searchText` con `fr` pasa a "con un idioma opcional traducido no repite textos y lo incluye" (D5).
- [x] 3.2 `src/test/extension.test.ts`:
  - comprobar las 6 categorías en orden;
  - comprobar que Git contiene `git.status`, `git.new-branch` y `git.reset-hard`, sin exigir que sean los únicos.

## 4. Documentación

- [x] 4.1 Actualizar:
  - **`README.md`:**
    - en Usage, mencionar las categorías disponibles;
    - quitar de la nota "Work in progress" que faltan categorías;
    - en Languages, indicar que los comandos del catálogo están en los 11 idiomas;
  - **`catalog/README.md`:**
    - ejemplo de categoría y de texto con los 11 idiomas;
    - regla: el catálogo empaquetado exige los 11 idiomas aunque el schema solo exija `en` y `es`;
    - criterio de riesgo de D3 y regla de no usar `${...}` propio de PowerShell en `shells.powershell`;
  - **`CHANGELOG.md`:** entrada Added;
  - **`docs/ROADMAP.md`:** 1.7 ✅ y su checkbox.

## 5. Verificación manual

- [x] 5.1 Con F5, en Windows con PowerShell:
  - aparecen Git, npm, pnpm, Node.js, Docker y Terminal, en ese orden y con sus iconos, cada una con 15 comandos o más;
  - con VS Code en español y en otro idioma (por ejemplo, francés o japonés), los títulos, descripciones y ejemplos salen en ese idioma;
  - en Terminal, los ejemplos usan PowerShell. Enviar a la terminal y ejecutar a mano al menos "Listar archivos", "Crear carpeta", "Buscar texto" y "Ruta del PATH" funciona en PowerShell;
  - los avisos de riesgo aparecen en los comandos destructivos y de precaución (por ejemplo, `git clean`, `rm -rf` y `docker system prune`);
  - la búsqueda encuentra comandos nuevos en inglés, español y el idioma activo (por ejemplo, "docker logs", "carpeta" y, en francés, "dossier").

## 6. Cierre

- [x] 6.1 Comprobar con `pnpm run package` que `dist/extension.js` sigue muy por debajo de 2 MB y anotar su tamaño en el PR.
- [x] 6.2 Dejar en verde `pnpm run verify` y `openspec validate catalog-content --strict`. Hacer `/opsx:archive` antes de abrir el PR a `develop`.
