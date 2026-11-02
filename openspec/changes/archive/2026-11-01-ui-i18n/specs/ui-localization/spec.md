# Spec Delta

## Purpose

Define en qué idiomas se muestra la interfaz de DevCommands (manifiesto, textos de la extensión y webview), cómo se elige el idioma activo y qué garantiza que ningún idioma quede con textos sin traducir.

## ADDED Requirements

### Requirement: Idiomas soportados por la interfaz
La interfaz SHALL estar disponible en 11 idiomas: `en`, `es`, `pt-br`, `fr`, `de`, `it`, `ja`, `ko`, `zh-cn`, `zh-tw` y `ru`. El idioma activo SHALL ser el idioma de la interfaz de VS Code, resuelto así: coincidencia exacta con un idioma soportado; si no, por idioma base (`pt` → `pt-br`; `zh` con región `tw`, `hk` o `mo`, o con script `hant` → `zh-tw`, y cualquier otro `zh` → `zh-cn`; cualquier otro idioma con región → su idioma base si está soportado); y en cualquier otro caso `en`. La comparación MUST ignorar mayúsculas y aceptar `_` como separador.

#### Scenario: Idioma con región
- **WHEN** el idioma de VS Code es `de-CH`
- **THEN** la interfaz se muestra en `de`

#### Scenario: Chino tradicional de Hong Kong
- **WHEN** el idioma de VS Code es `zh-HK`
- **THEN** la interfaz se muestra en `zh-tw`

#### Scenario: Portugués de Portugal
- **WHEN** el idioma de VS Code es `pt-PT`
- **THEN** la interfaz se muestra en `pt-br`

#### Scenario: Idioma no soportado
- **WHEN** el idioma de VS Code es `nl`
- **THEN** la interfaz se muestra en `en`

### Requirement: Manifiesto localizado
Los textos del manifiesto visibles para el usuario (descripción de la extensión y nombres de contenedores y vistas que no sean la marca) SHALL definirse como claves `%clave%` con su valor inglés en `package.nls.json` y una traducción en `package.nls.<idioma>.json` para cada uno de los otros 10 idiomas. Cada clave usada en el manifiesto MUST existir y no estar vacía en los 11 archivos.

#### Scenario: VS Code en japonés
- **WHEN** VS Code está en japonés y el usuario ve DevCommands en la lista de extensiones
- **THEN** la descripción aparece en japonés

#### Scenario: Clave sin traducir
- **WHEN** una clave del manifiesto falta en `package.nls.ko.json`
- **THEN** los tests unitarios fallan nombrando la clave y el archivo

### Requirement: Textos de la extensión traducibles
Todo texto visible que muestre la extensión fuera del webview (notificaciones, nombres de terminal, mensajes de error) SHALL pasar por `vscode.l10n.t` con el texto inglés como clave, y SHALL tener traducción en `l10n/bundle.l10n.<idioma>.json` para los otros 10 idiomas. Los mensajes del registro de diagnóstico MAY quedar en inglés.

#### Scenario: Texto nuevo sin traducción
- **WHEN** el código de la extensión llama a `vscode.l10n.t` con un texto que no está en `l10n/bundle.l10n.fr.json`
- **THEN** los tests unitarios fallan nombrando el texto y el archivo

### Requirement: Textos del webview completos en todos los idiomas
El webview SHALL obtener cada texto visible de un diccionario por idioma, a partir del idioma recibido en `init`. Los 11 diccionarios MUST tener exactamente las mismas claves, ningún valor vacío y los mismos marcadores `{nombre}` en cada clave. Un diccionario incompleto MUST hacer fallar la compilación o los tests unitarios.

#### Scenario: Webview en coreano
- **WHEN** la extensión envía `init` con `locale: "ko"`
- **THEN** todos los textos visibles del webview se muestran en coreano

#### Scenario: Clave que falta en un idioma
- **WHEN** se añade una clave al diccionario inglés y no al ruso
- **THEN** la compilación del webview falla

#### Scenario: Marcador distinto entre idiomas
- **WHEN** la clave `version` es `v{version}` en inglés y `v{versión}` en español
- **THEN** los tests unitarios fallan nombrando la clave y el idioma

### Requirement: Idioma del documento del webview
El documento del webview SHALL declarar en `<html lang>` el idioma activo, para que los lectores de pantalla pronuncien los textos correctamente.

#### Scenario: Lector de pantalla en francés
- **WHEN** el idioma activo es `fr`
- **THEN** el documento del webview tiene `lang="fr"`
