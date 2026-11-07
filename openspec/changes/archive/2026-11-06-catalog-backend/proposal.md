## Why

La sección "Frameworks" ya tiene los frameworks de frontend (3.7a), pero no los de backend. Quien trabaja con NestJS, Laravel, Django, Rails, Spring Boot, Symfony o FastAPI no encuentra los comandos para crear el proyecto, arrancar el servidor, generar código o gestionar las migraciones de la base de datos.

Fase del roadmap: **Fase 3 (v1.x)**, change 3.7b `catalog-backend`, la segunda de las cuatro partes de la 3.7.

## What Changes

- **Siete categorías nuevas** en la sección `frameworks`, detrás de las de frontend: `nestjs`, `laravel`, `django`, `rails`, `spring-boot`, `symfony` y `fastapi`. Cada una tiene al menos 8 comandos traducidos a los 11 idiomas y con enlace `docs`.
- **Cada framework sigue las formas de su lenguaje** ya establecidas en el catálogo:

  | Categoría | Forma | Variantes |
  | --- | --- | --- |
  | NestJS | `npx nest …` | no; aviso de pnpm, Yarn y Bun |
  | Laravel | `php artisan …`, `composer …` | no |
  | Django | `python3 manage.py …` | `python manage.py …` en PowerShell y cmd |
  | Rails | `bin/rails …` | `ruby bin\rails …` en PowerShell y cmd |
  | Spring Boot | cada acción con `./mvnw` y con `./gradlew` | las de los wrappers |
  | Symfony | `symfony …`, `php bin/console …` | no |
  | FastAPI | `fastapi …` | no |

  Además, en **Spring Boot** con PowerShell:
  - los argumentos que empiezan por `-` y contienen un punto van entre comillas dobles, porque PowerShell 5.1 los parte;
  - `curl` se escribe `curl.exe`, porque `curl` es un alias de Invoke-WebRequest.
- **Riesgo:**
  - **`caution`:** aplicar migraciones, cargar datos (`seed`), regenerar claves y añadir paquetes con recetas;
  - **`destructive`:** deshacer migraciones y vaciar o borrar la base de datos (`migrate:rollback`, `migrate:fresh`, `db:rollback`, `db:reset`, `db:drop`, `flush`, `doctrine:database:drop`). La descripción avisa de que se pierden datos.
- **Señales `detect`:**

  | Señales | Categoría |
  | --- | --- |
  | `nest-cli.json` | `nestjs` |
  | `artisan` | `laravel` |
  | `manage.py` | `django` |
  | `bin/rails` | `rails` |
  | `symfony.lock`, `bin/console` | `symfony` |

  Spring Boot y FastAPI no tienen un archivo propio en la raíz y no se detectan. Están en el panel, y sus proyectos ya detectan Maven, Gradle o Python.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- **`command-catalog`:** el requisito "Contenido mínimo del catálogo empaquetado" añade:
  - las 7 categorías nuevas;
  - la forma de los comandos de cada framework;
  - las reglas de riesgo de las migraciones y de borrar la base de datos.
- **`project-detection`:** el requisito "Señales del proyecto" añade las señales de NestJS, Laravel, Django, Rails y Symfony, y deja Spring Boot y FastAPI sin señales.

## Impact

- **Catálogo:** se añaden siete archivos `catalog/<id>.json`.
- **Tests:**
  - `test/unit/catalog/content.test.ts`: orden, variantes, comillas de PowerShell y riesgo;
  - `test/unit/project/detect.test.ts`: escenarios de detección;
  - `src/test/extension.test.ts`: lista de categorías.
- **Docs:**
  - README: herramientas incluidas y tabla de señales;
  - CHANGELOG;
  - ROADMAP: 3.7b ✅.
- **Sin cambios:** código, schema y dependencias.
- **Tamaño:** unos 80 KB más en el `.vsix`, en la línea de la 3.7a.
