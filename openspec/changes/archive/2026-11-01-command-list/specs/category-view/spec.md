# Spec Delta

## MODIFIED Requirements

### Requirement: Navegación a una categoría y vuelta
Activar una categoría SHALL mostrar su pantalla, con el título de la categoría, su número de comandos, un control para volver y la lista de sus comandos. Volver SHALL mostrar de nuevo la lista de categorías y devolver el foco a la categoría desde la que se entró.

#### Scenario: Abrir y volver
- **WHEN** el usuario abre la categoría Git y después pulsa "Atrás"
- **THEN** la vista vuelve a la lista y el foco queda sobre la entrada Git

#### Scenario: Volver con Escape
- **WHEN** la pantalla de una categoría está abierta y el usuario pulsa Escape
- **THEN** la vista vuelve a la lista

#### Scenario: Pantalla con comandos
- **WHEN** el usuario abre la categoría Git
- **THEN** la pantalla muestra su título, "3 comandos" (en español), el control para volver y los 3 comandos de Git
