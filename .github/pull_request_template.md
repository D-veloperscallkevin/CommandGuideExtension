## Resumen

<!-- Qué cambia y por qué. Si es un change de OpenSpec, enlaza su carpeta en openspec/changes/archive/. -->

## Verificación

- [ ] `pnpm run verify` en verde en local (lo ejecuta el hook pre-push; marca aquí si usaste `--no-verify` y por qué)
- [ ] `/opsx:archive` ejecutado: las specs de `openspec/specs/` reflejan este cambio
- [ ] **Solo PR de release (`develop → staging`):** `pnpm install --frozen-lockfile && xvfb-run -a pnpm run verify` en verde en WSL/Linux sobre el commit de este PR
