## MODIFIED Requirements

### Requirement: Copiar un comando
Cada comando SHALL ofrecer una acción secundaria para copiarlo al portapapeles, además de la acción principal de enviarlo a la terminal:
- **Botón de copiar:** tiene icono, nombre accesible y tooltip en el idioma activo, y es visible al pasar el ratón por el comando o cuando el foco está en él. MUST NOT añadir paradas de Tab: la lista sigue ocupando una sola.
- **Atajo:** con el foco en un comando, `Ctrl+C` (`Cmd+C` en macOS) SHALL copiarlo, y el botón del comando SHALL anunciar ese atajo a las tecnologías de asistencia. Si hay texto seleccionado en la vista, el atajo SHALL copiar la selección y no el comando.
- **Parámetros:** si el comando tiene parámetros, copiar SHALL abrir los cuadros de los valores igual que enviarlo, y el foco pasa a esos cuadros. Si el usuario cancela, no se copia nada.
- **Confirmación:** cuando la extensión confirma la copia, la vista SHALL mostrar un icono de confirmación en el botón de copiar de ese comando durante unos 2 segundos y SHALL anunciar "Copiado" (en el idioma activo) en una región viva, también si se copia otra vez antes de que pasen. Copiar con el ratón un comando sin parámetros MUST NOT mover el foco. Sin confirmación de la extensión, la vista MUST NOT indicar que se copió.

Copiar MUST NOT enviar nada a la terminal.

#### Scenario: Copiar con el ratón en Windows
- **WHEN** en Windows con PowerShell el usuario pasa el ratón por `git.status` y pulsa su botón de copiar
- **THEN** el portapapeles contiene `git status`, el icono cambia a confirmación durante unos 2 segundos, no se escribe nada en la terminal y la lista sigue teniendo una sola parada de Tab

#### Scenario: Copiar con el teclado en Linux
- **WHEN** en Linux con bash el foco está en `git.status` y el usuario pulsa `Ctrl+C`
- **THEN** el portapapeles contiene `git status` y el foco sigue en ese comando

#### Scenario: Copiar un comando con parámetros
- **WHEN** en Linux con bash el foco está en `git.new-branch`, el usuario pulsa `Ctrl+C` y escribe `feature/login` en el cuadro que se abre
- **THEN** el portapapeles contiene `git checkout -b feature/login`, la vista muestra la confirmación en ese comando y no se escribe nada en la terminal

#### Scenario: Copia con parámetros cancelada
- **WHEN** el usuario pulsa el botón de copiar de `git.new-branch` y cancela el cuadro del valor
- **THEN** el portapapeles no cambia y la vista no muestra ni anuncia la confirmación

#### Scenario: Anuncio de la copia
- **WHEN** un lector de pantalla está activo con el idioma `es` y la extensión confirma la copia de un comando
- **THEN** el lector anuncia "Copiado"

#### Scenario: Texto seleccionado
- **WHEN** el usuario ha seleccionado parte de una descripción con el ratón y pulsa `Ctrl+C`
- **THEN** se copia el texto seleccionado y no el comando

#### Scenario: Botón de copiar fuera del orden de Tab
- **WHEN** el foco está en un comando y el usuario pulsa Tab
- **THEN** el foco sale de la lista sin pasar por el botón de copiar
