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
import type { FavoritesStore } from '../favorites/FavoritesStore';
import { isWebviewMessage, type ExtensionMessage } from '../messaging/protocol';
import { buildCommandText } from '../params/escape';
import type { ParamPrompter } from '../params/ParamPrompter';
import type { RiskAction, RiskConfirmer } from '../risk/RiskConfirmer';
import type { TargetShell } from '../terminal/TargetShell';
import type { TerminalService } from '../terminal/TerminalService';
import { buildWebviewHtml } from './webviewHtml';

/** Lo que se envía en cada `catalog`: el shell de los ejemplos y las categorías. */
export interface SentCatalog {
	readonly shell: ShellId;
	readonly categories: readonly CategorySummary[];
}

/**
 * Texto de un comando listo para enviar o copiar, o por qué no lo hay: id desconocido, cuadro de
 * un valor cancelado o aviso de comando destructivo rechazado.
 */
type CommandText =
	| { readonly kind: 'text'; readonly text: string }
	| { readonly kind: 'unknown' }
	| { readonly kind: 'cancelled' }
	| { readonly kind: 'declined' };

/** Proveedor de la vista lateral: carga el webview de React y atiende sus mensajes. */
export class CommandsViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
	static readonly viewId = 'devcommands.commands';

	private readonly catalogEmitter = new vscode.EventEmitter<SentCatalog>();
	/** Se dispara tras enviar `catalog` al webview: tras cada `ready` y al cambiar el shell de destino. */
	readonly onDidSendCatalog = this.catalogEmitter.event;
	private readonly favoritesEmitter = new vscode.EventEmitter<readonly string[]>();
	/** Se dispara tras enviar `favorites` al webview: tras cada `ready` y cada cambio. */
	readonly onDidSendFavorites = this.favoritesEmitter.event;
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
		private readonly params: ParamPrompter,
		private readonly risk: RiskConfirmer,
		private readonly favorites: FavoritesStore,
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
	 * Texto del comando con ese id para el shell de destino de este momento (el del clic). Sin
	 * parámetros es el ejemplo visible; con parámetros, pide los valores y los escapa para ese shell.
	 * Si el comando es `destructive`, pide después la confirmación con el texto ya construido.
	 * Lo usan la terminal y el portapapeles, para que lo enviado y lo copiado no puedan divergir.
	 */
	private async commandText(commandId: string, action: RiskAction): Promise<CommandText> {
		const command = this.catalog.getCommand(commandId);
		if (!command) {
			return { kind: 'unknown' };
		}
		const locale = resolveLocale(vscode.env.language);
		const shell = this.targetShell.current();
		let text: string;
		if (command.params?.length) {
			const values = await this.params.ask(command, locale, shell);
			if (!values) {
				return { kind: 'cancelled' };
			}
			text = buildCommandText(command, shell, values);
		} else {
			text = buildExample(command, locale, shell);
		}
		return (await this.risk.confirm(command, locale, text, action)) ? { kind: 'text', text } : { kind: 'declined' };
	}

	/** Envía `catalog` con los ejemplos construidos para `shell`. */
	private postCatalog(webview: vscode.Webview, shell: ShellId): void {
		const categories = buildCategorySummaries(this.catalog.getCategories(), resolveLocale(vscode.env.language), shell);
		void webview.postMessage({ type: 'catalog', shell, categories } satisfies ExtensionMessage);
		this.catalogEmitter.fire({ shell, categories });
	}

	/** Envía `favorites` con la lista dada (o la guardada) al webview listo, si lo hay. */
	private postFavorites(webview: vscode.Webview | undefined, commandIds: readonly string[] = this.favorites.list()): void {
		if (webview) {
			void webview.postMessage({ type: 'favorites', commandIds } satisfies ExtensionMessage);
		}
		this.favoritesEmitter.fire(commandIds);
	}

	/**
	 * Marca o desmarca como favorito el comando con ese id y envía la lista nueva. Con un id que no
	 * es del catálogo no cambia nada y registra una advertencia.
	 */
	async toggleFavorite(commandId: string): Promise<void> {
		const next = await this.favorites.toggle(commandId);
		if (!next) {
			this.log.warn('Comando desconocido, no se marca como favorito:', commandId.slice(0, 200));
			return;
		}
		this.log.info('Favoritos:', next.length);
		this.postFavorites(this.readyWebview, next);
	}

	/**
	 * Escribe en la terminal, sin ejecutarlo, el comando del catálogo con ese id (pidiendo antes los
	 * valores de sus parámetros y, si es destructivo, la confirmación). Si el id no existe, el
	 * usuario cancela un valor o rechaza el aviso, no escribe nada.
	 */
	sendToTerminal(commandId: string): void {
		// Puede esperar a los cuadros de los valores, al aviso y a que el shell de una terminal nueva
		// esté listo; no bloquea la vista.
		void this.commandText(commandId, 'send')
			.then(async (result) => {
				if (result.kind === 'unknown') {
					this.log.warn('Comando desconocido, no se escribe en la terminal:', commandId.slice(0, 200));
					return;
				}
				if (result.kind === 'cancelled') {
					this.log.info('Envío cancelado:', commandId);
					return;
				}
				if (result.kind === 'declined') {
					this.log.info('Envío no confirmado:', commandId);
					return;
				}
				await this.terminal.write(result.text);
				this.log.info('Comando escrito en la terminal:', commandId);
			})
			.catch((error: unknown) => this.log.error('No se pudo escribir en la terminal:', String(error)));
	}

	/**
	 * Copia al portapapeles el comando del catálogo con ese id (pidiendo antes los valores de sus
	 * parámetros y, si es destructivo, la confirmación). Devuelve `true` si se copió; con un id
	 * desconocido, si el usuario cancela un valor o rechaza el aviso, o si el portapapeles falla, no
	 * lo modifica y devuelve `false`.
	 */
	async copyToClipboard(commandId: string): Promise<boolean> {
		let result: CommandText;
		try {
			result = await this.commandText(commandId, 'copy');
		} catch (error) {
			this.log.error('No se pudo construir el comando:', String(error));
			return false;
		}
		if (result.kind === 'unknown') {
			this.log.warn('Comando desconocido, no se copia al portapapeles:', commandId.slice(0, 200));
			return false;
		}
		if (result.kind === 'cancelled') {
			this.log.info('Copia cancelada:', commandId);
			return false;
		}
		if (result.kind === 'declined') {
			this.log.info('Copia no confirmada:', commandId);
			return false;
		}
		if (!(await this.clipboard.copy(result.text))) {
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
					this.postFavorites(webview);
					break;
				}
				case 'sendToTerminal':
					this.sendToTerminal(message.commandId);
					break;
				case 'toggleFavorite':
					this.toggleFavorite(message.commandId).catch((error: unknown) =>
						this.log.error('No se pudieron guardar los favoritos:', String(error)),
					);
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
		this.favoritesEmitter.dispose();
	}
}
