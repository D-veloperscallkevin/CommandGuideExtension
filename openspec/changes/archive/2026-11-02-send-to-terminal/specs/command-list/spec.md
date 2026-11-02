# Spec Delta

## MODIFIED Requirements

### Requirement: Teclado y lector de pantalla en la lista de comandos
La lista de comandos SHALL ser una lista con nombre accesible que ocupa una sola parada de Tab. Flecha abajo, Flecha arriba, Inicio y Fin SHALL mover el foco entre los comandos, sin dar la vuelta en los extremos. Cada comando SHALL ser un botón: activarlo con clic, Enter o Espacio SHALL enviarlo a la terminal. El nombre accesible de cada comando SHALL incluir su título, su riesgo si no es `safe`, su descripción y su ejemplo, y su descripción accesible SHALL indicar en el idioma activo que el comando se escribe en la terminal sin ejecutarse.

#### Scenario: Recorrer los comandos
- **WHEN** el foco está en el primer comando de Git y el usuario pulsa Fin
- **THEN** el foco pasa a `git.reset-hard`, el último comando

#### Scenario: Anuncio de un comando con riesgo
- **WHEN** un lector de pantalla llega a `git.reset-hard` con el idioma activo `en`
- **THEN** anuncia un botón con su título, "Destructive", su descripción y `git reset --hard`, y que el comando se escribe en la terminal sin ejecutarse

#### Scenario: Enviar con el teclado
- **WHEN** el foco está en `git.status` y el usuario pulsa Enter
- **THEN** `git status` queda escrito en la terminal, que recibe el foco

#### Scenario: Enviar con el ratón
- **WHEN** el usuario hace clic en un comando
- **THEN** su ejemplo queda escrito en la terminal sin ejecutarse
