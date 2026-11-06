## Why

El autor quiere recibir donaciones sin cobrar por la extensión. Ya tiene su perfil de GitHub Sponsors aprobado y público (`https://github.com/sponsors/D-veloperscallkevin`). Hoy no hay ningún acceso a él: ni en la ficha de las tiendas, ni en el README, ni en el panel.

Fase del roadmap: **Fase 2 (v1)**, change 2.11, antes del release v1.0.0.

## What Changes

- **Manifiesto:** campo `sponsor.url` con la página de GitHub Sponsors. VS Code (1.68+) muestra con él el botón **Sponsor** en la ficha de la extensión.
- **README:** sección "Support" con el enlace, antes de "License".
- **Panel:** botón **"♥ Sponsor"** arriba del todo, antes de "Ejemplos para".
  - Se ve en todas las pantallas del panel, usa el icono `heart` y los colores del tema, y funciona con teclado y con lector de pantalla.
  - El texto se traduce a los 11 idiomas. En español, "Patrocinar".
- **Mensaje nuevo del webview:** `{ "type": "openSponsor" }`, sin campos.
  - La extensión lo valida como el resto de mensajes y abre la URL del manifiesto con `vscode.env.openExternal`.
  - La URL nunca viene del webview. La extensión solo la abre si empieza por `https://github.com/sponsors/`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `webview-messaging`: "Protocolo de mensajes tipado" añade `openSponsor`, sin campos.
- `sidebar-view`: nuevo requisito "Botón de patrocinio en el panel".
- `marketplace-listing`: nuevo requisito "Enlace de patrocinio en la ficha" (manifiesto y README).

## Impact

- **`package.json`:** campo `sponsor`.
- **`src/messaging/protocol.ts`:** tipo y validador de `openSponsor`.
- **`src/sponsor/sponsorLink.ts` (nuevo):** lee y valida la URL del manifiesto y la abre.
- **`src/views/CommandsViewProvider.ts`:** atiende el mensaje.
- **`src/extension.ts`:** conecta el módulo nuevo.
- **`webview-ui/src/App.tsx` y `index.css`:** el botón.
- **`webview-ui/src/i18n/*.ts`:** 2 claves nuevas en los 11 idiomas.
- **README y CHANGELOG.**
- **Tests:**
  - `protocol.test.ts`;
  - nuevo `test/unit/sponsor/sponsorLink.test.ts`;
  - `listing.test.ts`;
  - los diccionarios ya se comprueban solos.
- **Dependencias:** ninguna nueva. Solo API estable de VS Code (`env.openExternal`).
