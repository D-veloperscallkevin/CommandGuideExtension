## Context

- **Señales:** `src/project/detect.ts` define `PROJECT_SIGNALS`, 9 pares `{ file, categoryId }` con nombres exactos. `detectCategories(roots, exists)` hace un `exists` (un `vscode.workspace.fs.stat`) por señal y por carpeta. `SIGNAL_GLOB` une los nombres en un `{a,b,…}` para el watcher.
- **`ProjectDetector`:** se crea en `activate()`, detecta en el arranque y vuelve a detectar, con 200 ms de espera, al cambiar las carpetas, el ajuste o los archivos vigilados. Su interfaz `ProjectWorkspace<F>` expone `folders`, `exists`, `watch` y el ajuste, y se testea con Vitest sin `vscode`.
- **Catálogo bajo demanda (3.1):** los JSON se copian a `dist/catalog/` y solo se leen en la primera consulta de `CatalogService`. El test de integración comprueba que `isCatalogLoaded()` es `false` tras activar. Por eso la detección, que corre al activar, no puede leer el catálogo.
- **Comparación de nombres:** `stat` distingue mayúsculas en Linux y no en Windows ni en macOS, así que hoy `dockerfile` en minúsculas se detecta en unas plataformas y en otras no.

## Goals / Non-Goals

**Goals:**
- Que un lote nuevo declare sus señales solo en el JSON de su categoría, sin tocar código.
- Patrones con comodín en la raíz y rutas fijas de un nivel.
- El mismo resultado en Windows, macOS y Linux.
- Ninguna lectura de `dist/catalog/` durante la activación.

**Non-Goals:**
- Añadir las señales de las categorías que aún no existen (Go, Rust, Python, Prisma, Terraform…). Llegan con cada lote, de la 3.3 a la 3.14.
- Búsqueda recursiva o en monorepos (`apps/*/package.json`).
- Leer el contenido de los archivos, por ejemplo las dependencias de `package.json`. Eso es de la 3.15.
- Señales en las categorías propias del usuario (`devcommands.customCommands`).

## Decisions

### 1. Campo `detect` en cada categoría

`catalog/schema.json` añade a la categoría la propiedad opcional `detect`, de tipo array, con `minItems: 1` y `uniqueItems: true`. Cada elemento valida contra este patrón:

```
^(?!.*\*\*)(?:[A-Za-z0-9._+-]+/[A-Za-z0-9._+-]+|[A-Za-z0-9._+*-]+)$
```

