# DevCommands — Roadmap de la extensión de VS Code

Oct 30, 2026 · @Kevin

## Visión del producto

DevCommands (nombre provisional) es una extensión de VS Code que funciona como una guía rápida de comandos. Con un clic, el comando queda escrito en la terminal, listo para ejecutar, sin salir del editor ni buscar en Google.

- **Para quién:** desarrolladores que alternan entre muchas herramientas (Git, npm, Docker, Supabase, Prisma, etc.) y no recuerdan todas las flags.
- **Propuesta de valor:** navegación por categoría → lista de comandos → clic → comando en la terminal. Todo en menos de 3 clics y sin ejecutar nada a ciegas.
- **Diferenciador:** no es una cheatsheet estática. Los comandos son plantillas con parámetros (`git checkout -b ${branch}`), se pueden marcar como favoritos y el usuario puede añadir los suyos.
- **Principio rector:** el comando se escribe en la terminal pero **no se ejecuta** por defecto. El usuario siempre confirma con Enter.

## Funcionalidades

El MVP cubre exactamente lo que pediste: categorías, lista de comandos y clic que envía a la terminal. Todo lo demás son ideas mías, ordenadas por valor y esfuerzo.

| Funcionalidad | Qué hace | Fase |
| --- | --- | --- |
| Vista de categorías | Panel en la barra lateral con tarjetas: Git, npm/pnpm, Node, Docker, Linux/Bash, PowerShell, Prisma, Supabase CLI, Next.js, Vite | MVP |
| Lista de comandos | Al elegir categoría: comando, descripción corta y ejemplo | MVP |
| Enviar a terminal | Clic → se escribe en la terminal activa sin ejecutarse | MVP |
| Copiar al portapapeles | Botón secundario por si no quieres usar la terminal | MVP |
| Búsqueda global | Filtra por nombre, descripción o tags en todas las categorías | MVP |
| Comandos con parámetros | Plantillas `${nombre}`: un formulario o InputBox pide los valores antes de enviarlos | v1 |
| Favoritos | Estrella por comando; sección "Favoritos" al inicio | v1 |
| Historial reciente | Últimos 20 comandos enviados | v1 |
| Comandos personalizados | El usuario crea sus propios comandos y categorías (se guardan en settings o en un JSON) | v1 |
| Nivel de riesgo | Etiqueta en comandos destructivos (`rm -rf`, `git reset --hard`, `docker system prune`) y confirmación extra | v1 |
| Detección del proyecto | Si hay `package.json`, `Dockerfile` o `prisma/`, sugiere esas categorías primero | v1 |
| Detección de shell y SO | Muestra la variante correcta (bash, zsh, PowerShell) del mismo comando | v1 |
| Quick Pick por paleta | `Ctrl+Shift+P` → "DevCommands: Buscar" sin abrir el panel | v1 |
| Scripts del proyecto | Lee los `scripts` de `package.json` y los muestra como categoría automática | v2 |
| Workflows (secuencias) | Un clic envía varios comandos en orden (ej. "nueva feature": checkout develop, pull, crear rama) | v2 |
| Packs importables | Exportar/importar colecciones en JSON para compartir con un equipo | v2 |
| Enlace a docs oficiales | Cada comando enlaza a su documentación | v2 |
| i18n | Interfaz en español e inglés (`vscode.l10n` + diccionario del webview). El catálogo ya es bilingüe desde `catalog-schema` | v1 |

Fuera de alcance por ahora: ejecutar comandos automáticamente, sincronización en la nube y comandos generados por IA. Se pueden reconsiderar después de la v2.

## Restricciones iniciales

Estas reglas se copian al `context` y a las `rules` de `openspec/config.yaml` (paso 6), para que cada propuesta las respete.

**Técnicas**

- TypeScript en modo `strict` tanto en la extensión como en el webview. Nada de `any` sin justificación.
- `engines.vscode` mínimo `^1.90.0`. Solo API estable, sin proposed APIs.
- Bundle con esbuild (extensión) y Vite (webview). El `.vsix` final debe pesar menos de 2 MB.
- Cero dependencias de runtime en la extensión salvo que estén justificadas en el `design.md` del change.
- El catálogo de comandos vive en JSON versionado, validado con un JSON Schema. No hay comandos escritos dentro del código.

**Seguridad**

