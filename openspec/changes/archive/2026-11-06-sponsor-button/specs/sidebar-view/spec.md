## ADDED Requirements

### Requirement: Botón de patrocinio en el panel
La vista SHALL mostrar arriba del todo, a la derecha y en la misma fila que el indicador del shell ("Terminal: …"), un botón con un icono de corazón y el texto "Sponsor" en el idioma activo (en español, "Patrocinar"). El botón SHALL verse en todas las pantallas de la vista: el inicio, una categoría, Favoritos, Recientes y los resultados de búsqueda.

El botón SHALL:
- usar los colores del tema activo;
- poder pulsarse con el ratón y, con el foco en él, con Enter o Espacio;
- tener un nombre accesible que diga que abre la página de patrocinio en el navegador.

Debajo de esa fila, el buscador SHALL quedar separado de ella y de la lista que le sigue con un espacio visible.

Al pulsarlo, la extensión SHALL abrir en el navegador la página de GitHub Sponsors declarada en el campo `sponsor` del manifiesto, a través del mecanismo de VS Code para abrir enlaces externos, sin un aviso propio de la extensión (VS Code solo pregunta para dominios que no son de confianza; `github.com` lo es). La extensión MUST NOT abrir ninguna otra dirección por este botón. Si el manifiesto no declara una URL `https://github.com/sponsors/…`, SHALL ignorar la petición y registrar una advertencia. Pulsar el botón MUST NOT escribir nada en la terminal ni cambiar el portapapeles.

#### Scenario: Botón visible al abrir el panel
- **WHEN** el usuario abre la vista de DevCommands en Windows con PowerShell o en Linux con bash
- **THEN** ve en la primera fila el indicador "Terminal: …" a la izquierda y el botón "Sponsor" a la derecha, y debajo el buscador, separado de esa fila y de la lista

#### Scenario: Visible dentro de una categoría
- **WHEN** el usuario entra en la categoría Git
- **THEN** el botón sigue arriba del todo

#### Scenario: Abrir con el teclado
- **WHEN** el usuario lleva el foco al botón con Tab y pulsa Enter
- **THEN** VS Code abre `https://github.com/sponsors/D-veloperscallkevin` en el navegador

#### Scenario: Interfaz en español
- **WHEN** VS Code está en español
- **THEN** el botón dice "Patrocinar"

#### Scenario: URL del manifiesto no válida
- **WHEN** el campo `sponsor.url` del manifiesto no empieza por `https://github.com/sponsors/` y el usuario pulsa el botón
- **THEN** no se abre nada y el registro contiene una advertencia
