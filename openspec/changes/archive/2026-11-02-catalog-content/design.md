# Design

## Context

- El catálogo se forma con un JSON por categoría en `catalog/`, que valida contra `catalog/schema.json` y se registra con un import estático en `src/catalog/index.ts`.
- Los tests ya comprueban, para cualquier archivo nuevo:
  - el schema (Ajv);
  - `checkCatalogRules`: ids únicos y con prefijo, y cada `${x}` declarado y usado, también en `shells`;
  - que el icono sea un Codicon existente;
  - que todo archivo de `catalog/` esté registrado.
- Hoy solo existe `catalog/git.json` con 3 comandos, en `en` y `es`.
- Los textos en otros idiomas son opcionales (`Partial<Record<Locale, …>>`) y se resuelven campo a campo con fallback a `en`.
- El ejemplo se calcula con el comando efectivo del shell por defecto: `powershell` en Windows y `bash` en el resto.
- `searchText` reúne `en`, `es` y el idioma activo, así que los textos traducidos también se pueden buscar sin tocar la búsqueda.
- Dependen del contenido actual:
  - `src/test/extension.test.ts`, que exige que Git tenga exactamente `['git.status', 'git.new-branch', 'git.reset-hard']`;
  - el test de `searchText` "con un idioma opcional sin traducción no repite textos", que usa `fr` con `git.status`.

## Goals / Non-Goals

**Goals:**

- 6 categorías (`git`, `npm`, `pnpm`, `node`, `docker`, `terminal`) con al menos 15 comandos útiles y habituales cada una.
- Todos los textos del catálogo empaquetado en los 11 idiomas.
- En Windows, Terminal muestra ejemplos válidos en PowerShell.
- Tests que impidan retroceder: contenido mínimo, 11 idiomas y `docs` en cada comando.

**Non-Goals:**

- Cambios en la interfaz, el protocolo, la búsqueda o el schema.
- Variantes `cmd` o `zsh`, y detección del shell (2.1).
- Confirmación de comandos destructivos (2.3): de momento solo se escriben, nunca se ejecutan.
- Comandos de otras herramientas (Prisma, Python, Kubernetes…), que podrán añadirse más adelante.

## Decisions

### D1. Categorías

| `id` | `title` | `order` | `icon` |
| --- | --- | --- | --- |
| `git` | Git | 10 | `git-branch` (sin cambios) |
| `npm` | npm | 20 | `package` |
| `pnpm` | pnpm | 25 | `package` |
| `node` | Node.js | 30 | `symbol-method` |
| `docker` | Docker | 40 | `server-environment` |
| `terminal` | Terminal | 50 | `terminal` |

- **Títulos:** los nombres de producto (Git, npm, pnpm, Node.js, Docker) no se traducen, pero se declaran igualmente en los 11 idiomas. "Terminal" sí se traduce: 终端, 終端機, ターミナル, 터미널, Терминал…
- **Iconos:** se comprueban con el test de Codicons. Si alguno no existe en la versión empaquetada, se elige otro en el apply y se anota aquí.
- **npm y pnpm:** son categorías separadas, por decisión del usuario. Encajan con la detección de proyecto (2.7): `package-lock.json` frente a `pnpm-lock.yaml`. Comparten algunas acciones (instalar, añadir…), pero cada una lleva los comandos propios de su gestor.

### D2. Comandos por categoría

La lista es orientativa. En el apply se pueden ajustar los títulos o añadir comandos, siempre con un mínimo de 15 por categoría y conservando los 3 ids actuales de Git.

**Git (20):**

| Comando | Riesgo |
| --- | --- |
| `git status` | `safe` |
| `git checkout -b ${branch}` | `safe` |
| `git reset --hard` | `destructive` |
| `git clone ${url}` | `safe` |
| `git switch ${branch}` | `safe` |
| `git add .` | `safe` |
| `git commit -m "${message}"` | `safe` |
| `git commit --amend --no-edit` | `caution` |
| `git push` | `safe` |
| `git push -u origin ${branch}` | `safe` |
| `git pull` | `safe` |
| `git fetch --prune` | `safe` |
| `git log --oneline --graph --decorate -20` | `safe` |
| `git diff` | `safe` |
| `git stash` | `safe` |
| `git stash pop` | `safe` |
| `git merge ${branch}` | `safe` |
| `git branch -d ${branch}` | `caution` |
| `git restore ${file}` | `destructive`: descarta los cambios del archivo |
| `git clean -fd` | `destructive` |