- `terminal.sendText(cmd, false)`: nunca se ejecuta automáticamente. Ejecutar exige una acción explícita y opcional del usuario.
- Webview con Content Security Policy estricta, `nonce` en scripts y `localResourceRoots` limitado a `dist/webview`.
- Todos los mensajes webview → extensión se validan (tipo y forma). El webview no puede mandar texto arbitrario a la terminal, solo el `id` de un comando del catálogo más los parámetros.
- Los parámetros introducidos por el usuario se escapan según el shell detectado.
- Sin telemetría ni llamadas de red en MVP y v1.

**UX y rendimiento**

- Activación perezosa (por vista o comando), nunca `"*"`. Activación en menos de 100 ms.
- El webview usa las variables CSS de VS Code (`--vscode-*`) para respetar el tema claro, oscuro y de alto contraste.
- Navegable por teclado y con etiquetas ARIA.
- Funciona en Windows, macOS, Linux y WSL.

**Proceso**

- Ningún código se escribe sin un change de OpenSpec aprobado (`/opsx:propose`).
- Conventional Commits. Toda integración a `develop`, `staging` o `main` pasa por PR con `pnpm run verify` en verde (hook pre-push) y, en los PR de release, también en WSL/Linux.
- Licencia MIT (decisión abierta: cámbiala si piensas monetizar).

## Arquitectura

Son dos mitades que se comunican por mensajes. La **extensión** (Node, con acceso a la API `vscode` y a la terminal) y el **webview** (React + Vite, solo UI, sin acceso a la terminal). Viniendo de MERN, piensa en el webview como el cliente React y en la extensión como un backend Express cuyas "rutas" son tipos de mensaje.

**Stack**

- Extensión: TypeScript + esbuild. Registra un `WebviewViewProvider` en una vista propia de la Activity Bar.
- Webview: React + Vite + TypeScript. El estado de navegación vive en React y se persiste con `vscode.setState()`.
- Datos: JSON por categoría dentro de `catalog/`, validado con Ajv en los tests unitarios (`pnpm run verify`).
- Tests: Vitest para la lógica pura y `@vscode/test-electron` para la integración.

**Estructura de carpetas**

```
devcommands/
├── .githooks/pre-push        # ejecuta pnpm run verify antes de cada push
├── scripts/verify.mjs        # verificación: typecheck, lint, tests, build
├── openspec/                 # specs, changes y config.yaml
├── catalog/
│   ├── schema.json           # JSON Schema del catálogo
│   ├── git.json
│   ├── npm.json
│   └── docker.json
├── src/                      # extensión (Node)
│   ├── extension.ts          # activate / deactivate
│   ├── views/CommandsViewProvider.ts
│   ├── terminal/TerminalService.ts
│   ├── catalog/CatalogService.ts
│   └── messaging/protocol.ts # tipos compartidos de mensajes
├── webview-ui/               # React + Vite
│   └── src/{App.tsx, views/, components/, vscode.ts}
├── test/
└── package.json
```

**Modelo de un comando**

```json
{
  "id": "git.new-branch",
  "title": { "en": "Create and switch branch", "es": "Crear rama y cambiarse" },
  "description": {
    "en": "Creates a new branch from the current one",
    "es": "Crea una rama nueva desde la actual"
  },
  "command": "git checkout -b ${branch}",
  "params": [{
    "name": "branch",
    "label": { "en": "Branch name", "es": "Nombre de la rama" },
    "placeholder": { "en": "feature/my-change", "es": "feature/mi-cambio" }
  }],
  "tags": { "en": ["branch", "checkout"], "es": ["rama", "crear"] },
  "risk": "safe",
  "shells": { "powershell": "git checkout -b ${branch}" },
  "docs": "https://git-scm.com/docs/git-checkout"
}
```

Todo texto visible es `{ en, es }` con ambos idiomas obligatorios (fallback a `en`). `risk` acepta `safe`, `caution` o `destructive` y es obligatorio. `command` es la variante POSIX; `shells` (`bash`, `zsh`, `powershell`, `cmd`) es opcional y solo se usa cuando la variante cambia según el shell. No hay campo de ejemplo: se calcula sustituyendo cada `${x}` por su `placeholder` en el idioma activo. El formato completo está en `catalog/schema.json` y la guía en `catalog/README.md`.

**Flujo de un clic**

1. El webview envía `{ type: "sendToTerminal", commandId, params }`.
2. La extensión valida el mensaje y busca el comando por `id` en el catálogo.
3. Si es `destructive`, muestra `showWarningMessage` con confirmación modal.
4. Interpola y escapa los parámetros según el shell.
5. `TerminalService` toma la terminal activa (o crea "DevCommands"), llama a `show()` y luego a `sendText(cmd, false)`.
6. Guarda el comando en el historial (`globalState`) y responde `{ type: "sent" }` al webview.

