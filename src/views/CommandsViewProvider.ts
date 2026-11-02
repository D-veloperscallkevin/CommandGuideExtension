import { randomBytes } from 'node:crypto';
import * as vscode from 'vscode';
import {
	buildCategorySummaries,
	buildExample,
	CatalogService,
	defaultShellFor,
	resolveLocale,
	type CategorySummary,
} from '../catalog/CatalogService';
import { isWebviewMessage, type ExtensionMessage } from '../messaging/protocol';
import type { TerminalService } from '../terminal/TerminalService';
import { buildWebviewHtml } from './webviewHtml';

/** Proveedor de la vista lateral: carga el webview de React y atiende sus mensajes. */
export class CommandsViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
	static readonly viewId = 'devcommands.commands';

	private readonly catalogEmitter = new vscode.EventEmitter<readonly CategorySummary[]>();
	/** Se dispara tras enviar `catalog` al webview (es decir, tras cada `ready` atendido). */
	readonly onDidSendCatalog = this.catalogEmitter.event;

	constructor(
		private readonly extensionUri: vscode.Uri,
		private readonly version: string,
		private readonly log: vscode.LogOutputChannel,
		private readonly terminal: TerminalService,
		private readonly catalog = new CatalogService(),
	) {}

	/**
	 * Escribe en la terminal, sin ejecutarlo, el comando del catálogo con ese id. El texto se
	 * construye aquí con la misma regla que el ejemplo visible; si el id no existe, no escribe nada.
	 */
	sendToTerminal(commandId: string): void {
		const command = this.catalog.getCommand(commandId);
		if (!command) {
			this.log.warn('Comando desconocido, no se escribe en la terminal:', commandId.slice(0, 200));
			return;
		}
		const text = buildExample(command, resolveLocale(vscode.env.language), defaultShellFor(process.platform));
		this.terminal.write(text);
		this.log.info('Comando escrito en la terminal:', commandId);
	}

	resolveWebviewView(webviewView: vscode.WebviewView): void {
		const webviewRoot = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview');
		const { webview } = webviewView;
		webview.options = { enableScripts: true, localResourceRoots: [webviewRoot] };
		webview.html = buildWebviewHtml({
			scriptUri: webview.asWebviewUri(vscode.Uri.joinPath(webviewRoot, 'assets', 'index.js')).toString(),
			styleUri: webview.asWebviewUri(vscode.Uri.joinPath(webviewRoot, 'assets', 'index.css')).toString(),
			cspSource: webview.cspSource,
			nonce: randomBytes(16).toString('base64'),
			lang: resolveLocale(vscode.env.language),
		});

		const subscription = webview.onDidReceiveMessage((message: unknown) => {
			if (!isWebviewMessage(message)) {
				this.log.warn('Mensaje del webview descartado:', JSON.stringify(message)?.slice(0, 200));
				return;
			}
			switch (message.type) {
				case 'ready': {
					const locale = resolveLocale(vscode.env.language);
					const categories = buildCategorySummaries(
						this.catalog.getCategories(),
						locale,
						defaultShellFor(process.platform),
					);
					// postMessage conserva el orden: el webview recibe init antes que catalog.
					void webview.postMessage({ type: 'init', locale, version: this.version } satisfies ExtensionMessage);
					void webview.postMessage({ type: 'catalog', categories } satisfies ExtensionMessage);
					this.catalogEmitter.fire(categories);
					break;
				}
				case 'sendToTerminal':
					this.sendToTerminal(message.commandId);
					break;
			}
		});
		webviewView.onDidDispose(() => subscription.dispose());
	}

	dispose(): void {
		this.catalogEmitter.dispose();
	}
}
