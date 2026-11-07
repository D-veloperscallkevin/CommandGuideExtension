## Context

La 3.7a creó la sección `frameworks` con siete categorías de frontend (`order` 100–112), un mínimo de 8 comandos para la sección, y el aviso de pnpm, Yarn y Bun en los comandos `npx` y `npm create`. El generador tiene un módulo `fe.js` que añade el aviso.

El catálogo ya tiene convenciones para los lenguajes de los frameworks de backend:
- **Maven y Gradle:** `./mvnw` y `./gradlew`, con las variantes `.\mvnw` y `.\gradlew` en PowerShell y `mvnw` y `gradlew` en cmd. Ya incluyen `./mvnw spring-boot:run` y `./gradlew bootRun`.
- **Python:** `python3` con la variante `python` en PowerShell y cmd.
- **PHP y Ruby:** `php`, `composer`, `gem` y `bundle` funcionan igual en todos los shells.

`detect` es opcional en el schema: `terminal` no lo declara.

## Goals / Non-Goals

**Goals:**
- Siete categorías de backend con los comandos del día a día: crear el proyecto, arrancar, generar código, migraciones, tests y diagnóstico.
- Que cada comando funcione en bash, zsh, PowerShell y cmd, con variantes donde el shell lo exija.
- Que todo lo que toca la base de datos lleve el riesgo que corresponde.

**Non-Goals:**
- Detectar Spring Boot o FastAPI leyendo el contenido de `pom.xml`, `build.gradle` o `pyproject.toml`.
- Express, Flask, Gin y otros frameworks que no están en el ROADMAP.
- Repetir en Spring Boot los comandos genéricos de Maven y Gradle (compilar, tests, limpiar).

## Decisions

### 1. Identificadores, orden, iconos y detección

| id | Título | order | icon | detect |
| --- | --- | --- | --- | --- |
| `nestjs` | NestJS | 114 | `symbol-interface` | `nest-cli.json` |
| `laravel` | Laravel | 116 | `heart` | `artisan` |
| `django` | Django | 118 | `music` | `manage.py` |
| `rails` | Rails | 120 | `telescope` | `bin/rails` |
| `spring-boot` | Spring Boot | 122 | `server` | — |
| `symfony` | Symfony | 124 | `circuit-board` | `symfony.lock`, `bin/console` |
| `fastapi` | FastAPI | 126 | `pulse` | — |

- Los títulos son nombres propios y no se traducen.
- Los siete iconos existen en `codicon.csv` y ninguna otra categoría los usa.
- `bin/rails` y `bin/console` son rutas fijas de un nivel, un patrón que la detección ya admite.

Alternativas descartadas para Spring Boot y FastAPI:
- **Pistas de nombre** (`HELP.md`, `main.py`): dan demasiados falsos positivos.
- **Leer el contenido de los archivos:** es otro change.

### 2. Forma de los comandos por framework

| Categoría | bash/zsh | PowerShell | cmd |
| --- | --- | --- | --- |
| NestJS | `npx nest start --watch` | igual | igual |
| Laravel | `php artisan serve` | igual | igual |
| Django | `python3 manage.py runserver` | `python manage.py runserver` | `python manage.py runserver` |
| Rails | `bin/rails server` | `ruby bin\rails server` | `ruby bin\rails server` |
| Spring Boot (Maven) | `./mvnw spring-boot:run` | `.\mvnw spring-boot:run` | `mvnw spring-boot:run` |
| Spring Boot (Gradle) | `./gradlew bootRun` | `.\gradlew bootRun` | `gradlew bootRun` |
| Symfony | `php bin/console cache:clear` | igual | igual |
| FastAPI | `fastapi dev` | igual | igual |

Notas:
- **Rails:** `gem install rails` y `rails new` usan la gema global y no llevan variantes.
- **Django:** `django-admin startproject` es un ejecutable instalado por pip y funciona igual en todos los shells.
- **Spring Boot con perfiles:** se usan las formas de la documentación:
  - Maven: `-Dspring-boot.run.profiles=${profile}`;
  - Gradle: `--args=--spring.profiles.active=${profile}`.

  En PowerShell 5.1 un argumento como `-Dspring-boot.run.profiles=dev` se parte en el primer punto. Por eso su variante lo pone entre comillas dobles: `.\mvnw spring-boot:run "-Dspring-boot.run.profiles=${profile}"`. Igual con `"--args=--spring.profiles.active=${profile}"`. Según la regla existente, los parámetros dentro de comillas dobles solo se escapan.
- **`curl` en PowerShell:** es un alias de Invoke-WebRequest, así que la variante usa `curl.exe`. En cmd de Windows 10+, `curl` ya es curl.exe. Se usa en Spring Initializr y en Actuator.
- **FastAPI:** se instala con `python3 -m pip install "fastapi[standard]"`, con la variante `python` en PowerShell y cmd. Las comillas evitan que zsh interprete los corchetes. No hay parámetros dentro.

### 3. Comandos

Comprobados en Context7: Laravel 13, Spring Boot 4.0, FastAPI y NestJS. Rails, Django y Symfony se repasan con su documentación oficial durante la implementación.

