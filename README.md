# DevCommands

Quick guide to development commands for VS Code. Browse commands by category (Git, npm/pnpm, Docker, …) and send them to the terminal in one click.

> Work in progress: categories, commands and sending to the terminal work; search, copy and more categories are being built. See [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Usage

1. Open the **DevCommands** view in the Activity Bar.
2. Pick a category to see its commands, with a description, an example and a warning on risky ones.
3. Click a command (or press Enter or Space on it). It is **written** in the terminal but **never run**: review it, edit it if needed and press Enter yourself.

The command goes to the active terminal; if there is none, a terminal named "DevCommands" is created. Commands with parameters are written with their example value (for instance `feature/my-change`), so replace it before pressing Enter.

Known limitations:

- If the active terminal is running a process (for example a dev server), the text goes to that process. Nothing is run, but switch to a free terminal first.
- If you had already typed something in the terminal, the command is appended after it.
- Until shell detection lands, examples use PowerShell syntax on Windows and bash syntax on Linux and macOS.

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