## Flujo de ramas Git

Es un Git Flow simplificado: todo el trabajo nace en `develop`, se valida en `staging` y solo llega a `main` con un tag de versión que dispara la publicación.

&#91;embedded content: flujo de ramas · feature → develop → staging → main\]

Los hotfix son la única excepción: salen de `main` y después se fusionan de vuelta en `develop` para no perder el arreglo.

| Rama | Sale de | Se fusiona en | Verificación (local) |
| --- | --- | --- | --- |
| `feature/<change>` | `develop` | `develop` (PR, squash) | `pnpm run verify` (hook pre-push) |
| `develop` | — | `staging` (PR de release al cerrar una fase) | `verify` en Windows + `verify` en WSL/Linux |
| `staging` | — | `main` (PR) | + `vsce package --no-dependencies` en local y prueba manual del `.vsix`; opcional `vsce publish --pre-release` |
| `main` | — | — | tras crear el tag `vX.Y.Z`: publicación manual con `vsce publish --no-dependencies` y `ovsx publish` |
| `hotfix/<bug>` | `main` | `main` y `develop` | `verify` en Windows + `verify` en WSL/Linux |

**Convenciones**

- **Una rama por change de OpenSpec**, con el mismo nombre: `/opsx:propose add-favorites` → `feature/add-favorites`. Ejecuta `/opsx:archive` antes de abrir el PR a `develop`, así las specs de `develop` siempre reflejan el código.
- **Conventional Commits:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. Permiten generar el CHANGELOG automáticamente (por ejemplo con release-please).
- **SemVer:** `0.x` mientras dure el MVP, `1.0.0` al publicar la v1.
- Nunca hagas commits directos en `develop`, `staging` ni `main`.

## Setup desde la carpeta vacía

Son ocho pasos, unos 30 minutos. Al terminar tendrás el repo con las tres ramas, la extensión de ejemplo funcionando con F5 y OpenSpec listo para la primera propuesta.

1. **Prerrequisitos.** Node 24 LTS (ver `.nvmrc`), pnpm 11+ (`npm i -g pnpm` o Volta), Git y VS Code. Verifícalo con `node -v`, `pnpm -v` y `git --version`. Tras clonar, `pnpm install` instala las dos mitades y activa el hook pre-push.
2. **Generar la extensión** dentro de tu carpeta:

   ```bash
   cd devcommands
   npx --package yo --package generator-code -- yo code .
   ```

   Elige *New Extension (TypeScript)*, bundler **esbuild** y el gestor que uses (npm o pnpm). Cuando pregunte si inicializa Git, responde **no**: lo haremos nosotros. Si el generador no acepta `.`, ejecútalo desde la carpeta padre con el identificador `devcommands`.
3. **Probar el esqueleto.** Abre la carpeta en VS Code, presiona F5 y ejecuta "Hello World" desde la paleta de la ventana nueva.
4. **Crear el webview:**

   ```bash
   pnpm create vite webview-ui --template react-ts
   pnpm install   # desde la raíz: webview-ui es parte del workspace (pnpm-workspace.yaml)
   ```

   Configura en `webview-ui/vite.config.ts` un `build.outDir` hacia `../dist/webview` con nombres de archivo fijos (sin hash) para poder referenciarlos desde la extensión.
5. **Instalar e inicializar OpenSpec:**

   ```bash
   npm install -g @fission-ai/openspec@latest
   openspec init
   ```

   Selecciona tu asistente de IA (Claude Code, Cursor, Copilot…). Esto crea `openspec/` y los skills para los comandos `/opsx:*`. Si quieres los artefactos en español, OpenSpec 1.10+ trae la opción `--language` en `init`. Los encabezados y las palabras SHALL/MUST quedan en inglés para que las specs sigan validando; confirma el valor exacto con `openspec init --help`.
