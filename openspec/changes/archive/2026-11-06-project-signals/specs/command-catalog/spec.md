## ADDED Requirements

### Requirement: Patrones de detección en el catálogo
Cada categoría del catálogo MAY declarar `detect`, una lista de patrones de detección del proyecto. Si la declara, la lista MUST tener al menos un patrón y MUST NOT repetir ninguno. Cada patrón MUST tener una de estas tres formas:
- un nombre;
- un nombre con comodines `*`;
- `carpeta/nombre`, sin comodines.

La validación del catálogo MUST rechazar patrones con `**`, `?`, `[`, `{`, `\`, `..`, una `/` inicial o final, más de una `/`, o un comodín dentro de una ruta. Un patrón MUST NOT repetirse dentro de la misma categoría; sí MAY aparecer en varias, y entonces detecta todas ellas. La categoría `terminal` MUST NOT declarar `detect`.

#### Scenario: Patrones válidos
- **WHEN** una categoría declara `"detect": ["go.mod", "*.csproj", "prisma/schema.prisma"]`
- **THEN** la validación del catálogo pasa sin errores

#### Scenario: Patrón no admitido
- **WHEN** una categoría declara `"detect": ["**/*.tf"]`, `"detect": ["../go.mod"]` o `"detect": ["src/*.cs"]`
- **THEN** la validación del catálogo falla e indica el archivo y el patrón

#### Scenario: Lista vacía o repetida
- **WHEN** una categoría declara `"detect": []` o `"detect": ["go.mod", "go.mod"]`
- **THEN** la validación del catálogo falla

#### Scenario: Terminal sin detección
- **WHEN** `catalog/terminal.json` declara `detect`
- **THEN** los tests del catálogo fallan
