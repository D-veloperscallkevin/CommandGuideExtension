import { randomBytes } from 'node:crypto';
import * as vscode from 'vscode';
import {
	buildCategorySummaries,
	buildExample,
	CatalogService,
	resolveLocale,
	type CategorySummary,
} from '../catalog/CatalogService';
import type { ShellId } from '../catalog/types';
import type { ClipboardService } from '../clipboard/ClipboardService';
import { isWebviewMessage, type ExtensionMessage } from '../messaging/protocol';
import type { TargetShell } from '../terminal/TargetShell';
import type { TerminalService } from '../terminal/TerminalService';
import { buildWebviewHtml } from './webviewHtml';

/** Lo que se envía en cada `catalog`: el shell de los ejemplos y las categorías. */
export interface SentCatalog {
	readonly shell: ShellId;
	readonly categories: readonly CategorySummary[];
}

/** Proveedor de la vista lateral: carga el webview de React y atiende sus mensajes. */
export class CommandsViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
	static readonly viewId = 'devcommands.commands';

	private readonly catalogEmitter = new vscode.EventEmitter<SentCatalog>();
	/** Se dispara tras enviar `catalog` al webview: tras cada `ready` y al cambiar el shell de destino. */
	readonly onDidSendCatalog = this.catalogEmitter.event;
	/** Webview que ya ha completado el handshake; solo a él se reenvía el catálogo. */
	private readyWebview: vscode.Webview | undefined;
	private readonly shellSubscription: { dispose(): unknown };

	constructor(
		private readonly extensionUri: vscode.Uri,
		private readonly version: string,
		private readonly log: vscode.LogOutputChannel,
		private readonly terminal: TerminalService,
		private readonly clipboard: ClipboardService,
		private readonly targetShell: TargetShell,
		private readonly catalog = new CatalogService(),
	) {
		this.shellSubscription = targetShell.onDidChange((shell) => {
			if (this.readyWebview) {
				this.log.info('Shell de destino:', shell);
				this.postCatalog(this.readyWebview, shell);
			}
		});
	}

	/**
	 * Texto del comando con ese id, con la misma regla que el ejemplo visible y el shell de destino
	 * de este momento. Lo usan la terminal y el portapapeles, para que lo enviado y lo copiado no
	 * puedan divergir.
	 */
	private commandText(commandId: string): string | undefined {
		const command = this.catalog.getCommand(commandId);
		return command && buildExample(command, resolveLocale(vscode.env.language), this.targetShell.current());
	}

	/** Envía `catalog` con los ejemplos construidos para `shell`. */
	private postCatalog(webview: vscode.Webview, shell: ShellId): void {
		const categories = buildCategorySummaries(this.catalog.getCategories(), resolveLocale(vscode.env.language), shell);
		void webview.postMessage({ type: 'catalog', shell, categories } satisfies ExtensionMessage);
		this.catalogEmitter.fire({ shell, categories });
	}

	/**
	 * Escribe en la terminal, sin ejecutarlo, el comando del catálogo con ese id. Si el id no
	 * existe, no escribe nada.
	 */
	sendToTerminal(commandId: string): void {
		const text = this.commandText(commandId);
		if (text === undefined) {
			this.log.warn('Comando desconocido, no se escribe en la terminal:', commandId.slice(0, 200));
			return;
		}
		// Puede esperar a que el shell de una terminal nueva esté listo; no bloquea la vista.
		void this.terminal.write(text).then(
			() => this.log.info('Comando escrito en la terminal:', commandId),
			(error: unknown) => this.log.error('No se pudo escribir en la terminal:', String(error)),
		);
	}

	/**
	 * Copia al portapapeles el comando del catálogo con ese id. Devuelve `true` si se copió; con un
	 * id desconocido o si el portapapeles falla, no lo modifica y devuelve `false`.
	 */
	async copyToClipboard(commandId: string): Promise<boolean> {
		const text = this.commandText(commandId);
		if (text === undefined) {
			this.log.warn('Comando desconocido, no se copia al portapapeles:', commandId.slice(0, 200));
			return false;
		}
		if (!(await this.clipboard.copy(text))) {
			this.log.error('No se pudo copiar al portapapeles:', commandId);
			return false;
		}
		this.log.info('Comando copiado al portapapeles:', commandId);
		return true;
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
					// postMessage conserva el orden: el webview recibe init antes que catalog.
					void webview.postMessage({ type: 'init', locale, version: this.version } satisfies ExtensionMessage);
					this.postCatalog(webview, this.targetShell.current());
					this.readyWebview = webview;
					break;
				}
				case 'sendToTerminal':
					this.sendToTerminal(message.commandId);
					break;
				case 'copyToClipboard': {
					const { commandId } = message;
					void this.copyToClipboard(commandId).then((copied) => {
						if (copied) {
							void webview.postMessage({ type: 'copied', commandId } satisfies ExtensionMessage);
						}
					});
					break;
				}
			}
		});
		webviewView.onDidDispose(() => {
			subscription.dispose();
			if (this.readyWebview === webview) {
				this.readyWebview = undefined;
			}
		});
	}

	dispose(): void {
		this.shellSubscription.dispose();
		this.catalogEmitter.dispose();
	}
}