6. **Escribir `openspec/config.yaml`** con las restricciones:

   ```yaml
   schema: spec-driven
   
   context: |
     Proyecto: DevCommands, extensión de VS Code que muestra comandos
     de desarrollo por categoría y los escribe en la terminal.
     Stack: TypeScript strict, esbuild (extensión), React + Vite (webview),
     Vitest y @vscode/test-electron. engines.vscode ^1.90.0, solo API estable.
     Catálogo de comandos en catalog/*.json validado con catalog/schema.json.
     Ramas: feature/* -> develop -> staging -> main. Conventional Commits.
   
   rules:
     proposal:
       - Declarar en qué fase del roadmap (MVP, v1, v2) cae el cambio.
     design:
       - Justificar toda dependencia de runtime nueva.
       - Describir los mensajes webview<->extensión afectados.
     specs:
       - Incluir escenarios para Windows/PowerShell y bash.
     tasks:
       - Incluir tareas de tests y de actualización del CHANGELOG.
       - Nunca ejecutar comandos en la terminal automáticamente; usar sendText(cmd, false).
       - Webview con CSP estricta y nonce; validar todo mensaje entrante.
   ```
7. **Git y ramas:**

   ```bash
   git init -b main
   git add . && git commit -m "chore: scaffold extension, webview and openspec"
   git branch staging && git branch develop
   git remote add origin git@github.com:<tu-usuario>/devcommands.git
   git push -u origin main staging develop
   git switch develop
   ```
8. **Proteger las ramas en GitHub.** En *Settings → Rulesets* protege `main`, `staging` y `develop`: exige PR y bloquea el borrado y el force push. Deja `main` como rama por defecto. No hay check de CI obligatorio: la verificación es local (`pnpm run verify` en el hook pre-push).

## Roadmap por fases

Son cuatro fases sin fechas fijas. Cada nombre dentro de una fase es un change de OpenSpec y una rama `feature/` con el mismo nombre, y se ejecutan en el orden de la lista.

