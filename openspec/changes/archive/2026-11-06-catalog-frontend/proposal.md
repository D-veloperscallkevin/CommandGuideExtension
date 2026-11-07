## Why

La sección "Frameworks" del panel existe en el schema, pero no tiene ninguna categoría. Quien trabaja con Vite, Next.js, Angular, Vue, Astro, Nuxt o SvelteKit no encuentra los comandos para crear el proyecto, arrancarlo, compilarlo o añadirle integraciones.

Fase del roadmap: **Fase 3 (v1.x)**, change 3.7a `catalog-frontend`. Es la primera de las cuatro partes de la 3.7:

| Parte | Change |
| --- | --- |
| 3.7a | `catalog-frontend` |
| 3.7b | `catalog-backend` |
| 3.7c | `catalog-mobile-desktop` |
| 3.7d | `catalog-orm-monorepo` |

## What Changes

- **Siete categorías nuevas** en la sección `frameworks`: `vite`, `nextjs`, `angular`, `vue`, `astro`, `nuxt` y `sveltekit`. Todos los comandos se traducen a los 11 idiomas y llevan enlace `docs`.
- **Mínimo por sección:** las categorías de `frameworks` necesitan al menos **8** comandos; las demás siguen en 15. Los frameworks tienen menos comandos propios que un lenguaje o un gestor de paquetes.
- **npm con aviso:**
  - para crear proyectos se usa `npm create …`, y para las CLI del proyecto, `npx …`;
  - la descripción de cada uno indica el equivalente con pnpm, Yarn y Bun;
  - no hay variantes por gestor de paquetes.
- **Next.js 16:** no se incluye `next lint`, que se eliminó. Turbopack ya es el predeterminado, así que no se usa `--turbopack`.
- **Nuxt 4:** se usa `npx nuxt …`, la forma actual de la documentación, en vez de `nuxi`.
- **Señales `detect`** (por nombre de archivo, sin leer `package.json`):

  | Señales | Categoría |
  | --- | --- |
  | `vite.config.*` | `vite` |
  | `next.config.*` | `nextjs` |
  | `angular.json` | `angular` |
  | `vue.config.js`, `*.vue` | `vue` |
  | `astro.config.*` | `astro` |
  | `nuxt.config.*`, `.nuxtrc` | `nuxt` |
  | `svelte.config.*` | `sveltekit` |

- **Riesgo:**
  - **`caution`:** lo que actualiza o migra el proyecto, o añade integraciones cambiando su configuración (`ng update`, `ng add`, `astro add`, `nuxt upgrade`, `nuxt module add`, `sv add`, `sv migrate`, `next upgrade`);
  - **`destructive`:** lo que borra cachés o salidas generadas (`nuxt cleanup`).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- **`command-catalog`:** el requisito "Contenido mínimo del catálogo empaquetado" cambia en tres puntos:
  - el mínimo es de 8 comandos en `frameworks` y de 15 en el resto;
  - añade las 7 categorías nuevas;
  - añade la regla de npm/npx con aviso y las reglas de riesgo de los frameworks.
- **`project-detection`:** el requisito "Señales del proyecto" añade los archivos de configuración de los 7 frameworks y aclara que un `package.json` solo no detecta ningún framework.

## Impact

- **Catálogo:** se añaden siete archivos `catalog/<id>.json`.
- **Tests:**
  - `test/unit/catalog/content.test.ts`: mínimo por sección, orden, aviso de npx y riesgo;
  - `test/unit/project/detect.test.ts`: escenarios de detección;
  - `src/test/extension.test.ts`: lista de categorías.
- **Docs:**
  - README: herramientas incluidas y tabla de señales;
  - CHANGELOG;
  - ROADMAP: se divide la 3.7 en 3.7a–3.7d y se marca la 3.7a con ✅.
- **Sin cambios:** código de la extensión y del webview, schema y dependencias. La sección `frameworks` ya existe en `SECTION_ORDER` y en las traducciones.
- **Tamaño:** unos 25 KB más en el `.vsix`.
