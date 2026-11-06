import { randomUUID } from 'node:crypto';
import * as vscode from 'vscode';
import { CatalogService } from './catalog/CatalogService';
import { ClipboardService } from './clipboard/ClipboardService';
import { registerCustomCommands } from './customCommands';
import { createProjectDetector } from './project/vscodeProject';
import { searchLabels, showCommandSearch } from './quickPick/CommandSearch';
import { searchEntries, type SearchEntry } from './quickPick/items';
import { FavoritesStore } from './favorites/FavoritesStore';
import { HistoryStore } from './history/HistoryStore';
import type { HistoryItem } from './messaging/protocol';
import { MAX_VALUE_LENGTH } from './params/escape';
import { ParamPrompter } from './params/ParamPrompter';
import { RiskConfirmer } from './risk/RiskConfirmer';
import { TargetShell } from './terminal/TargetShell';
import { TerminalActivity } from './terminal/TerminalActivity';
import { openSponsor, sponsorUrl } from './sponsor/sponsorLink';
import { TerminalService } from './terminal/TerminalService';
import { CommandsViewProvider, type SentCatalog } from './views/CommandsViewProvider';

/** API pública de la extensión (`extension.exports`); la usan los tests de integración. */
export interface DevCommandsApi {
	/** Catálogo enviado al webview: tras cada handshake, al cambiar el shell y al cambiar el proyecto. */
	readonly onDidSendCatalog: vscode.Event<SentCatalog>;
	/** Lo mismo que pulsar un comando en la vista: lo escribe en la terminal sin ejecutarlo. */
	sendToTerminal(commandId: string): void;
	/**
	 * Lo mismo que el botón de copiar: copia el comando y devuelve si funcionó (`false` si se cancela
	 * un valor o se rechaza el aviso de comando destructivo).
	 */
	copyToClipboard(commandId: string): Promise<boolean>;
	/** Lo mismo que la estrella: alterna el favorito y envía la lista (si el id existe). */
	toggleFavorite(commandId: string): Promise<unknown>;
	/** Lista de favoritos enviada al webview: tras cada handshake y cada cambio. */
	readonly onDidSendFavorites: vscode.Event<readonly string[]>;
	/** Lo mismo que enviar una entrada de "Recientes": la escribe con sus valores guardados. */
	sendRecent(entryId: string): Promise<void>;
	/** Lo mismo que el botón "Borrar historial". */
	clearHistory(): Promise<void>;
	/** Historial enviado al webview: tras cada handshake, cada cambio y cada cambio de shell. */
	readonly onDidSendHistory: vscode.Event<readonly HistoryItem[]>;
	/** Elementos del buscador de la paleta para esa búsqueda, con los datos actuales. */
	searchEntries(query: string): readonly SearchEntry[];
	/** Detecta ahora las categorías del proyecto y las devuelve ordenadas por id. */
	detectProject(): Promise<readonly string[]>;
}

// Se activa al terminar el arranque de VS Code (onStartupFinished), para saber desde el principio
// qué terminales están ocupadas con un programa; el webview no se crea hasta abrir la vista.
export function activate(context: vscode.ExtensionContext): DevCommandsApi {
	const log = vscode.window.createOutputChannel('DevCommands', { log: true });
	const version = String(context.extension.packageJSON.version);
	// Destino común del envío y de los ejemplos: la activa si está libre; si no, la última libre usada.
	const activity = new TerminalActivity<vscode.Terminal>(vscode.window);
	const terminal = new TerminalService(vscode.window, () => activity.target());
	const clipboard = new ClipboardService(vscode.env.clipboard);
	const targetShell = new TargetShell(vscode.env, process.platform, activity);
	const params = new ParamPrompter(vscode.window, {
		empty: vscode.l10n.t('Enter a value.'),
		control: vscode.l10n.t("The value can't contain line breaks or control characters."),
		tooLong: vscode.l10n.t("The value can't be longer than {0} characters.", MAX_VALUE_LENGTH),
		cmdUnsafe: vscode.l10n.t('In cmd, the value can\'t contain " or %.'),
		powershellUnsafe: vscode.l10n.t('In PowerShell, the value can\'t contain ".'),
	});
	const risk = new RiskConfirmer(
		vscode.window,
		() => vscode.workspace.getConfiguration('devcommands').get<boolean>('confirmDestructive', true),
		{
			message: (title) => vscode.l10n.t('"{0}" is a destructive command.', title),
			sendDetail: (text) =>
				vscode.l10n.t('It will be written to the terminal without running it. Review it before pressing Enter:\n\n{0}', text),
			copyDetail: (text) => vscode.l10n.t('It will be copied to the clipboard:\n\n{0}', text),
			sendButton: vscode.l10n.t('Write to Terminal'),
			copyButton: vscode.l10n.t('Copy'),
		},
	);
	const catalog = new CatalogService();
	// Antes del proveedor: el primer catalog ya incluye los comandos propios.
	const customCommands = registerCustomCommands(catalog, log);
	context.globalState.setKeysForSync([FavoritesStore.key]);
	const favorites = new FavoritesStore(context.globalState, (id) => catalog.getCommand(id) !== undefined);
	// El historial no se sincroniza: guarda valores tecleados y depende de este equipo.
	const history = new HistoryStore(
		context.globalState,
		(id) => {
			const command = catalog.getCommand(id);
			return command && (command.params ?? []).map((p) => p.name);
		},
		randomUUID,
	);
	const project = createProjectDetector();
	// Misma URL que el botón Sponsor de la ficha; validada aquí, nunca viene del webview.
	const sponsor = sponsorUrl(context.extension.packageJSON);
	const provider = new CommandsViewProvider(
		context.extensionUri,
		version,
		log,
		terminal,
		clipboard,
		targetShell,
		params,
		risk,
		favorites,
		history,
		project,
		() => openSponsor({ url: sponsor, openExternal: vscode.env.openExternal, parse: vscode.Uri.parse, log }),
		catalog,
	);

	context.subscriptions.push(
		log,
		activity,
		targetShell,
		customCommands,
		project,
		provider,
		vscode.window.registerWebviewViewProvider(CommandsViewProvider.viewId, provider),
		vscode.commands.registerCommand('devcommands.searchCommands', () => showCommandSearch(provider, log)),
	);

	return {
		onDidSendCatalog: provider.onDidSendCatalog,
		searchEntries: (query) => searchEntries(provider.searchSnapshot(), query, searchLabels()),
		detectProject: async () => {
			await project.refresh();
			return [...project.current()].sort();
		},
		sendToTerminal: (commandId) => provider.sendToTerminal(commandId),
		copyToClipboard: (commandId) => provider.copyToClipboard(commandId),
		toggleFavorite: (commandId) => provider.toggleFavorite(commandId),
		onDidSendFavorites: provider.onDidSendFavorites,
		sendRecent: (entryId) => provider.sendRecent(entryId),
		clearHistory: () => provider.clearHistory(),
		onDidSendHistory: provider.onDidSendHistory,
	};
}

export function deactivate() {}