El orden sigue las dependencias: cada change usa lo que dejó el anterior. Las funcionalidades vienen de la tabla de [Funcionalidades](#funcionalidades).

### Fase 0: Base lista

| # | Change | Qué entrega | Estado |
| --- | --- | --- | --- |
| 0.1 | `catalog-schema` | Formato del catálogo bilingüe, JSON Schema, `CatalogService` y semilla Git | ✅ |
| 0.2 | `ci-setup` | Verificación local obligatoria: `pnpm run verify` + hook pre-push, WSL antes de cada release. Migración a pnpm (workspace, `allowBuilds`), `.nvmrc`, `.gitattributes` y build completo con el webview | ✅ |
| 0.3 | `webview-shell` | Vista propia en la Activity Bar con `WebviewViewProvider`, el webview de React cargado con CSP + `nonce`, protocolo de mensajes tipado y validado (`protocol.ts`) y activación perezosa por vista. Se elimina el Hello World | |

### Fase 1: v0.1.0 pre-release (MVP)

| # | Change | Qué entrega |
| --- | --- | --- |
| 1.1 | `ui-i18n` | Infraestructura de traducción de la interfaz (`vscode.l10n` + diccionario del webview) para que todas las vistas nazcan bilingües |
| 1.2 | `category-view` | Tarjetas de categoría desde el catálogo (mensaje `catalog`), con Codicons, tema de VS Code, teclado y ARIA |
| 1.3 | `command-list` | Lista de comandos de una categoría: título, descripción y ejemplo. Navegación atrás y estado persistido con `setState` |
| 1.4 | `send-to-terminal` | `TerminalService`: terminal activa o "DevCommands", `sendText(cmd, false)`. El webview solo envía el `commandId` |
| 1.5 | `copy-to-clipboard` | Botón secundario para copiar el comando |
| 1.6 | `global-search` | Filtro por título, descripción y tags en los dos idiomas sobre todas las categorías |
| 1.7 | `catalog-content` | Al menos 5 categorías con 15 comandos cada una (Git, npm/pnpm, Node, Docker, Linux/Bash o PowerShell) |
| 1.8 | `release-pipeline` | Script local `pnpm run release:package`: `vsce package --no-dependencies` y control de menos de 2 MB. Pruebas manuales del `.vsix` en PowerShell y en WSL/Linux |

### Fase 2: v1.0.0 pública

| # | Change | Qué entrega |
| --- | --- | --- |
| 2.1 | `shell-detection` | Detecta el shell y el SO de la terminal y usa la variante `shells.*` correcta |
| 2.2 | `command-params` | Plantillas `${x}`: InputBox o formulario para los valores, con escapado según el shell |
| 2.3 | `risk-confirmation` | Etiqueta de riesgo visible y confirmación modal en los comandos `destructive` |
| 2.4 | `favorites` | Estrella por comando y sección "Favoritos" al inicio |
| 2.5 | `recent-history` | Últimos 20 comandos enviados (`globalState`) |
| 2.6 | `custom-commands` | Comandos y categorías propios, validados con las mismas reglas del catálogo |
| 2.7 | `project-detection` | Sugiere primero las categorías del proyecto (`package.json`, `Dockerfile`, `prisma/`) |
| 2.8 | `quick-pick` | `Ctrl+Shift+P` → "DevCommands: Buscar" sin abrir el panel |
| 2.9 | `marketplace-release` | Nombre definitivo, publisher, README con capturas, icono y publicación manual en el Marketplace (`vsce publish --no-dependencies`) y Open VSX (`ovsx publish`) tras crear el tag `vX.Y.Z` |

### Fase 3: v2.x

Cada change sale en su propia versión menor y el orden puede cambiar según el feedback de la v1.

| # | Change | Qué entrega |
| --- | --- | --- |
| 3.1 | `project-scripts` | Los `scripts` de `package.json` como categoría automática |
| 3.2 | `docs-links` | Enlace a la documentación oficial de cada comando (el campo `docs` ya existe) |
| 3.3 | `workflows` | Secuencias de varios comandos con un clic |
| 3.4 | `importable-packs` | Exportar e importar colecciones en JSON |

Decisiones que hay que tomar antes del change que las necesita:
- **Antes de `custom-commands` (2.6):** guardar en `settings.json` o en `.devcommands.json` por proyecto.
- **Antes de `marketplace-release` (2.9):** nombre definitivo, publisher y licencia.

Una fase se cierra con un PR de release `develop → staging`. Antes de abrirlo, verifica en Linux desde WSL, con el repo clonado dentro de `~/` (no en `/mnt/c`, porque los binarios de esbuild, rollup y oxlint son distintos por SO):

```bash
git fetch && git checkout develop && git pull
pnpm install --frozen-lockfile
xvfb-run -a pnpm run verify
```

Requisitos únicos en WSL: Node 24, pnpm y `xvfb` con las librerías de VS Code (ver `openspec/specs/continuous-integration/`). La release pasa a `main` cuando cumple su puerta:

- **Fase 0 → Base lista:** verificación local obligatoria antes de cada push (`pnpm run verify`: lint, tests y build). El webview de React carga dentro de la vista lateral. El catálogo valida contra `schema.json`.
- **Fase 1 → v0.1.0 pre-release:** de categoría a comando en la terminal en 3 clics o menos, probado en Windows (PowerShell) y en WSL o Linux (bash). Al menos 5 categorías con 15 comandos cada una. El `.vsix` pesa menos de 2 MB.
- **Fase 2 → v1.0.0 pública:** parámetros, favoritos y comandos propios funcionan. Los comandos destructivos piden confirmación. Publicada en el Marketplace y en Open VSX con README, capturas y CHANGELOG.
- **Fase 3 → v2.x:** se publica por features, sin una puerta grande. Cada change sale en su propia versión menor.

**Ciclo de cada change**

1. `git switch develop && git pull && git switch -c feature/<change>`
2. `/opsx:explore` (opcional) y después `/opsx:propose <change>`. Revisa a mano `proposal.md`, `specs/`, `design.md` y `tasks.md` antes de seguir.
3. `/opsx:apply`: la IA implementa y marca las tareas. Tú revisas el diff y pruebas con F5.
4. `/opsx:archive`: las specs delta se fusionan en `openspec/specs/`.
5. `git push` (el hook ejecuta `pnpm run verify`; si falla, el push no sale) y PR a `develop` con squash merge.

## Siguientes pasos inmediatos

- [x] Completar los pasos 1 al 8 del setup
- [x] `catalog-schema` (0.1) fusionado en `develop`
- [x] `ci-setup` (0.2): verificación local con hook pre-push y migración a pnpm
- [ ] `webview-shell` (0.3) y PR de release `develop → staging` para cerrar la Fase 0
- [ ] Elegir el nombre definitivo y comprobar que no esté tomado en el Marketplace ni en Open VSX (antes de 2.9)
- [ ] Crear el publisher en el Marketplace (puede ser `aguilar-digital`) (antes de 2.9)

Preguntas abiertas: la licencia (MIT o propietaria) y si los comandos personalizados se guardan en `settings.json` o en un archivo `.devcommands.json` por proyecto.

## Fuentes

- [OpenSpec — Getting Started](https://openspec.dev/docs/getting-started)
- [OpenSpec — OPSX Workflow](https://openspec.dev/docs/opsx)
- [OpenSpec — CLI Reference](https://lzw.me/docs/openspec/en/cli.html)
- [OpenSpec — notas de versión (v1.10–v1.12)](https://releasebot.io/updates/fission-ai)