Así quedan fuera `**`, `?`, `[`, `{`, `\`, las rutas de más de un nivel, la `/` inicial o final y los comodines dentro de una ruta.

`checkCatalogRules` (`src/catalog/validate.ts`) rechaza además cualquier segmento que sea `.` o `..`, porque el patrón de arriba los deja pasar. Los errores nombran la categoría y el patrón. La regla de que `terminal` no declare `detect` es un test del contenido (`content.test.ts`), igual que el actual "terminal nunca se detecta".

`Category` (`src/catalog/types.ts`) gana `readonly detect?: readonly string[]`. Las categorías propias no lo llevan.

Alternativa descartada: mantener la lista en el código. Obliga a cada lote a tocar `detect.ts`, y la relación entre la categoría y su señal queda lejos del JSON.

### 2. Las señales llegan al bundle con un módulo virtual de esbuild

`esbuild.js` añade un plugin que resuelve `virtual:project-signals`. En cada build, el plugin:
1. lee los `catalog/*.json`, salvo `schema.json`;
2. genera `export default [{ categoryId, detect }, …]` solo con las categorías que tienen `detect`, ordenadas por id;
3. declara esos archivos en `watchFiles`, para que el modo watch vuelva a generarlo cuando cambia un JSON.

`src/virtual-modules.d.ts` declara el tipo del módulo para `tsc`. Solo `src/extension.ts` lo importa y se lo pasa a `createProjectDetector(signals)`, así que nada que use Vitest depende del módulo virtual.

En los tests, las mismas señales se obtienen con `signalsFromCatalog(bundledCatalog)`, la función pura que también aplana la entrada del módulo. Así se testea con el catálogo real.

El coste en el bundle es de unos cientos de bytes ahora y de unos pocos KB con la Fase 3.

Alternativas descartadas:
- un `dist/project-signals.json` leído al activar: añade una lectura de disco y otro archivo obligatorio en el paquete;
- `define` de esbuild: no se regenera en modo watch.

### 3. Patrones compilados y comparación sin mayúsculas

`src/project/detect.ts` pasa a exportar:
- `ProjectSignal = { categoryId, pattern }` y `signalsFromCatalog(entries)`, que aplana `[{ categoryId, detect }]` en señales;
- `compileSignals(signals)`, que separa:
  - los patrones de la raíz, compilados a `RegExp`: se escapa todo, `*` pasa a `[^/]*` y se usa el flag `i`;
  - las rutas de un nivel, `{ dir, name }`, en minúsculas;
- `detectCategories(roots, signals, list)`, donde `list(root, dir?)` devuelve los nombres de las entradas de la raíz, o de una subcarpeta suya.

El algoritmo, para cada carpeta:
1. Hace un `list(root)`.
2. Prueba los patrones de la raíz contra cada nombre.
3. Para cada ruta de un nivel cuya carpeta aparece en la raíz, sin distinguir mayúsculas, hace un `list(root, dirReal)` y busca el nombre, también sin distinguirlas.

Un `list` que falla devuelve `[]`. El resultado es la unión de todas las carpetas. Desaparecen `PROJECT_SIGNALS` y `SIGNAL_GLOB` como constantes.

Con esto:
- hay una sola lectura de la raíz por carpeta, frente a los 9 `stat` actuales que, con la Fase 3, serían unos 60;
- el resultado no depende de si el sistema de archivos distingue mayúsculas.

### 4. `ProjectWorkspace` lista en lugar de comprobar

`exists(folder, name)` se sustituye por `list(folder, dir?)`. En `vscodeProject.ts`, `list` llama a `vscode.workspace.fs.readDirectory(dir ? Uri.joinPath(folder, dir) : folder)` y devuelve solo los nombres. Funciona también en sistemas de archivos remotos y virtuales, como hoy con `stat`.

`ProjectDetector` recibe las señales en el constructor y las compila una vez.

### 5. Watcher: toda la raíz y las carpetas de las rutas

Un glob como `{Dockerfile,*.csproj}` distingue mayúsculas en algunas plataformas y no cubre bien las combinaciones. Por eso el glob de cada carpeta pasa a ser `{*,<dir1>/*,<dir2>/*}`: cualquier entrada creada o borrada en la raíz, más los archivos de las carpetas que usan las rutas de un nivel. Hoy no hay ninguna ruta, así que el glob es `*`.

El coste:
- crear o borrar un archivo en la raíz provoca una detección, agrupada con la espera de 200 ms ya existente;
- cada detección cuesta un `readDirectory` por carpeta;
- los cambios dentro de `src/` y otras subcarpetas no afectan, porque `*` no cruza `/`.

`ProjectDetector` expone el glob con `watchGlob(signals)`, que se testea.

### 6. Señales de las categorías actuales

| Categoría | `detect` |
| --- | --- |
| `git` | `.git` |
| `node` | `package.json`, `.nvmrc`, `.node-version` |
| `pnpm` | `pnpm-lock.yaml`, `pnpm-workspace.yaml` |
| `npm` | `package-lock.json`, `npm-shrinkwrap.json` |
| `docker` | `Dockerfile`, `Containerfile`, `compose.yaml`, `compose.yml`, `docker-compose.yml`, `docker-compose.yaml`, `.dockerignore` |

### 7. Mensajes webview↔extensión y dependencias

- **Mensajes:** ninguno cambia. `catalog` sigue llevando `detected` con los ids, en el orden del catálogo.
- **Dependencias:** no hay ninguna nueva de runtime. La comparación usa `RegExp`, y el plugin es código propio de `esbuild.js`.

## Risks / Trade-offs

- **Ruido del watcher en raíces muy activas.** Por ejemplo, una herramienta que crea y borra archivos temporales en la raíz. Las detecciones se agrupan cada 200 ms y cada una lista la raíz una vez, así que el coste es bajo. Si molestara, se puede volver a un glob con los patrones.
- **Raíces enormes.** Una raíz con miles de entradas hace `readDirectory` más caro que unos pocos `stat`, pero sigue siendo una sola llamada y no recorre subcarpetas.
- **Módulo virtual y `tsc`.** Si se renombra el módulo, la declaración `.d.ts` y el plugin deben coincidir. Lo cubren el build, que fallaría al resolverlo, y el test de integración, que detecta `node` y `pnpm`.
- **Señales demasiado genéricas.** `.dockerignore` o `*.json` en la raíz podrían dar falsos positivos. El schema no impide `*.json`, así que la revisión de cada lote debe vigilar que los patrones sean específicos. `catalog/README.md` lo indica.
