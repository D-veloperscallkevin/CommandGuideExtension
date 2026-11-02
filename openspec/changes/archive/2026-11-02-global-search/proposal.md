# Proposal

## Why

Hoy, para encontrar un comando hay que saber en qué categoría está y abrirla. Con la 1.7 llegarán al menos 5 categorías con 15 comandos cada una, y recorrerlas a mano deja de ser práctico. La "Búsqueda global" del MVP permite escribir lo que se quiere hacer ("rama", "discard", "estado") y llegar al comando desde la pantalla inicial, en cualquiera de los dos idiomas del catálogo.

**Fase del roadmap:** v0.1.0 pre-release, Fase 1 (MVP), change 1.6.

## What Changes

- **Texto de búsqueda en el catálogo:** cada comando del mensaje `catalog` lleva un `searchText` que construye la extensión. Es un texto normalizado (minúsculas, sin tildes ni diacríticos) que reúne:
  - el título, la descripción y los tags del comando en `en`, en `es` y en el idioma activo;
  - el título de su categoría;
  - el ejemplo.

  Los campos originales en otros idiomas siguen sin enviarse.
- **Búsqueda pura y compartida** en `src/catalog/search.ts`:
  - normaliza la consulta y la parte en palabras;
  - un comando coincide si su `searchText` contiene todas las palabras;
  - los resultados salen primero los que coinciden en el título y después el resto, en el orden del catálogo.

  La reutilizará el Quick Pick (2.8).
- **Campo de búsqueda** encima de la lista de categorías. Con texto, la lista de categorías se sustituye por una lista plana de resultados de todas las categorías. Cada resultado usa la misma fila de comando que ya existe (enviar a la terminal, copiar, aviso de riesgo) e indica su categoría. Sin texto, vuelve la lista de categorías.
- **Teclado:**
  - Flecha abajo pasa del campo al primer resultado;
  - Escape (en el campo o en un resultado) vacía el campo y devuelve el foco a él;
  - los resultados ocupan una sola parada de Tab.
- **Anuncios:** el número de resultados (con plurales) o "Sin resultados" se anuncia en una región viva, en los 11 idiomas.
- **Persistencia:** la consulta y el resultado con foco se guardan con la navegación, así que sobreviven a ocultar la vista o recargar la ventana.

Fuera de alcance:
- búsqueda difusa o tolerante a errores de escritura;
- resaltar las coincidencias;
- abrir la búsqueda con `Ctrl+F`;
- Quick Pick en la paleta (2.8);
- buscar desde la pantalla de una categoría.

## Capabilities

### New Capabilities
- `command-search`: buscar comandos en todo el catálogo desde la vista, en los dos idiomas del catálogo y en el idioma activo, con teclado, anuncios accesibles y la consulta persistida.

### Modified Capabilities
- `webview-messaging`: cada comando del mensaje `catalog` añade `searchText`, la única excepción a la regla de no enviar textos en otros idiomas.

## Impact

- **Extensión:**
  - nuevo `src/catalog/search.ts`, puro y sin dependencias;
  - `CatalogService.ts`: `CommandSummary` y `buildCategorySummaries` añaden `searchText`.
- **Webview:**
  - nuevo componente de búsqueda;
  - `App.tsx`;
  - `navigation.ts`: la vista guarda `query` y el foco del resultado;
  - `CommandList.tsx`: puede mostrar la categoría de cada fila;
  - diccionarios de los 11 idiomas y estilos.

  Es la primera vez que el webview importa código de ejecución de `src/` (hasta ahora solo importaba tipos).
- **Tests:**
  - Vitest para `search.ts`, `searchText`, la navegación y los diccionarios;
  - integración: `searchText` sin plantillas y en minúsculas.
- **Mensajes webview ↔ extensión:** `catalog` cambia de forma (campo nuevo); no hay mensajes nuevos.
- **Sin dependencias nuevas** y sin nuevos `contributes` en `package.json`.