**npm (18):**

| Comando | Riesgo |
| --- | --- |
| `npm install` | `safe` |
| `npm ci` | `caution`: borra `node_modules` |
| `npm install ${package}` | `safe` |
| `npm install -D ${package}` | `safe` |
| `npm uninstall ${package}` | `safe` |
| `npm run ${script}` | `safe` |
| `npm run dev` | `safe` |
| `npm run build` | `safe` |
| `npm test` | `safe` |
| `npm outdated` | `safe` |
| `npm update` | `safe` |
| `npm audit` | `safe` |
| `npm audit fix` | `caution` |
| `npm init -y` | `safe` |
| `npm ls --depth=0` | `safe` |
| `npx ${package}` | `safe` |
| `npm version ${bump}` | `caution`: crea un commit y un tag |
| `npm cache clean --force` | `caution` |

**pnpm (18):**

| Comando | Riesgo |
| --- | --- |
| `pnpm install` | `safe` |
| `pnpm install --frozen-lockfile` | `safe` |
| `pnpm add ${package}` | `safe` |
| `pnpm add -D ${package}` | `safe` |
| `pnpm remove ${package}` | `safe` |
| `pnpm run ${script}` | `safe` |
| `pnpm dev` | `safe` |
| `pnpm build` | `safe` |
| `pnpm test` | `safe` |
| `pnpm outdated` | `safe` |
| `pnpm update` | `safe` |
| `pnpm audit` | `safe` |
| `pnpm dlx ${package}` | `safe` |
| `pnpm why ${package}` | `safe` |
| `pnpm --filter ${workspace} run ${script}` | `safe` |
| `pnpm -r run ${script}` | `safe` |
| `pnpm ls --depth 0` | `safe` |
| `pnpm store prune` | `caution` |

**Node.js (16):** todos `safe`.

- `node --version`
- `node ${file}`
- `node --watch ${file}`
- `node --inspect ${file}`
- `node --inspect-brk ${file}`
- `node --test`
- `node --test --watch`
- `node --env-file=.env ${file}`
- `node --run ${script}`
- `node -e "${code}"`
- `node -p "${expression}"`
- `node --check ${file}`
- `node` (REPL)
- `node --max-old-space-size=${megabytes} ${file}`
- `node --trace-warnings ${file}`
- `corepack enable`

**Docker (18):**

| Comando | Riesgo |
| --- | --- |
| `docker ps` | `safe` |
| `docker ps -a` | `safe` |
| `docker images` | `safe` |
| `docker pull ${image}` | `safe` |
| `docker build -t ${image} .` | `safe` |
| `docker run -it --rm ${image}` | `safe` |
| `docker run -d -p ${ports} --name ${name} ${image}` | `safe` |
| `docker logs -f ${container}` | `safe` |
| `docker exec -it ${container} sh` | `safe` |
| `docker stop ${container}` | `safe` |
| `docker rm ${container}` | `caution` |
| `docker rmi ${image}` | `caution` |
| `docker compose up -d` | `safe` |
| `docker compose down` | `safe` |
| `docker compose down -v` | `destructive`: borra los volúmenes |
| `docker compose logs -f` | `safe` |
| `docker compose build` | `safe` |
| `docker system prune -a` | `destructive` |

**Terminal (18):** variante POSIX → `shells.powershell`.

