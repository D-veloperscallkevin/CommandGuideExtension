# Tasks

## 1. Categorías nuevas

Para cada categoría:
1. Comprobar los comandos en la documentación oficial (Context7 o la web oficial).
2. Escribir el JSON con:
   - `section: "frameworks"`, y `order`, `icon` y `detect` según la decisión 1 del design;
   - al menos 8 comandos traducidos a los 11 idiomas, con la forma de la decisión 2;
   - el aviso de pnpm, Yarn y Bun en los comandos `npx`;
   - `risk` según la decisión 4;
   - `docs` en cada comando.
3. Verificar con `pnpm run test:unit`.

Tareas:
- [x] 1.1 `catalog/nestjs.json`.
- [x] 1.2 `catalog/laravel.json`.
- [x] 1.3 `catalog/django.json`, con la variante `python` en PowerShell y cmd.
- [x] 1.4 `catalog/rails.json`, con la variante `ruby bin\rails` en PowerShell y cmd.
- [x] 1.5 `catalog/spring-boot.json`, con Maven y Gradle, comillas en PowerShell para los argumentos con punto y `curl.exe`.
- [x] 1.6 `catalog/symfony.json`.
- [x] 1.7 `catalog/fastapi.json`, sin `detect`.

## 2. Tests

- [x] 2.1 `test/unit/catalog/content.test.ts`:
  - lista y orden de las 55 categorías, con las 7 nuevas detrás de `sveltekit`;
  - `rails.server` es `bin/rails server` en `bash` y `ruby bin\rails server` en `powershell`;
  - `django.runserver` es `python manage.py runserver` en `cmd`;
  - el perfil de Spring Boot con Maven en `powershell` lleva `"-Dspring-boot.run.profiles=…"` entre comillas, y la salud de Actuator usa `curl.exe`;
  - los comandos que borran la base de datos son `destructive`, y `migrate` en Laravel y en Django es `caution`.
- [x] 2.2 `test/unit/project/detect.test.ts`:
  - `artisan` y `composer.json` detectan `laravel` y `php`;
  - `manage.py` y `requirements.txt` detectan `django` y `python`;
  - `Gemfile` y `bin/rails` detectan `rails` y `ruby`;
  - `pom.xml` solo detecta `maven`.
- [x] 2.3 `src/test/extension.test.ts`: lista de categorías del test de integración.

## 3. Documentación y verificación

- [x] 3.1 Actualizar la documentación:
  - README: herramientas incluidas y tabla de señales;
  - CHANGELOG: en `[Unreleased]`;
  - ROADMAP: marcar la 3.7b con ✅.

  Después, ejecutar:
  - `pnpm run verify`;
  - `pnpm run release:package`, y comprobar el tamaño del `.vsix`;
  - `openspec validate catalog-backend --strict`.

## 4. Prueba manual

- [x] 4.1 Dar al autor la lista de comprobación para F5:
  - las 7 categorías aparecen en "Frameworks" después de SvelteKit;
  - detección en vivo:
    - crear `manage.py` → `django`;
    - crear `artisan` → `laravel`;
    - crear `nest-cli.json` → `nestjs`;
  - Rails y Django cambian el comando entre PowerShell, cmd y Git Bash;
  - el perfil de Spring Boot en PowerShell lleva comillas;
  - `php artisan migrate:fresh --seed` pide confirmación;
  - repaso de los textos en español.

  Resultado (2026-11-06): todo correcto en F5 (sección Frameworks con los 7 backends en orden, detección de Laravel, Django, Symfony, Rails por bin/rails y pom.xml sin Spring Boot, variantes de PowerShell de Rails, Django y Spring Boot, avisos destructive y caution, parámetro con coma e idiomas).
