## Why

Hoy, para escribir un comando hay que abrir el panel de DevCommands, lo que obliga a cambiar la barra lateral y a perder la vista del explorador o de Git. Quien trabaja con el teclado espera llegar a todo desde la paleta de comandos. Este change es el punto 2.8 de la Fase 2 (v1) del roadmap: "`Ctrl+Shift+P` → 'DevCommands: Buscar' sin abrir el panel".

## What Changes

- **Comando "DevCommands: Buscar comandos"** (`devcommands.searchCommands`):
  - aparece en la paleta de comandos y no tiene atajo por defecto;
  - abre un buscador de VS Code (QuickPick) con todos los comandos, los del catálogo y los propios, sin abrir el panel;
  - funciona aunque la vista no se haya abierto nunca.
- **Elementos:** cada comando muestra su título, su categoría, su descripción y el ejemplo para el shell de destino.
- **Con el cuadro vacío:** los comandos se agrupan con separadores:
  - "Favoritos";
  - "Recientes", con las entradas del historial y sus valores;
  - las categorías detectadas en el proyecto;
  - el resto de categorías, en el orden del catálogo.
- **Al escribir:** se usa la misma búsqueda que en el panel (título, descripción, tags, en/es y el idioma activo) y no el filtro difuso de VS Code. Los resultados van sin agrupar y en el orden del panel.
- **Acciones:**
  - **Enter:** cierra el cuadro y escribe el comando en la terminal sin ejecutarlo, con el mismo flujo que el panel: pide los parámetros, confirma los destructivos y lo registra en "Recientes". Una entrada de "Recientes" usa sus valores guardados.
  - **Botón de copiar:** copia el comando, deja el cuadro abierto y muestra una confirmación breve en la barra de estado.
  - **Botón de favorito:** marca o desmarca la estrella, actualiza el icono en el cuadro y actualiza el panel si está abierto.
- **Textos:** los nuevos, en los 11 idiomas.
- **Fuera de este change:** el atajo de teclado por defecto.

## Capabilities

### New Capabilities
- `quick-pick`: el comando de búsqueda en la paleta, cómo se construyen, agrupan, filtran y ordenan los elementos, y las acciones de Enter, copiar y favorito.

### Modified Capabilities
<!-- Ninguna. El envío, la copia, los favoritos y el historial ya están definidos de forma independiente de la vista y se reutilizan sin cambiar sus requisitos. La activación por un comando ya la permite `sidebar-view` ("se abre su vista o se ejecuta uno de sus comandos"). -->

## Impact

- **Extensión:**
  - nuevo `src/quickPick/items.ts`: construye y filtra los elementos sin depender de `vscode`;
  - nuevo `src/quickPick/CommandSearch.ts`: el QuickPick, sus botones y sus eventos;
  - `CommandsViewProvider` expone lo que el buscador necesita: el catálogo resumido, los favoritos, el historial y las categorías detectadas, más las acciones existentes (enviar, enviar reciente, copiar, copiar reciente y favorito);
  - `extension.ts` registra el comando.
- **Manifiesto:** `contributes.commands` con `%command.searchCommands%`, y textos en `package.nls*.json` (11 idiomas) y `l10n/bundle.l10n.*.json` (10 idiomas).
- **Dependencias:** ninguna nueva.
- **Pruebas:** unitarias de la construcción, el agrupado y el filtrado de los elementos; integración del comando registrado y de la API que usa.
- **Docs:** README, CHANGELOG y ROADMAP.