| POSIX | PowerShell | Riesgo |
| --- | --- | --- |
| `pwd` | sin variante (alias en PowerShell) | `safe` |
| `ls -la` | `Get-ChildItem -Force` | `safe` |
| `cd ${directory}` | sin variante | `safe` |
| `mkdir -p ${directory}` | `New-Item -ItemType Directory -Force ${directory}` | `safe` |
| `touch ${file}` | `New-Item -ItemType File ${file}` | `safe` |
| `cat ${file}` | `Get-Content ${file}` | `safe` |
| `tail -n 50 -f ${file}` | `Get-Content ${file} -Tail 50 -Wait` | `safe` |
| `cp -r ${source} ${destination}` | `Copy-Item -Recurse ${source} ${destination}` | `caution`: sobrescribe |
| `mv ${source} ${destination}` | `Move-Item ${source} ${destination}` | `caution` |
| `rm ${file}` | `Remove-Item ${file}` | `destructive` |
| `rm -rf ${directory}` | `Remove-Item -Recurse -Force ${directory}` | `destructive` |
| `find . -name "${pattern}"` | `Get-ChildItem -Recurse -Filter "${pattern}"` | `safe` |
| `grep -rn "${text}" .` | `Get-ChildItem -Recurse -File \| Select-String -Pattern "${text}"` | `safe` |
| `which ${program}` | `Get-Command ${program}` | `safe` |
| `echo "$PATH" \| tr ':' '\n'` | `$env:PATH -split ';'` | `safe` |
| `du -sh ${directory}` | `"{0:N1} MB" -f ((Get-ChildItem ${directory} -Recurse -File \| Measure-Object Length -Sum).Sum / 1MB)` | `safe` |
| `lsof -i :${port}` | `Get-NetTCPConnection -LocalPort ${port}` | `safe` |
| `kill ${pid}` | `Stop-Process -Id ${pid}` | `caution` |

- La variante solo se declara cuando el texto difiere. `pwd` y `cd` funcionan igual en PowerShell, y también `clear` y `history` si se añaden.
- En PowerShell no se usa `${env:X}` ni `${...}` propio de PowerShell, porque el catálogo interpreta `${x}` como parámetro. `$env:PATH`, sin llaves, no choca.
- Cada comando lleva `docs`:

  | Categoría | Documentación |
  | --- | --- |
  | Git | git-scm.com/docs |
  | npm | docs.npmjs.com |
  | pnpm | pnpm.io |
  | Node.js | nodejs.org/api/cli.html |
  | Docker | docs.docker.com |
  | Terminal | man7.org para la variante POSIX; la de PowerShell, en la descripción si hace falta |

### D3. Criterio de riesgo

- `destructive`: el comando borra datos o trabajo sin papelera ni forma sencilla de recuperarlos (`reset --hard`, `restore`, `clean`, `rm`, `compose down -v`, `system prune`).
- `caution`: el comando reescribe, sobrescribe o elimina algo que se puede recuperar o regenerar (amend, borrar una rama fusionada, `ci`, `audit fix`, `version`, `rmi`, `cp`/`mv`, `kill`).
- `safe`: todo lo demás, incluidos los comandos que solo instalan o leen.

### D4. Traducciones y formato del JSON

- **Idiomas:**
  - Cada `LocalizedString` lleva las 11 claves, en el orden de `SUPPORTED_LOCALES`: `en`, `es`, `pt-br`, `fr`, `de`, `it`, `ja`, `ko`, `zh-cn`, `zh-tw` y `ru`.
  - Los `tags` llevan de 1 a 4 términos por idioma. En los idiomas no latinos se incluye el término local; el nombre de la herramienta ya está en el título y en el ejemplo, que también se buscan.
- **Placeholders:**
  - los de texto se traducen: `feature/mi-cambio`, `"fix: corrige el login"`;
  - los técnicos (nombres de paquete, imagen, puerto, archivo `src/index.js`, URL) repiten el mismo valor en los 11 idiomas;
  - todos son realistas porque forman el ejemplo visible.
- **Formato:**
  - una línea por idioma en los textos largos, para que los diffs y las revisiones de traductores sean legibles;
  - 2 espacios, igual que `git.json`.