| Categoría | Comandos |
| --- | --- |
| **NestJS** (~13) | `npx @nestjs/cli new ${name}`, `npx nest start --watch`, `npx nest start --debug --watch`, `npx nest start`, `npx nest build`, `npx nest generate resource ${name}`, `npx nest generate module ${name}`, `npx nest generate controller ${name}`, `npx nest generate service ${name}`, `npx nest add ${package}` (caution), `npx nest info`, `npx jest --watch`, `npx jest --config ./test/jest-e2e.json` |
| **Laravel** (~17) | `composer create-project laravel/laravel ${name}`, `composer run dev`, `php artisan serve`, `php artisan migrate` (caution), `php artisan migrate:rollback` (destructive), `php artisan migrate:fresh --seed` (destructive), `php artisan db:seed` (caution), `php artisan make:model ${name} -mcr`, `php artisan make:controller ${name}`, `php artisan make:migration ${name}`, `php artisan route:list`, `php artisan tinker`, `php artisan test`, `php artisan optimize:clear`, `php artisan key:generate` (caution), `php artisan queue:work`, `php artisan storage:link` |
| **Django** (~15) | `python3 -m pip install django`, `django-admin startproject ${name} .`, `manage.py startapp ${name}`, `runserver`, `runserver ${port}`, `makemigrations`, `migrate` (caution), `showmigrations`, `createsuperuser`, `shell`, `dbshell`, `test`, `collectstatic` (caution), `check --deploy`, `flush` (destructive) |
| **Rails** (~17) | `gem install rails`, `rails new ${name}`, `bin/rails server`, `bin/dev`, `bin/rails console`, `bin/rails generate scaffold ${name}`, `generate model ${name}`, `generate controller ${name}`, `generate migration ${name}`, `bin/rails db:create`, `db:migrate` (caution), `db:rollback` (destructive), `db:seed` (caution), `db:reset` (destructive), `db:drop` (destructive), `bin/rails routes`, `bin/rails test` |
| **Spring Boot** (~12) | Spring Initializr (`curl https://start.spring.io/starter.zip -d dependencies=${dependencies} -o demo.zip`); con Maven y con Gradle: arrancar (`spring-boot:run` / `bootRun`), arrancar con un perfil, arrancar en modo test (`spring-boot:test-run` / `bootTestRun`), crear la imagen OCI (`spring-boot:build-image` / `bootBuildImage`) y crear el jar (`package` / `bootJar`); `java -jar ${file}`; `curl http://localhost:8080/actuator/health` |
| **Symfony** (~14) | `symfony new ${name} --webapp`, `symfony server:start`, `symfony server:stop`, `symfony check:requirements`, `php bin/console make:controller ${name}`, `make:entity ${name}`, `make:migration`, `doctrine:database:create`, `doctrine:migrations:migrate` (caution), `doctrine:database:drop --force` (destructive), `cache:clear`, `debug:router`, `composer require ${package}` (caution), `php bin/phpunit` |
| **FastAPI** (~9) | `python3 -m pip install "fastapi[standard]"`, `fastapi dev`, `fastapi dev ${file}`, `fastapi run`, `fastapi run --port ${port}`, `uvicorn main:app --reload`, `python3 -m pytest`, `fastapi --version`, `fastapi dev --host 0.0.0.0` |

`bin/dev` es un script de Ruby en Rails 7.1+ y lleva la variante `ruby bin\dev`. `php bin/phpunit` funciona igual en todos los shells.

**Parámetros nuevos del generador:**
- `profile` (`dev`);
- `dependencies` (`web,data-jpa`), las dependencias de Spring Initializr separadas por comas, sin espacios.

Se reutilizan `name`, `port`, `file` y `package`.

### 4. Riesgo

- **`caution`:**
  - `php artisan migrate`, `php artisan db:seed`, `php artisan key:generate`;
  - `manage.py migrate`, `manage.py collectstatic`;
  - `bin/rails db:migrate`, `bin/rails db:seed`;
  - `doctrine:migrations:migrate`;
  - `composer require` en Symfony (las recetas de Flex cambian la configuración);
  - `nest add`.
- **`destructive`:** `migrate:rollback`, `migrate:fresh --seed`, `db:rollback`, `db:reset`, `db:drop`, `manage.py flush` y `doctrine:database:drop --force`.
- **`safe`:** el resto. Crear proyectos, generar código, arrancar servidores y tests no tocan datos existentes. `make:migration` y `makemigrations` solo escriben archivos nuevos.

## Risks / Trade-offs

- **Spring Boot duplica dos comandos de Maven y Gradle** (`spring-boot:run` y `bootRun`). Es aceptable: en Spring Boot están junto a sus variantes (perfiles, test-run, imagen), y quien busca "spring" los encuentra todos.
- **Spring Boot y FastAPI no aparecen en "En este proyecto".** Mitigación: la búsqueda por `spring`, `boot` o `fastapi` llega a ellos, y sus lenguajes sí se detectan.
- **Comandos que borran la base de datos:** el riesgo `destructive` exige confirmación con `devcommands.confirmDestructive`, y la descripción lo dice.
