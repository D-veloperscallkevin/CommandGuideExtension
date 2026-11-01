# DevCommands

Quick guide to development commands for VS Code. Browse commands by category (Git, npm/pnpm, Docker, …) and send them to the terminal in one click.

> Work in progress: the sidebar view is ready; categories, search and sending to the terminal are being built. See [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Languages

The interface follows the VS Code display language and is available in:

English · Español · Português (Brasil) · Français · Deutsch · Italiano · 日本語 · 한국어 · 简体中文 · 繁體中文 · Русский

Any other display language falls back to English. Command texts in the catalog are always available in English and Spanish; other languages are added over time and fall back to English when missing.

### Improve a translation

Translations were generated and may contain mistakes. Corrections from native speakers are very welcome:

- Interface: `webview-ui/src/i18n/<language>.ts`
- Extension description: `package.nls.<language>.json`
- Extension messages: `l10n/bundle.l10n.<language>.json`
- Command catalog: see [`catalog/README.md`](catalog/README.md#añadir-una-traducción)

Run `pnpm run test:unit` before opening a pull request: the tests check that every language has all the texts and the same `{placeholders}`.

## Development

Requirements: Node 24 and pnpm 11.

```bash
pnpm install
pnpm run verify   # lint, unit tests, build and integration tests
```

Press F5 in VS Code to open an Extension Development Host with the extension loaded.

## License

See [LICENSE](LICENSE).
