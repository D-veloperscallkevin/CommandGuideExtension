# Catálogo de comandos

Cada categoría es un archivo `catalog/<id>.json` que valida contra [`schema.json`](./schema.json). El catálogo viaja dentro del bundle de la extensión: no se lee de disco en runtime.

## Añadir un comando

1. Abre el archivo de su categoría (por ejemplo `git.json`). Gracias a `"$schema": "./schema.json"`, VS Code autocompleta y marca los errores mientras escribes.
2. Añade un objeto a `commands`:

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
- Todo texto visible lleva `en` y `es`, ambos obligatorios. Los demás idiomas de la interfaz (`pt-br`, `fr`, `de`, `it`, `ja`, `ko`, `zh-cn`, `zh-tw`, `ru`) son opcionales: si faltan, se muestra el texto en inglés.
- `risk`: `safe`, `caution` o `destructive`. Usa `destructive` si se pierde trabajo o datos (`git reset --hard`, `rm -rf`).
- `command` es la variante POSIX (bash/zsh). Si en otro shell cambia, añade `shells.powershell`, `shells.cmd`, etc.
- Cada `${x}` de `command` o `shells` debe estar en `params`, y cada param debe aparecer en `command`.
- No hay campo de ejemplo: la UI lo calcula con los `placeholder`, así que elige placeholders realistas.

## Añadir una traducción

Añade la clave del idioma junto a `en` y `es` en cualquier texto (`title`, `description`, `label`, `placeholder`) o en `tags`:

```json
"title": { "en": "Create and switch branch", "es": "Crear rama y cambiarse", "fr": "Créer une branche et s'y placer" }
```

Solo se admiten los idiomas de la lista: una clave como `fr-fr` hace fallar la validación. Se puede traducir campo a campo; lo que falte se muestra en inglés.

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
     "commands": []
   }
   ```

   `icon` es el nombre de un [Codicon](https://microsoft.github.io/vscode-codicons/dist/codicon.html). `order` define la posición (ascendente, empates por `id`).
2. Regístrala en `src/catalog/index.ts` con un import estático y añádela al array.
3. Añade al menos un comando y ejecuta `pnpm run test:unit`. Si olvidaste el paso 2, el test lo indica nombrando el archivo.
