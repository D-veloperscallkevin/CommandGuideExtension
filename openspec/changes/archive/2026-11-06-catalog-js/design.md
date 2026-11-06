## Context

- **Cómo se añade una categoría** desde la 3.1 y la 3.2:
  - basta un `catalog/<id>.json` con `section`, `detect` opcional y los comandos;
  - el build lo copia a `dist/catalog/` y sus señales entran en el bundle;
  - no hay que tocar código.
- **Tests que ya vigilan el contenido:**
  - schema (Ajv) y `checkCatalogRules`: ids con prefijo, placeholders declarados y patrones `detect`;
  - al menos 15 comandos por categoría;
  - traducción completa a 11 idiomas;
  - iconos Codicon existentes;
  - la lista y el orden de las categorías en `content.test.ts`.
- **Orden:** `order` es global y cada sección muestra sus categorías por ese orden. Las de `languages` hoy son npm (20), pnpm (25) y node (30).
- **Formato de las categorías actuales:** 16–20 comandos con `title`, `description` y `tags` en 11 idiomas, `params` con `label` y `placeholder` traducidos, `shells` solo cuando la sintaxis cambia y `docs` con un enlace oficial.

## Goals / Non-Goals

**Goals:**
- Comandos útiles del día a día de cada herramienta, con la sintaxis de su documentación actual.
- Variantes por shell correctas en Windows (PowerShell y cmd) donde cambian.
- Que el proyecto abierto muestre estas categorías en "En este proyecto".

**Non-Goals:**
- **Instaladores de las herramientas.** Por ejemplo `curl … | bash` o `irm … | iex`: ejecutan scripts remotos y la extensión nunca debe proponerlos.
- **Python, pip, pipx, poetry, uv y conda:** son de la 3.3b.
- **asdf y mise:** son de la 3.5.
- **Detectar el gestor por el campo `packageManager` de `package.json`:** la detección no lee contenido.

## Decisions

### 1. Categorías, orden, icono y señales

| id | order | icon | detect |
| --- | --- | --- | --- |
| `yarn` | 26 | `package` | `yarn.lock`, `.yarnrc.yml` |
| `bun` | 27 | `zap` | `bun.lock`, `bun.lockb`, `bunfig.toml` |
| `deno` | 32 | `symbol-namespace` | `deno.json`, `deno.jsonc`, `deno.lock` |
| `typescript` | 35 | `file-code` | `tsconfig*.json` |
| `version-managers` | 38 | `versions` | `.nvmrc`, `.node-version`, `.python-version` |

Todas van en la sección `languages`. El orden resultante en esa sección es: npm, pnpm, yarn, bun, node, deno, typescript, version-managers.

`.nvmrc` y `.node-version` ya detectan `node`. Que detecten también `version-managers` es intencionado: quien fija la versión suele usar uno de esos gestores.

`tsconfig*.json` cubre `tsconfig.json`, `tsconfig.base.json`, `tsconfig.build.json`… No hay riesgo de falso positivo, porque ninguna otra herramienta usa ese prefijo.

### 2. Yarn: sintaxis de Yarn moderno (Berry, 2+) con avisos para Classic

Yarn 1 (Classic) y Yarn 2+ (Berry) coinciden en `install`, `add`, `add -D`, `remove`, `run`, `why`, `info` e `init`. Difieren en:
- `dlx`, que solo existe en Berry;
- `up`, que en Classic es `upgrade`;
- `workspaces foreach`, solo en Berry.

El catálogo sigue la documentación actual, la de Berry. Cuando un comando no existe en Classic, su descripción lo dice ("Yarn 2 o superior") en los 11 idiomas.

Alternativa descartada: dos categorías, una por versión. Dobla el contenido para una versión en mantenimiento.

### 3. Gestores de versiones en una categoría, con variantes de Windows

Unos 3 o 4 comandos por herramienta, cada uno con el nombre de la herramienta al principio del título para distinguirlos: "nvm: instalar una versión", "fnm: …", "pyenv: …".

- **nvm.** En Windows existe otro proyecto, nvm-windows, con otra sintaxis.
  - `command` es la sintaxis de nvm (bash/zsh), y `shells.powershell` y `shells.cmd` la de nvm-windows cuando difiere. Por ejemplo, `nvm install --lts` en bash es `nvm install lts` en Windows, y `nvm ls-remote --lts` es `nvm list available`. `nvm list` y `nvm current` existen con el mismo nombre en los dos.
  - Solo se incluyen comandos que existen en los dos: install, use, list, current y uninstall.
  - `nvm use` sin versión (lee `.nvmrc`) no existe en nvm-windows, así que se usa `fnm use` para ese caso.
- **fnm.** Activarlo en la sesión cambia según el shell:
  - bash: `eval "$(fnm env --use-on-cd --shell bash)"`, y zsh igual con `--shell zsh`, como indica el README de fnm;
  - PowerShell: `fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression`;
  - cmd: `FOR /f "tokens=*" %i IN ('fnm env --use-on-cd') DO CALL %i`.

  El resto de comandos de fnm (install, use, list, default) es igual en todos.
- **volta.** Comandos iguales en todos los shells: install, pin, list y run.
- **corepack.** Comandos iguales en todos los shells: enable, `use pnpm@latest` y prepare.
- **pyenv.** pyenv-win usa los mismos subcomandos (install, global, local, versions, shell). `pyenv shell` en PowerShell funciona igual con pyenv-win, así que no lleva variante.

Antes de escribir cada variante se comprueba en la documentación oficial (Context7 o la web oficial del proyecto). Si no se confirma, el comando no entra.

### 4. Riesgo

- **`destructive`:**
  - desinstalar versiones (`nvm uninstall`, `fnm uninstall`, `pyenv uninstall`);
  - borrar cachés (`yarn cache clean`, `bun pm cache rm`);
  - `deno clean`.
- **`caution`:**
  - comandos que cambian el entorno global o el proyecto de forma amplia (`volta pin`, `corepack enable`, `yarn up`, `bun update`, `nvm alias default`);
  - comandos que publican o compilan con permisos amplios (`deno run -A`).
- **`safe`:** el resto.

### 5. Parámetros y placeholders

Se reutilizan los nombres de parámetro ya habituales (`package`, `script`, `version`, `file`). Los placeholders no se traducen cuando son código: `typescript`, `20`, `3.12`, `main.ts`. En ese caso llevan el mismo valor en los 11 idiomas, como exige el requisito de traducción.

### 6. Traducciones

Se escriben como las de las categorías actuales: frases cortas en imperativo en el título y descripción de una línea. Los términos técnicos no se traducen (`lockfile`, `workspace`, `devDependencies`). Los `tags` incluyen sinónimos en cada idioma para la búsqueda.

### 7. Mensajes webview↔extensión y dependencias

- **Mensajes:** sin cambios. Las categorías nuevas viajan en el mensaje `catalog` igual que las actuales.
- **Dependencias:** ninguna nueva.

## Risks / Trade-offs

- **Sintaxis que cambia entre versiones** de las herramientas (Yarn Classic/Berry, Bun y Deno, que se mueven rápido). Mitigación:
  - cada comando se comprueba contra la documentación actual;
  - lleva su enlace `docs`;
  - la descripción avisa cuando depende de la versión.
- **nvm frente a nvm-windows:** son proyectos distintos, y una opción puede existir en uno y no en otro. Solo se incluyen los comandos verificados en los dos.
- **Volumen de traducción:** unos 80 comandos en 11 idiomas. El test de traducción completa impide dejar huecos, pero no valida la calidad. La revisión en F5 y la del PR deben mirar al menos `es` y `en`.
