# Proposal

## Why

El catálogo solo tiene 3 comandos de Git. La vista, el envío a la terminal, la copia y la búsqueda ya funcionan, pero sin contenido la extensión no es útil. La fase 1 (MVP, roadmap 1.7) pide al menos 5 categorías con 15 comandos cada una antes del empaquetado (1.8).

Además, la interfaz está en 11 idiomas, pero los textos del catálogo solo están en inglés y español: en los otros 9 idiomas los comandos aparecen en inglés.

## What Changes

- **6 categorías con al menos 15 comandos cada una**:

  | Categoría | `order` | Icono |
  | --- | --- | --- |
  | Git (se amplían los 3 actuales) | 10 | `git-branch` |
  | npm | 20 | `package` |
  | pnpm | 25 | `package` |
  | Node.js | 30 | Codicon existente, elegido en el apply |
  | Docker | 40 | Codicon existente, elegido en el apply |
  | Terminal | 50 | `terminal` |

- **Terminal**: `command` en POSIX (bash/zsh) y `shells.powershell` en cada comando cuya sintaxis difiera, para que el ejemplo en Windows ya sea correcto. En el resto de categorías solo hay variante cuando el comando cambia de verdad entre shells.
- **11 idiomas en todo el catálogo empaquetado**: `title` de la categoría, `title` y `description` de cada comando, `label` y `placeholder` de cada parámetro, y `tags`. Incluye completar los 3 comandos de Git actuales. Los comandos no se traducen. Las traducciones son generadas y se revisan como las de la interfaz.
- **Riesgo**:
  - `destructive` cuando se pierden datos o trabajo (`git reset --hard`, `git clean`, `docker system prune`, `rm -rf`…);
  - `caution` cuando se reescribe o se elimina algo recuperable (amend, borrar una imagen, limpiar la caché…);
  - `safe` en el resto.
- Cada comando lleva `docs` oficial (https) y placeholders realistas, porque son el ejemplo visible.
- **Tests nuevos**:
  - contenido mínimo: al menos 5 categorías y al menos 15 comandos en cada una;
  - todos los textos del catálogo empaquetado en los 11 idiomas.
- El esquema **no cambia**: sigue aceptando los 9 idiomas como opcionales (los comandos propios de la 2.6 podrán ir solo en `en`/`es`).
- El test de integración deja de exigir que Git tenga exactamente 3 comandos.
- No hay cambios de interfaz.
- Fuera de alcance:
  - plantillas que usen la sintaxis de PowerShell `${env:X}` (choca con los placeholders `${x}`);
  - comandos de `cmd`;
  - detección del shell (2.1) y del proyecto (2.7).

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `command-catalog`: requisitos nuevos de contenido mínimo del catálogo empaquetado y de traducción completa a los 11 idiomas.

## Impact

- **Catálogo**: `catalog/git.json` (ampliado y traducido), nuevos `catalog/npm.json`, `catalog/pnpm.json`, `catalog/node.json`, `catalog/docker.json` y `catalog/terminal.json`.
- **Código**: `src/catalog/index.ts` registra las 5 categorías nuevas.
- **Tests**:
  - nuevos tests en `test/unit/catalog/` (contenido mínimo y 11 idiomas);
  - ajuste del test de `searchText` con `fr` (Git pasa a tener francés);
  - ajuste de `src/test/extension.test.ts`.
- **Documentación**: `README.md` (Usage y la nota "Work in progress"), `CHANGELOG.md`, `docs/ROADMAP.md` y `catalog/README.md` (ejemplo de categoría con los 11 idiomas y la regla del catálogo empaquetado).
- **Bundle**: unos 90 comandos en 11 idiomas añaden del orden de 150–250 KB al `.vsix`, muy por debajo del límite de 2 MB de la 1.8.
- Sin dependencias nuevas.
