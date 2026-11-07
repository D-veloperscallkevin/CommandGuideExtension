## Context

Las 41 categorías actuales están en las secciones `vcs`, `languages`, `infra` y `tools`. La sección `frameworks` ya existe:
- está en `SECTION_ORDER` (`src/catalog/types.ts`), justo después de `vcs`;
- está en el enum `section` de `catalog/schema.json`;
- tiene la etiqueta `sectionFrameworks` en los 11 idiomas del webview.

Todavía no tiene ninguna categoría.

Hay dos detalles del código actual que afectan al diseño:
- `CatalogService` ordena todas las categorías por `order` y después por `id`, sin tener en cuenta la sección. El panel las agrupa después por sección.
- La detección (`project-detection`) solo mira los nombres de los archivos de la raíz. No lee `package.json`.

`test/unit/catalog/content.test.ts` usa una constante `MIN_COMMANDS = 15` para todas las categorías.

## Goals / Non-Goals

**Goals:**
- Siete categorías de frontend con los comandos reales de cada CLI, comprobados en su documentación actual (Next.js 16, Nuxt 4, Svelte CLI `sv`).
- Un mínimo de comandos por sección, con 8 para `frameworks`.
- La misma forma de escribir los comandos JavaScript en todos los frameworks: npm/npx, con un aviso de los equivalentes.

**Non-Goals:**
- Variantes por gestor de paquetes, o detectar el gestor para elegir el comando.
- Leer `package.json` para detectar frameworks.
- Backend, móvil, escritorio, ORM y monorepos: son las partes 3.7b–3.7d.
- React a secas: no tiene CLI propia. Se crea con Vite (`npm create vite@latest`) o con Next.js.

## Decisions

### 1. Identificadores, orden, iconos y detección

| id | Título | order | icon | detect |
| --- | --- | --- | --- | --- |
| `vite` | Vite | 100 | `wand` | `vite.config.*` |
| `nextjs` | Next.js | 102 | `triangle-up` | `next.config.*` |
| `angular` | Angular | 104 | `shield` | `angular.json` |
| `vue` | Vue | 106 | `symbol-color` | `vue.config.js`, `*.vue` |
| `astro` | Astro | 108 | `star-full` | `astro.config.*` |
| `nuxt` | Nuxt | 110 | `layers` | `nuxt.config.*`, `.nuxtrc` |
| `sveltekit` | SvelteKit | 112 | `record` | `svelte.config.*` |

- Los títulos son nombres propios y no se traducen.
- Los `order` empiezan en 100 para que los frameworks queden detrás de todas las categorías existentes en la lista plana (Perl está en 84) y dejen hueco para las partes 3.7b–3.7d (114 en adelante).
- Los siete iconos existen en el `codicon.csv` de `@vscode/codicons` y ninguna otra categoría los usa.

Alternativa descartada: detectar por las dependencias de `package.json`. Sería más preciso para Vue, pero obliga a leer y parsear archivos, y hoy la detección es solo por nombres. Lo dejo para un change propio si hace falta.

Consecuencias:
- Un proyecto Vue creado con `npm create vue@latest` tiene `vite.config.ts` y ningún `.vue` en la raíz, así que se detecta como Vite. Es aceptable: Vite es su herramienta de compilación, y la categoría Vue está en el panel.
- Un proyecto SvelteKit detecta `sveltekit` y `vite`, porque también tiene `vite.config.*`. Es correcto, porque usa Vite.

### 2. Mínimo por sección

`MIN_COMMANDS` pasa a ser una función de la sección: 8 si la sección es `frameworks` y 15 en las demás.

El mensaje de error del test sigue nombrando la categoría y su número de comandos.

Alternativa descartada: rellenar hasta 15 con variantes de un mismo comando (`vite --port`, `vite --host`, `vite --open`…). Añade ruido y no aporta.

### 3. npm/npx con aviso de pnpm, Yarn y Bun

| Uso | Forma |
| --- | --- |
| Crear un proyecto | `npm create <x>@latest` |
| CLI instalada en el proyecto | `npx <cli> …` |
| Angular CLI | se instala globalmente con `npm install -g @angular/cli`, y después se usa `ng …` como indica su documentación |

Cada descripción que empieza por `npx` termina con la frase común "Con pnpm, Yarn o Bun: pnpm dlx, yarn dlx o bunx" en los 11 idiomas. Las que empiezan por `npm create` terminan con "Con pnpm, Yarn o Bun: pnpm create, yarn create o bun create".

