# Design

## Context

- `src/catalog/types.ts`: `Locale = 'en' | 'es'`, y `LocalizedString` y `LocalizedTags` son `Record<Locale, …>`.
- `catalog/schema.json`: `LocalizedString` y `LocalizedTags` exigen exactamente `en` y `es`, con `additionalProperties: false`.
- `src/catalog/CatalogService.ts`: `resolveLocale` devuelve `es` si el idioma empieza por "es" y `en` en cualquier otro caso. `localize(text, locale)` es `text[locale]`. `buildExample` usa `localize` para los placeholders.
- `src/views/CommandsViewProvider.ts` ya envía `init.locale` (de `resolveLocale(vscode.env.language)`) y pone `<html lang>`.
- `webview-ui/src/App.tsx` tiene dos textos en inglés escritos a mano ("Loading…" y "Commands coming soon.").
- `package.json`: `description` en español, sin `l10n` ni `package.nls.json`. `displayName`, el título del contenedor y el nombre de la vista son "DevCommands" (marca, no se traduce).
- `vscode.l10n.t(message, args)` busca `message` en `bundle.l10n.<env.language>.json` del directorio indicado por `"l10n"` en el manifiesto. Para inglés no carga bundle y devuelve el texto fuente.

## Goals / Non-Goals

**Goals:**
- Un único sitio donde se declaran los 11 idiomas, del que dependen tipos, schema, resolución y diccionarios.
- Que un texto sin traducir no pueda llegar a `develop`: lo detectan la compilación o los tests.
- Compatibilidad total con los JSON del catálogo existentes.

**Non-Goals:**
- Traducir el contenido actual del catálogo a los 9 idiomas opcionales.
- Elegir un idioma distinto al de VS Code.
- Formatos de fecha o número y plurales complejos. Si hacen falta, se añaden con `Intl` cuando aparezcan.

## Decisions

### D1. Lista de idiomas (`src/i18n/locales.ts`)
```ts
export const SUPPORTED_LOCALES = ['en','es','pt-br','fr','de','it','ja','ko','zh-cn','zh-tw','ru'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const REQUIRED_CATALOG_LOCALES = ['en','es'] as const;
export function resolveLocale(language: string): Locale;
```
- `src/catalog/types.ts` reexporta `Locale` desde aquí. `resolveLocale` se mueve aquí y `CatalogService` la reexporta para no romper importaciones.
- Archivo puro, sin `vscode`: lo usan la extensión, los tests y, solo como tipo, el webview.

### D2. Resolución del idioma
1. Normaliza: minúsculas y `_` → `-`.
2. Si es un idioma soportado, lo devuelve.
3. Si el idioma base es `zh`: devuelve `zh-tw` si alguna subetiqueta es `tw`, `hk`, `mo` o `hant`, y si no `zh-cn`.
4. Si el idioma base es `pt`, devuelve `pt-br`. Es el único portugués con paquete de idioma oficial de VS Code.
5. Si el idioma base está soportado (`es-419` → `es`, `de-ch` → `de`), lo devuelve.
6. Si no, `en`.

### D3. Tipos y schema del catálogo
```ts
type Required = (typeof REQUIRED_CATALOG_LOCALES)[number];          // 'en' | 'es'
export type LocalizedString = Readonly<Record<Required, string> & Partial<Record<Locale, string>>>;
export type LocalizedTags = Readonly<Record<Required, readonly string[]> & Partial<Record<Locale, readonly string[]>>>;
```
- `catalog/schema.json`: `LocalizedString.properties` declara los 11 idiomas (`minLength: 1`), `required: ["en","es"]` y `additionalProperties: false`. Igual para `LocalizedTags`. Un test comprueba que las propiedades del schema coinciden con `SUPPORTED_LOCALES`, para que no se desincronicen.
- Los JSON existentes solo tienen `en` y `es`, así que siguen siendo válidos.

### D4. Fallback por campo
- `localize(text, locale)` devuelve `text[locale] ?? text.en`. `buildExample` ya pasa por `localize`, así que hereda el fallback.
- Para tags se añade `localizeTags(tags, locale)` con el mismo fallback. La búsqueda (1.6) decidirá si busca en el idioma activo más el inglés.

