import { randomBytes } from 'node:crypto';
import * as vscode from 'vscode';
import { buildCategorySummaries, CatalogService, resolveLocale, type CategorySummary } from '../catalog/CatalogService';
import { isWebviewMessage, type ExtensionMessage } from '../messaging/protocol';
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
		private readonly catalog = new CatalogService(),
	) {}

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
					const categories = buildCategorySummaries(this.catalog.getCategories(), locale);
					// postMessage conserva el orden: el webview recibe init antes que catalog.
					void webview.postMessage({ type: 'init', locale, version: this.version } satisfies ExtensionMessage);
					void webview.postMessage({ type: 'catalog', categories } satisfies ExtensionMessage);
					this.catalogEmitter.fire(categories);
					break;
				}
			}
		});
		webviewView.onDidDispose(() => subscription.dispose());
	}

	dispose(): void {
		this.catalogEmitter.dispose();
	}
}
