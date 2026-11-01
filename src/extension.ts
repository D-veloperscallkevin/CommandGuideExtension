import * as vscode from 'vscode';
import type { CategorySummary } from './catalog/CatalogService';
import { CommandsViewProvider } from './views/CommandsViewProvider';

/** API pública de la extensión (`extension.exports`); la usan los tests de integración. */
export interface DevCommandsApi {
	/** Categorías enviadas al webview tras cada handshake. */
	readonly onDidSendCatalog: vscode.Event<readonly CategorySummary[]>;
}

// Se activa solo al abrir la vista (evento implícito onView:devcommands.commands).
export function activate(context: vscode.ExtensionContext): DevCommandsApi {
	const log = vscode.window.createOutputChannel('DevCommands', { log: true });
	const version = String(context.extension.packageJSON.version);
	const provider = new CommandsViewProvider(context.extensionUri, version, log);

	context.subscriptions.push(
		log,
		provider,
		vscode.window.registerWebviewViewProvider(CommandsViewProvider.viewId, provider),
	);

	return { onDidSendCatalog: provider.onDidSendCatalog };
}

export function deactivate() {}
