# DevCommands Guide

Quick guide to development commands for VS Code. Browse commands by category (Git, npm/pnpm, Docker, …) and send them to the terminal in one click, without memorizing their flags.

- **More than 100 commands** for Git, npm, pnpm, Node.js, Docker and the terminal, each with a description and an example.
- **Search** across all categories, in English or Spanish, by name, description or tag.
- **Nothing runs by itself:** commands are written to the terminal, never executed. You review them and press Enter.
- **Parameters** such as a branch or file name are asked for and quoted for your shell: PowerShell, bash, zsh or cmd.
- **Destructive commands** (`git reset --hard`, `rm -rf`…) ask for confirmation first.
- **Favorites, recent commands** with the values you typed, and **your own commands** in the settings.
- **Project detection:** the categories that fit the open project come first.
- **Command Palette search** without opening the panel.
- Available in **11 languages**.

![The DevCommands panel with the categories of the open project first](docs/images/panel.png)

![Searching commands across all categories](docs/images/search.png)

![Input box asking for the value of a command parameter](docs/images/params.png)

![Confirmation before writing a destructive command](docs/images/destructive.png)

![Searching commands from the Command Palette](docs/images/quick-pick.png)

## Usage

1. Open the **DevCommands** view in the Activity Bar. It includes more than 100 commands for Git, npm, pnpm, Node.js, Docker and the terminal (files, folders, processes).
2. Pick a category to see its commands, with a description, an example and a warning on risky ones. Or type in the search box to find commands across all categories, in English or Spanish (accents and case don't matter); press Down to jump to the results and Escape to clear the search.
3. Click a command (or press Enter or Space on it). It is **written** in the terminal but **never run**: review it, edit it if needed and press Enter yourself.
4. To keep a command at hand, click the star next to it (or press `Ctrl+D`, `Cmd+D` on macOS, while it has focus). Your favorites appear in the **Favorites** card at the top of the categories, in the order you starred them, and sync across machines with Settings Sync.
5. To use it somewhere else, click the copy button next to it (or press `Ctrl+C`, `Cmd+C` on macOS, while the command has focus). It is copied to the clipboard and nothing is sent to the terminal.
6. To repeat a command, open the **Recent** card: it lists the last 20 commands you wrote to the terminal, with the values you typed. Sending or copying one reuses those values without asking again. **Clear history** empties the list.

The command goes to the active terminal; if there is none, a terminal named "DevCommands" is created. For commands with parameters (for instance the branch name in `git checkout -b feature/my-change`), an input box asks for each value first; press Escape to cancel. Values are quoted for the target shell, so spaces, quotes or `$` can't change the command. Copying asks for the same values.

Destructive commands (such as `git reset --hard` or `rm -rf`) show a confirmation dialog with the exact text before it is written or copied. To turn it off, uncheck **DevCommands: Confirm Destructive** (`devcommands.confirmDestructive`) in your user settings.

Examples follow the shell of that terminal: PowerShell, bash (also Git Bash and WSL), zsh or cmd. With no terminal open they follow your default terminal profile. The line "Examples for: …" at the top of the view shows which shell is in use, and the examples update as soon as you switch terminals. Other shells (fish, nu…) get the default profile's syntax.

The recent list, including the values you typed, is stored only on this machine (it is not synced with Settings Sync and never written to the log). Use **Clear history** to delete it.

Requires VS Code 1.99 or later.

Known limitations:

- If the active terminal is running a process (for example a dev server), the text goes to that process. Nothing is run, but switch to a free terminal first.
- If you had already typed something in the terminal, the command is appended after it.

## Search from the Command Palette

Run **DevCommands: Search Commands** from the Command Palette (`Ctrl+Shift+P`, `Cmd+Shift+P` on macOS) to find any command without opening the panel. With an empty box it lists Favorites, Recent, your project's categories and the rest; typing uses the same search as the panel. **Enter** writes the command to the terminal without running it; the item buttons copy it or toggle it as a favorite.

It has no default shortcut. To add one, open **Keyboard Shortcuts** (`Ctrl+K Ctrl+S`), search for `devcommands.searchCommands` and assign your own.

## Project detection

When a folder is open, the categories that fit the project appear first, under **In this project**; the rest stay under **All**. DevCommands only checks whether these files or folders exist in the root of each workspace folder (it never reads them):

| In the root | Category |
| --- | --- |
| `.git` | Git |
| `package.json` | Node |
| `pnpm-lock.yaml` | pnpm |
| `package-lock.json` | npm |
| `Dockerfile`, `compose.yaml`, `compose.yml`, `docker-compose.yml`, `docker-compose.yaml` | Docker |

The sections update as you create or delete those files. Turn it off with the `devcommands.detectProject` setting.

## Custom commands

Add your own categories and commands in your **user** settings, under `devcommands.customCommands`. They appear after the built-in categories and work like any other command: search, favorites, recent, parameters and the destructive-command confirmation. Run **DevCommands: Edit Custom Commands** from the Command Palette to open the setting (it adds an example if it is empty). VS Code completes and checks the fields as you type.

```json
"devcommands.customCommands": [
  {
    "id": "my-project",
    "title": "My project",
    "icon": "rocket",
    "commands": [
      {
        "id": "deploy",
        "title": "Deploy",
        "description": "Deploys to the given environment",
        "command": "pnpm run deploy --env ${env}",
        "params": [{ "name": "env", "label": "Environment", "placeholder": "staging" }],
        "risk": "caution"
      }
    ]
  }
]
```

- `id`, `title` and `command` are required; `icon` (a [Codicon](https://microsoft.github.io/vscode-codicons/dist/codicon.html), `terminal` by default), `description`, `params`, `risk` (`safe` by default), `shells` and `tags` are optional.
- `command` is the bash template; `shells` holds variants for `zsh`, `powershell` or `cmd`. Every `${name}` must be declared in `params`, and templates can't contain line breaks.
- Texts can be a plain string or an object per language, such as `{ "en": "Deploy", "es": "Desplegar" }`.
- They are read only from your user settings (never from a project's `.vscode/settings.json`) and sync across machines with Settings Sync. Invalid entries are skipped; the **DevCommands** output channel says why.

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
code --install-extension devcommands-<version>.vsix
```

In WSL, open a folder with Remote-WSL and use Extensions › "…" › "Install from VSIX…" to install it there.

To regenerate the store icon (`media/icon.png`) after editing `media/logo.svg`, run `node scripts/export-icon.mjs` (it uses your installed Chrome; set `CHROME_PATH` if it is not found).

## License

DevCommands Guide is free to install and use, for personal or commercial work, but it is not open source: all rights are reserved. The source code is public so it can be read and reviewed; copying, modifying or redistributing it is not allowed. See [LICENSE](LICENSE) for the full terms.

It includes third-party components (React and the VS Code codicons) under their own licenses, listed in [ThirdPartyNotices.txt](ThirdPartyNotices.txt).
