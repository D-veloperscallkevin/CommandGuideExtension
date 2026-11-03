import * as vscode from 'vscode';
import { CatalogService } from './catalog/CatalogService';
import { ClipboardService } from './clipboard/ClipboardService';
import { FavoritesStore } from './favorites/FavoritesStore';
import { MAX_VALUE_LENGTH } from './params/escape';
import { ParamPrompter } from './params/ParamPrompter';
import { RiskConfirmer } from './risk/RiskConfirmer';
import { TargetShell } from './terminal/TargetShell';
import { TerminalService } from './terminal/TerminalService';
import { CommandsViewProvider, type SentCatalog } from './views/CommandsViewProvider';

/** API pública de la extensión (`extension.exports`); la usan los tests de integración. */
export interface DevCommandsApi {
	/** Catálogo enviado al webview: tras cada handshake y al cambiar el shell de destino. */
	readonly onDidSendCatalog: vscode.Event<SentCatalog>;
	/** Lo mismo que pulsar un comando en la vista: lo escribe en la terminal sin ejecutarlo. */
	sendToTerminal(commandId: string): void;
	/**
	 * Lo mismo que el botón de copiar: copia el comando y devuelve si funcionó (`false` si se cancela
	 * un valor o se rechaza el aviso de comando destructivo).
	 */
	copyToClipboard(commandId: string): Promise<boolean>;
	/** Lo mismo que la estrella: alterna el favorito y envía la lista (si el id existe). */
	toggleFavorite(commandId: string): Promise<void>;
	/** Lista de favoritos enviada al webview: tras cada handshake y cada cambio. */
	readonly onDidSendFavorites: vscode.Event<readonly string[]>;
}

// Se activa solo al abrir la vista (evento implícito onView:devcommands.commands).
export function activate(context: vscode.ExtensionContext): DevCommandsApi {
	const log = vscode.window.createOutputChannel('DevCommands', { log: true });
	const version = String(context.extension.packageJSON.version);
	const terminal = new TerminalService(vscode.window);
	const clipboard = new ClipboardService(vscode.env.clipboard);
	const targetShell = new TargetShell(vscode.window, vscode.env, process.platform);
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
	context.globalState.setKeysForSync([FavoritesStore.key]);
	const favorites = new FavoritesStore(context.globalState, (id) => catalog.getCommand(id) !== undefined);
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
		catalog,
	);

	context.subscriptions.push(
		log,
		targetShell,
		provider,
		vscode.window.registerWebviewViewProvider(CommandsViewProvider.viewId, provider),
	);

	return {
		onDidSendCatalog: provider.onDidSendCatalog,
		sendToTerminal: (commandId) => provider.sendToTerminal(commandId),
		copyToClipboard: (commandId) => provider.copyToClipboard(commandId),
		toggleFavorite: (commandId) => provider.toggleFavorite(commandId),
		onDidSendFavorites: provider.onDidSendFavorites,
	};
}

export function deactivate() {}
