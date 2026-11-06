## Context

- **Bundle:** `src/catalog/index.ts` importa los 6 `catalog/*.json`, y esbuild los mete en `dist/extension.js`. Al cargar la extensión se evalúan enteros, con sus 11 idiomas. `catalog/**` está excluido del `.vsix` y `dist/**` incluido.
- **`CatalogService`:** recibe el catálogo en el constructor, ordenado por `order` e `id`. Es síncrono y lo usan el proveedor de la vista, el buscador de la paleta, los parámetros, la confirmación de destructivos, los favoritos y el historial.
- **Activación:** desde la 2.10 la extensión se activa con `onStartupFinished`. `activate()` crea `CatalogService`, y `registerCustomCommands()` llama a `setCustomCategories()` en ese momento.
- **Webview:** `homeSections()` (`navigation.ts`) divide las categorías en "detectadas" y "resto", y `CategoryList` las pinta como una lista con foco itinerante. La navegación se guarda con `setState()`.
- **Empaquetado:** `scripts/release-check.mjs` ya limita el `.vsix` a menos de 2 MB y define la lista de archivos permitidos dentro del paquete.

## Goals / Non-Goals

**Goals:**
- Ningún acceso al catálogo durante la activación.
- La API síncrona de `CatalogService` se mantiene. La primera consulta lee los archivos (`readFileSync`) y los guarda en memoria.
- Secciones plegables accesibles, con el mismo modelo de foco itinerante que hoy.

**Non-Goals:**
- Añadir contenido. Lo harán los lotes 3.3 a 3.14.
- Enviar al webview solo parte del catálogo. Con un idioma y un shell, 70 categorías son unos 300 a 400 KB, aceptable para un `postMessage`.
- Cambiar la búsqueda: sigue sobre todos los comandos.

## Decisions

### 1. Archivos en `dist/catalog/` y cargador síncrono perezoso

`esbuild.js` copia `catalog/*.json`, salvo `schema.json`, a `dist/catalog/` en cada build. En modo watch los vuelve a copiar en cada `onEnd`. Antes de copiar vacía `dist/catalog/`, para que una categoría borrada no quede en el paquete.

`src/catalog/load.ts` exporta `loadCatalogDir(dir, fs)`:
- lee todos los `*.json` de la carpeta, salvo `schema.json`, en orden alfabético;
- los parsea y devuelve `Catalog`;
- un error de lectura o de JSON lanza una excepción que nombra el archivo.

`CatalogService` recibe un `Catalog` o una función `() => Catalog`:
- `getCategories()` y `getCommand()` cargan la primera vez;
- `setCustomCategories()` guarda las propias sin cargar el catálogo y lo combina al consultar;
- `onDidChange` no cambia.

En la extensión, el cargador es `() => loadCatalogDir(join(extensionPath, 'dist', 'catalog'))`.

Los tests usan el mismo cargador sobre `catalog/` y comparan con `dist/catalog/` en el test de empaquetado. `src/catalog/index.ts` y su `bundledCatalog` desaparecen. `test/unit/catalog/*` pasa a usar `loadCatalogDir('catalog')`.

**Alternativas descartadas:**
- **Mantener el bundle y cargar perezosamente con `require()` dinámico:** esbuild mete igualmente todo en el archivo, así que no cambia el coste de parsear.
- **Lectura asíncrona:** obligaría a hacer asíncronos `getCommand` y sus usuarios (la confirmación, los favoritos y el historial). Leer unos 70 archivos pequeños de forma síncrona, una vez y tras una acción del usuario, cuesta unos milisegundos.
- **Un único `catalog.json` generado:** se pierde la correspondencia uno a uno con `catalog/*.json`, y el test de "categoría no empaquetada" tendría que comparar contenidos.

### 2. `section` en el schema, el tipo y el resumen

`catalog/schema.json` añade `section` como obligatorio, con un `enum` de 10 valores. `src/catalog/types.ts` define:

```ts
type SectionId = 'languages' | 'vcs' | 'frameworks' | 'databases' | 'infra' | 'cloud' | 'servers' | 'quality' | 'gamedev' | 'tools' | 'custom'
```

`custom` solo se usa en las categorías propias: lo asigna `custom.ts` y el schema no lo acepta. `CategorySummary` añade `section` y el mensaje `catalog` lo lleva. El orden de las secciones es una constante compartida `SECTION_ORDER`, junto al protocolo, para que el webview la importe como tipo y valor.

### 3. Agrupación y estado en `navigation.ts`

`homeSections(categories, detected)` pasa a devolver:

```ts
{ detected: CategorySummary[], sections: { id: SectionId, categories: CategorySummary[] }[] }
```

Las secciones van en el orden de `SECTION_ORDER`, sin las vacías y sin las categorías detectadas.

El estado de las secciones desplegadas se guarda junto a la vista: el objeto de `setState` pasa a ser `{ view, expanded: string[] }`.
- `parseSavedState()` acepta también el formato anterior, que era solo la vista, para no perder la navegación al actualizar la extensión.
- Sin estado guardado, `expanded` es `['project']`.
- Un id de sección desconocido se ignora.

### 4. `CategoryList` con encabezados en la lista itinerante

La lista plana de entradas del foco itinerante pasa a ser:
- las tarjetas;
- por cada sección, su encabezado y, si está desplegada, sus categorías.

Cada entrada lleva su tipo (`card`, `header` o `category`) y su sección. El `onKeyDown` de `useRovingFocus` se envuelve para tratar → y ← según el tipo de entrada; ↑, ↓, Inicio y Fin no cambian.

Cada encabezado es un `<button aria-expanded aria-controls>`. Sus categorías van en un `<ul aria-labelledby>` que solo se monta si la sección está desplegada.

El texto del encabezado es "Nombre" más "N categorías", con plural, usando la misma infraestructura de plurales que `commandCount`. Los indicadores ▸/▾ son Codicons (`chevron-right` y `chevron-down`), con `aria-hidden`.

Se descartó usar `<details>`/`<summary>`: su comportamiento de foco y teclado varía y no encaja con el foco itinerante.

### 5. Textos nuevos

En los 11 diccionarios se añaden:
- 12 claves de nombre de sección: `section.project`, las 10 del catálogo y `section.custom`;
- `categoryCount`, con plurales.

La clave `allCategories` ("Todas") desaparece.

## Risks / Trade-offs

- **`dist/catalog/` desactualizado en desarrollo** → el build y el watch lo regeneran. El test de empaquetado compara `dist/catalog/` con `catalog/` tras `pnpm run package`.
- **Lectura síncrona en el primer uso** → con 6 archivos es despreciable. Con 70, unos 3 MB con los 11 idiomas, se espera menos de 50 ms una sola vez. Un test unitario mide la carga del catálogo real y avisa si supera 200 ms.
- **Usuarios que verán todo plegado** al abrir la vista por primera vez si su proyecto no se detecta → los encabezados muestran cuántas categorías hay y el buscador sigue a la vista.
- **Estado guardado de versiones anteriores** → `parseSavedState()` lo migra, y un test cubre los dos formatos.
