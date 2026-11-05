// "DevCommands: Buscar comandos": buscador de la paleta (QuickPick) sobre los mismos datos y flujos
// que el panel. Los elementos se construyen con `searchEntries` (lógica pura) y el filtro es el
// del panel, no el difuso de VS Code.
import * as vscode from 'vscode';
import type { ShellId } from '../catalog/types';
import { searchEntries, type SearchCommandEntry, type SearchEntry, type SearchSnapshot } from './items';

/** Lo que el buscador usa del proveedor de la vista (los mismos flujos que el panel). */
export interface CommandSearchActions {
	searchSnapshot(): SearchSnapshot;
	currentShell(): ShellId;
	sendToTerminal(commandId: string): void;
	sendRecent(entryId: string): Promise<void>;
	copyToClipboard(commandId: string): Promise<boolean>;
	/** Id del comando copiado, o `undefined` si no se copió. */
	copyRecent(entryId: string): Promise<string | undefined>;
	/** Lista nueva de favoritos, o `undefined` si el id no existe. */
	toggleFavorite(commandId: string): Promise<readonly string[] | undefined>;
}

const SHELL_NAMES: Readonly<Record<ShellId, string>> = { powershell: 'PowerShell', bash: 'bash', zsh: 'zsh', cmd: 'cmd' };
/** Duración de la confirmación de copia en la barra de estado. */
const COPIED_MESSAGE_MS = 3000;

interface Item extends vscode.QuickPickItem {
	readonly entry?: SearchCommandEntry;
}

/** Textos fijos del buscador, traducidos. */
export function searchLabels() {
	return { favorites: vscode.l10n.t('Favorites'), recent: vscode.l10n.t('Recent') };
}

/** Elementos del QuickPick a partir del modelo. */
function toItems(entries: readonly SearchEntry[], shell: ShellId): Item[] {
	const copy: vscode.QuickInputButton = { iconPath: new vscode.ThemeIcon('copy'), tooltip: vscode.l10n.t('Copy command') };
	const addFavorite: vscode.QuickInputButton = {
		iconPath: new vscode.ThemeIcon('star-empty'),
		tooltip: vscode.l10n.t('Add to favorites'),
	};
	const removeFavorite: vscode.QuickInputButton = {
		iconPath: new vscode.ThemeIcon('star-full'),
		tooltip: vscode.l10n.t('Remove from favorites'),
	};
	return entries.map((entry): Item => {
		if (entry.kind === 'separator') {
			return { label: entry.label, kind: vscode.QuickPickItemKind.Separator };
		}
		const notice = entry.needsInput
			? vscode.l10n.t("Not valid in {0}: you'll be asked for the value when sending it.", SHELL_NAMES[shell])
			: entry.description;
		return {
			label: entry.title,
			description: entry.category,
			detail: notice ? `${entry.text} — ${notice}` : entry.text,
			// El filtro es el nuestro: que VS Code no oculte elementos con el suyo.
			alwaysShow: true,
			buttons: [copy, entry.favorite ? removeFavorite : addFavorite],
			entry,
		};
	});
}

/** Abre el buscador. Termina al abrirlo; las acciones se atienden mientras está abierto. */
export function showCommandSearch(actions: CommandSearchActions, log: vscode.LogOutputChannel): void {
	const labels = searchLabels();
	let snapshot = actions.searchSnapshot();
	const shell = actions.currentShell();
	const picker = vscode.window.createQuickPick<Item>();
	picker.title = vscode.l10n.t('DevCommands: Search Commands');
	picker.placeholder = vscode.l10n.t('Type to search by name, description or tag');
	picker.matchOnDescription = false;
	picker.matchOnDetail = false;

	const render = (keepActive = false) => {
		const activeKey = picker.activeItems[0]?.entry?.key;
		const entries = searchEntries(snapshot, picker.value, labels);
		picker.keepScrollPosition = keepActive;
		picker.items = toItems(entries, shell);
		if (keepActive && activeKey) {
			const active = picker.items.find((item) => item.entry?.key === activeKey);
			if (active) {
				picker.activeItems = [active];
			}
		}
	};

	const subscriptions: vscode.Disposable[] = [
		picker.onDidChangeValue(() => render()),
		picker.onDidAccept(() => {
			const entry = picker.activeItems[0]?.entry;
			if (!entry) {
				return;
			}
			picker.hide();
			if (entry.entryId) {
				void actions.sendRecent(entry.entryId);
			} else {
				actions.sendToTerminal(entry.commandId);
			}
		}),
		picker.onDidTriggerItemButton(async ({ item, button }) => {
			const entry = item.entry;
			if (!entry) {
				return;
			}
			try {
				if (button.iconPath instanceof vscode.ThemeIcon && button.iconPath.id === 'copy') {
					const copied = entry.entryId
						? (await actions.copyRecent(entry.entryId)) !== undefined
						: await actions.copyToClipboard(entry.commandId);
					if (copied) {
						vscode.window.setStatusBarMessage(vscode.l10n.t('Copied: {0}', entry.title), COPIED_MESSAGE_MS);
					}
				} else {
					const favorites = await actions.toggleFavorite(entry.commandId);
					if (favorites) {
						snapshot = { ...snapshot, favorites };
						render(true);
					}
				}
			} catch (error: unknown) {
				log.error('Error en el buscador de comandos:', String(error));
			}
		}),
		picker.onDidHide(() => {
			for (const subscription of subscriptions) {
				subscription.dispose();
			}
			picker.dispose();
		}),
	];

	render();
	picker.show();
}
