# DevCommands

Quick guide to development commands for VS Code. Browse commands by category (Git, npm/pnpm, Docker, …) and send them to the terminal in one click.

> Work in progress (pre-release): categories, commands, search, sending to the terminal and copying work. See [`docs/ROADMAP.md`](docs/ROADMAP.md) for what comes next.

## Usage

1. Open the **DevCommands** view in the Activity Bar. It includes more than 100 commands for Git, npm, pnpm, Node.js, Docker and the terminal (files, folders, processes).
2. Pick a category to see its commands, with a description, an example and a warning on risky ones. Or type in the search box to find commands across all categories, in English or Spanish (accents and case don't matter); press Down to jump to the results and Escape to clear the search.
3. Click a command (or press Enter or Space on it). It is **written** in the terminal but **never run**: review it, edit it if needed and press Enter yourself.
4. To use it somewhere else, click the copy button next to it (or press `Ctrl+C`, `Cmd+C` on macOS, while the command has focus). It is copied to the clipboard and nothing is sent to the terminal.

The command goes to the active terminal; if there is none, a terminal named "DevCommands" is created. Commands with parameters are written with their example value (for instance `feature/my-change`), so replace it before pressing Enter.

Known limitations:

- If the active terminal is running a process (for example a dev server), the text goes to that process. Nothing is run, but switch to a free terminal first.
- If you had already typed something in the terminal, the command is appended after it.
- Until shell detection lands, examples use PowerShell syntax on Windows and bash syntax on Linux and macOS (Terminal commands have a native PowerShell variant).

## Languages

The interface follows the VS Code display language and is available in:

English · Español · Português (Brasil) · Français · Deutsch · Italiano · 日本語 · 한국어 · 简体中文 · 繁體中文 · Русский

Any other display language falls back to English. The command catalog (titles, descriptions, parameters and search terms) is also available in all 11 languages; the commands themselves are not translated.

### Improve a translation

Translations were generated and may contain mistakes. Corrections from native speakers are very welcome:

- Interface: `webview-ui/src/i18n/<language>.ts`
- Extension description: `package.nls.<language>.json`
- Extension messages: `l10n/bundle.l10n.<language>.json`
- Command catalog: see [`catalog/README.md`](catalog/README.md#corregir-o-añadir-una-traducción)

Run `pnpm run test:unit` before opening a pull request: the tests check that every language has all the texts and the same `{placeholders}`.

## Development

Requirements: Node 24 and pnpm 11.

```bash
pnpm install
pnpm run verify   # lint, unit tests, build and integration tests
```

Press F5 in VS Code to open an Extension Development Host with the extension loaded.

### Packaging

```bash
pnpm run release:package   # builds devcommands-<version>.vsix and checks its size (< 2 MB) and contents
code --install-extension devcommands-0.1.0.vsix
```

In WSL, open a folder with Remote-WSL and use Extensions › "…" › "Install from VSIX…" to install it there.

## License

See [LICENSE](LICENSE).