### D5. Manifiesto
- `package.json`: `"description": "%description%"`. `displayName`, el título del contenedor y el nombre de la vista siguen siendo "DevCommands" sin clave, porque es la marca.
- `package.nls.json` (en) y `package.nls.{es,pt-br,fr,de,it,ja,ko,zh-cn,zh-tw,ru}.json`. Nombres de archivo en minúsculas, como VS Code.
- Test: cada `%clave%` que aparezca en `package.json` existe y no está vacía en los 11 archivos, y no hay claves sobrantes.

### D6. Textos de la extensión (`vscode.l10n`)
- `package.json`: `"l10n": "./l10n"`. `l10n/bundle.l10n.<idioma>.json` para los 10 idiomas que no son inglés (en inglés, `l10n.t` devuelve el texto fuente).
- Hoy la extensión no tiene textos visibles, así que los bundles empiezan como `{}`. El primer uso real llega con 1.4 (terminal) y 1.5 (copiar).
- Test: extrae con una regex las llamadas `l10n.t('…')` / `l10n.t("…")` de `src/**/*.ts` y comprueba que cada texto existe en los 10 bundles, y que los bundles no tienen claves que el código ya no usa. Las llamadas con un argumento que no es un literal hacen fallar el test, para que siempre se pueda extraer el texto.
- *Alternativa descartada:* `@vscode/l10n-dev export`. Genera el bundle inglés, pero no comprueba que las traducciones estén completas y añade una dependencia. La regex basta mientras los textos sean literales.

### D7. Diccionario del webview (`webview-ui/src/i18n/`)
```
i18n/
  en.ts          export const en = { loading: 'Loading…', comingSoon: 'Commands coming soon.' }
  es.ts ... ru.ts   export const es: Messages = { ... }
  index.ts       export type Messages = Record<keyof typeof en, string>
                 const dictionaries: Record<Locale, Messages> = { en, es, ... }
                 export function translate(locale: Locale, key: keyof Messages, params?): string
```
- `Record<Locale, Messages>` obliga a tener los 11 idiomas, y `Messages` obliga a tener todas las claves. Las claves que falten o sobren fallan en `tsc -b`.
- `translate` sustituye `{nombre}` por `params[nombre]`.
- `App.tsx`: un hook `useT(locale)` devuelve `t(key, params)`.
- **Antes del `init`**, el texto de carga usa el idioma de `document.documentElement.lang`, que ya pone la extensión al generar el HTML (D3 de `webview-shell`). Así "Loading…" sale traducido desde el primer instante. Si el `lang` no es un idioma soportado, se usa `en`.
- `Locale` se importa solo como tipo desde `src/i18n/locales.ts`. La lista de diccionarios es un objeto literal, así que el webview no necesita `SUPPORTED_LOCALES` en tiempo de ejecución.
- Test (Vitest, importa `webview-ui/src/i18n`): los 11 diccionarios tienen las mismas claves, ningún valor vacío y los mismos `{marcadores}` por clave.

### D8. Textos actuales y traducciones
- El webview tiene 2 claves (`loading` y `comingSoon`) y el manifiesto 1 (`description`). Las traducciones se generan para los 11 idiomas. El README indica que se aceptan correcciones de hablantes nativos.
- La descripción en inglés pasa a ser la fuente: "Quick guide to development commands that you can send to the terminal in one click".

### D9. Docs
- `README.md`: sustituye la plantilla del generador por una descripción mínima, los idiomas disponibles y cómo contribuir traducciones.
- `catalog/README.md`: cómo añadir un idioma opcional a un comando, más la regla de que `en` y `es` son obligatorios.
- `docs/ROADMAP.md`: fila i18n con "11 idiomas", tabla de ramas con el método de merge (squash en features → `develop`, merge commit en releases y sincronizaciones), casilla del PR de release de la Fase 0 marcada y 1.1 ✅.

## Risks / Trade-offs

- [Traducciones generadas que el autor no puede revisar (ja, ko, zh, ru)] → Son pocas frases. El README invita a corregirlas y los tests garantizan al menos que existen y tienen los mismos marcadores.
- [La búsqueda (1.6) se diseñó con tags "en los dos idiomas"] → Con el fallback hay siempre tags `en` y `es`. La 1.6 decidirá qué idiomas busca.
- [La regex de `l10n.t` no detecta usos indirectos] → El test exige literales, así que una llamada no literal falla en vez de pasar inadvertida.
- [El `pt-PT` se muestra en portugués de Brasil] → VS Code solo tiene paquete `pt-br`. Si alguien lo pide, se añade `pt-pt` como idioma más.

## Migration Plan

Sin datos de usuario. Los JSON del catálogo no cambian. Rollback: revertir el squash merge.