El generador lo añade con una función `withNote`, igual que los avisos de las versiones anteriores, y un test lo comprueba en todos los comandos de `frameworks`.

`npm`, `npx` y `ng` funcionan igual en bash, zsh, PowerShell y cmd. No hacen falta variantes por shell.

### 4. Comandos

Están comprobados en Context7: Next.js v16.2, Nuxt v4.1 y Svelte CLI. En la implementación se repasan los de Vite, Angular, Vue y Astro con su documentación oficial.

| Categoría | Comandos |
| --- | --- |
| **Vite** (9) | `npm create vite@latest`, `npx vite`, `npx vite --host`, `npx vite --port ${port}`, `npx vite build`, `npx vite build --watch`, `npx vite preview`, `npx vite --force` (vuelve a optimizar las dependencias), `npx vite build --mode ${mode}` |
| **Next.js** (9) | `npx create-next-app@latest`, `npx next dev`, `npx next dev --port ${port}`, `npx next build`, `npx next start`, `npx next info`, `npx next typegen`, `npx next upgrade` (caution), `npx next telemetry disable` |
| **Angular** (17) | `npm install -g @angular/cli`, `ng new ${name}`, `ng serve`, `ng serve --open`, `ng build`, `ng test`, `ng e2e`, `ng lint`, `ng generate component ${name}`, `ng generate service ${name}`, `ng generate guard ${name}`, `ng generate pipe ${name}`, `ng add ${package}` (caution), `ng update` (sin argumentos: solo lista lo que se puede actualizar), `ng update @angular/core @angular/cli` (caution), `ng version`, `ng analytics disable` |
| **Vue** (9) | `npm create vue@latest`, `npx vite`, `npx vite build`, `npx vite preview`, `npx vue-tsc --noEmit`, `npx vitest`, `npx eslint .`, `npx vite --open`, `npm install pinia` (estado) |
| **Astro** (10) | `npm create astro@latest`, `npx astro dev`, `npx astro build`, `npx astro preview`, `npx astro check`, `npx astro add ${integration}` (caution), `npx astro sync`, `npx astro info`, `npx astro telemetry disable`, `npx @astrojs/upgrade` (caution) |
| **Nuxt** (11) | `npm create nuxt@latest`, `npx nuxt dev`, `npx nuxt build`, `npx nuxt generate`, `npx nuxt preview`, `npx nuxt typecheck`, `npx nuxt add page ${name}`, `npx nuxt module add ${module}` (caution), `npx nuxt upgrade` (caution), `npx nuxt cleanup` (destructive), `npx nuxt info` |
| **SvelteKit** (9) | `npx sv create`, `npx vite dev`, `npx vite build`, `npx vite preview`, `npx svelte-kit sync`, `npx sv check`, `npx sv add ${addon}` (caution), `npx sv migrate ${migration}` (caution), `npx vite dev --open` |

**Parámetros nuevos del generador:** `port` (`5173`), `mode` (`staging`), `integration` (`react`), `addon` (`tailwindcss`) y `migration` (`svelte-5`). Se reutilizan `name`, `package` y `module`.

### 5. Riesgo

- **`caution`:** lo que actualiza dependencias, migra código o añade integraciones modificando archivos de configuración:
  - `ng add`, `ng update @angular/core @angular/cli`;
  - `next upgrade`, `astro add`, `@astrojs/upgrade`;
  - `nuxt module add`, `nuxt upgrade`;
  - `sv add`, `sv migrate`.
- **`destructive`:** `nuxt cleanup`, que borra `.nuxt`, `.output`, `node_modules/.vite` y `node_modules/.cache`.
- **`safe`:** el resto. Crear un proyecto nuevo es `safe` porque pregunta la carpeta y no toca el proyecto actual.

## Risks / Trade-offs

- **Las CLI de frontend cambian rápido.** Por ejemplo, Next.js 16 eliminó `next lint` y Nuxt pasó de `nuxi` a `nuxt`. Mitigación:
  - cada comando lleva `docs` a la página oficial;
  - un test comprueba que `nextjs` no usa `next lint`.
- **Quien usa pnpm verá `npx`.** Mitigación: el aviso de la descripción y la búsqueda (`dlx`, `bunx` van en los tags).
- **La detección de Vue es pobre**, por la decisión 1.
