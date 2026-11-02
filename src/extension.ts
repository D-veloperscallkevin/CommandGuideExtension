import * as vscode from 'vscode';
import type { CategorySummary } from './catalog/CatalogService';
import { ClipboardService } from './clipboard/ClipboardService';
import { TerminalService } from './terminal/TerminalService';
import { CommandsViewProvider } from './views/CommandsViewProvider';

/** API pública de la extensión (`extension.exports`); la usan los tests de integración. */
export interface DevCommandsApi {
	/** Categorías enviadas al webview tras cada handshake. */
	readonly onDidSendCatalog: vscode.Event<readonly CategorySummary[]>;
	/** Lo mismo que pulsar un comando en la vista: lo escribe en la terminal sin ejecutarlo. */
	sendToTerminal(commandId: string): void;
	/** Lo mismo que el botón de copiar: copia el comando y devuelve si funcionó. */
	copyToClipboard(commandId: string): Promise<boolean>;
}

// Se activa solo al abrir la vista (evento implícito onView:devcommands.commands).
export function activate(context: vscode.ExtensionContext): DevCommandsApi {
	const log = vscode.window.createOutputChannel('DevCommands', { log: true });
	const version = String(context.extension.packageJSON.version);
	const terminal = new TerminalService(vscode.window);
	const clipboard = new ClipboardService(vscode.env.clipboard);
	const provider = new CommandsViewProvider(context.extensionUri, version, log, terminal, clipboard);

	context.subscriptions.push(
		log,
		provider,
		vscode.window.registerWebviewViewProvider(CommandsViewProvider.viewId, provider),
	);

	return {
		onDidSendCatalog: provider.onDidSendCatalog,
		sendToTerminal: (commandId) => provider.sendToTerminal(commandId),
		copyToClipboard: (commandId) => provider.copyToClipboard(commandId),
	};
}

export function deactivate() {}