- **Revisión:**
  - las traducciones son generadas, como las de la interfaz, y el README ya invita a corregirlas;
  - se cuida que los términos técnicos (commit, branch, stash, workspace…) usen la forma habitual en cada idioma, y en caso de duda se deja el término en inglés.
- **Cómo se escriben:** los JSON se escriben directamente, categoría a categoría, sin generador. El contenido es el entregable, y un generador sería código sin uso posterior.

### D5. Tests

**Nuevo `test/unit/catalog/content.test.ts`, sobre `bundledCatalog`:**

- **Categorías:** las ids, ordenadas como las devuelve `CatalogService`, son `['git', 'npm', 'pnpm', 'node', 'docker', 'terminal']`.
- **Contenido mínimo:**
  - función pura `undersized(catalog, min)` que devuelve `"<id>: <n>"` para cada categoría con menos de `min` comandos;
  - con el catálogo empaquetado y `min = 15`, el resultado es `[]`;
  - se prueba también con una categoría de fixture que tiene pocos comandos.
- **11 idiomas:**
  - función pura `missingTranslations(catalog)` que devuelve `"<id>: <campo> <idioma>"`, por ejemplo `"git.status: description ko"` o `"git.new-branch: params.branch.placeholder ja"`;
  - con el catálogo empaquetado, el resultado es `[]`;
  - con un fixture al que le falta un idioma, nombra el comando, el campo y el idioma;
  - los textos vacíos y las listas de `tags` vacías cuentan como ausentes.
- **`docs`:** todos los comandos empaquetados declaran `docs`.
- **PowerShell en Terminal:** `buildCategorySummaries(…, 'en', 'powershell')` da para `terminal.remove-directory` un ejemplo que empieza por `Remove-Item -Recurse -Force`.

**Ajustes en tests existentes:**

- **`CatalogService.test.ts`:** el test "con un idioma opcional sin traducción no repite textos" pasa a "con un idioma opcional traducido no repite textos y lo incluye". Con `fr`, `git.status` contiene su título francés normalizado y sigue sin partes repetidas. El resto de los tests de `searchText` siguen valiendo, porque `en` y `es` no cambian para los 3 comandos actuales.
- **`src/test/extension.test.ts`:**
  - las categorías enviadas son las 6, en orden;
  - Git contiene `git.status`, `git.new-branch` y `git.reset-hard`, sin exigir que sean los únicos;
  - `git.reset-hard` sigue siendo `destructive`.

### D6. Orden de implementación

Una categoría por paso: escribir su JSON, registrarla en `src/catalog/index.ts` y ejecutar `pnpm run test:unit`, para que los errores de schema y de reglas salgan pronto y localizados. Los tests de contenido mínimo y de 11 idiomas se escriben primero, y fallan hasta que esté la última categoría. Después vienen la integración, la documentación y la comprobación del tamaño del bundle con `pnpm run package`.

## Risks / Trade-offs

- [Unos 90 comandos en 11 idiomas son mucho texto generado: puede haber traducciones poco naturales] → Términos técnicos conservadores, revisión por categorías y el flujo de corrección ya documentado en el README.
- [Archivos JSON largos (5.000+ líneas en total)] → Uno por categoría, con formato regular. La validación con `$schema` en VS Code marca los errores al editar.
- [Algunos comandos de PowerShell son más largos o menos idiomáticos (`du`)] → Se prefiere el cmdlet nativo a depender de herramientas externas, y en el F5 se prueba que cada variante funcione en PowerShell 5.1.
- [`Get-NetTCPConnection` no existe fuera de Windows (pwsh en Linux)] → La variante `powershell` hoy solo se usa en Windows (`defaultShellFor`). Se revisará con la detección de shell (2.1).
- [`docker compose` v2 frente a `docker-compose` v1] → Solo v2, la versión con soporte.
- [Cambiar las ids o el contenido más adelante rompe favoritos e historial (2.4, 2.5)] → Las ids se eligen ahora en kebab-case estable y en inglés.
- [El tamaño del `.vsix` crece] → Se mide al final. Se estiman 150–250 KB, frente al límite de 2 MB de la 1.8.
