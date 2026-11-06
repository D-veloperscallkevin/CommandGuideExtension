# Catálogo de comandos

Cada categoría es un archivo `catalog/<id>.json` que valida contra [`schema.json`](./schema.json). El catálogo viaja dentro del bundle de la extensión: no se lee de disco en runtime.

Categorías actuales: `git`, `npm`, `pnpm`, `node`, `docker` y `terminal`, con al menos 15 comandos cada una.

## Añadir un comando

1. Abre el archivo de su categoría (por ejemplo `git.json`). Gracias a `"$schema": "./schema.json"`, VS Code autocompleta y marca los errores mientras escribes.
2. Añade un objeto a `commands` (aquí se muestra solo `en` y `es` por brevedad; en el catálogo empaquetado cada texto lleva los 11 idiomas, ver las reglas):

   ```json
   {
     "id": "git.new-branch",
     "title": { "en": "Create and switch branch", "es": "Crear rama y cambiarse" },
     "description": { "en": "Creates a new branch from the current one", "es": "Crea una rama nueva desde la actual" },
     "command": "git checkout -b ${branch}",
     "params": [{
       "name": "branch",
       "label": { "en": "Branch name", "es": "Nombre de la rama" },
       "placeholder": { "en": "feature/my-change", "es": "feature/mi-cambio" }
     }],
     "tags": { "en": ["branch"], "es": ["rama"] },
     "risk": "safe",
     "docs": "https://git-scm.com/docs/git-checkout"
   }
   ```

3. Ejecuta `pnpm run test:unit`.

Reglas (las comprueban los tests):

- `id` = `<id-de-categoría>.<nombre-kebab>`, único en todo el catálogo.
- Todo texto visible lleva `en` y `es`, ambos obligatorios en el schema. Los demás idiomas de la interfaz (`pt-br`, `fr`, `de`, `it`, `ja`, `ko`, `zh-cn`, `zh-tw`, `ru`) son opcionales para el schema (si faltan, se muestra el texto en inglés), **pero el catálogo empaquetado exige los 11** en `title`, `description`, `label`, `placeholder` y `tags`. Un placeholder técnico que no se traduce (`node:22-alpine`, `src/index.js`) repite el mismo valor en los 11.
- Cada comando del catálogo empaquetado enlaza su documentación oficial en `docs`, y cada categoría tiene al menos 15 comandos.
- `risk`:
  - `destructive` si se pierden datos o trabajo sin forma sencilla de recuperarlos (`git reset --hard`, `git clean`, `rm -rf`, `docker system prune`);
  - `caution` si se reescribe, sobrescribe o elimina algo recuperable o regenerable (`git commit --amend`, `npm ci`, `docker rmi`, `cp`, `kill`);
  - `safe` en el resto.
- `command` es la variante POSIX (bash/zsh). Si en otro shell cambia, añade `shells.powershell`, `shells.cmd`, etc. En PowerShell no uses `${...}` propio del shell (como `${env:PATH}`): el catálogo lo tomaría por un parámetro. `$env:PATH`, sin llaves, sí funciona.
- Cada `${x}` de `command` o `shells` debe estar en `params`, y cada param debe aparecer en `command`.
- No hay campo de ejemplo: la UI lo calcula con los `placeholder`, así que elige placeholders realistas.

## Corregir o añadir una traducción

Cada texto lleva una clave por idioma junto a `en` y `es` (`title`, `description`, `label`, `placeholder` y `tags`). Las traducciones se generaron y pueden mejorarse: corrige el valor del idioma y ejecuta `pnpm run test:unit`.

```json
"title": { "en": "Create and switch branch", "es": "Crear rama y cambiarse", "fr": "Créer une branche et s'y placer" }
```

Solo se admiten los idiomas de la lista: una clave como `fr-fr` hace fallar la validación. En el catálogo empaquetado no puede faltar ninguno: el test indica el comando, el campo y el idioma que faltan.

## Añadir una categoría

1. Crea `catalog/<id>.json`. El nombre del archivo debe coincidir con su `id`:

   ```json
   {
     "$schema": "./schema.json",
     "version": 1,
     "id": "npm",
     "title": { "en": "npm", "es": "npm" },
     "icon": "package",
     "order": 20,
     "section": "languages",
     "detect": ["package-lock.json", "npm-shrinkwrap.json"],
     "commands": []
   }
   ```

   `icon` es el nombre de un [Codicon](https://microsoft.github.io/vscode-codicons/dist/codicon.html). `order` define la posición dentro de su sección (ascendente, empates por `id`). `section` es la sección del panel: `languages`, `vcs`, `frameworks`, `databases`, `infra`, `cloud`, `servers`, `quality`, `gamedev` o `tools`.
2. Si la categoría se puede reconocer por un archivo del proyecto, decláralo en `detect` (opcional). Así aparece en **En este proyecto**. Cada patrón tiene una de estas formas, y ninguna distingue mayúsculas:
   - un nombre de la raíz: `go.mod`, `.git`;
   - un nombre de la raíz con comodines `*`: `*.csproj`;
   - una ruta fija de un nivel, sin comodines: `prisma/schema.prisma`.

   No se admiten `**`, `?`, llaves, corchetes, `..` ni rutas más profundas, y nunca se lee el contenido de los archivos. Elige patrones específicos de la herramienta: `*.json` o `README.md` detectarían la categoría en casi cualquier proyecto. Terminal no lleva `detect`.
3. Añade al menos 15 comandos, con sus textos en los 11 idiomas, y ejecuta `pnpm run test:unit`. El build copia todos los `catalog/*.json` y las señales de `detect`; no hay que registrar el archivo en ningún sitio. Añade la nueva categoría a la lista de `test/unit/catalog/content.test.ts`.
