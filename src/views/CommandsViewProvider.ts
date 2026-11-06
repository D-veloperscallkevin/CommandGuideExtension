import { randomBytes } from 'node:crypto';
import * as vscode from 'vscode';
import {
	buildCategorySummaries,
	buildDisplayText,
	buildExample,
	CatalogService,
	resolveLocale,
	type CategorySummary,
} from '../catalog/CatalogService';
import type { Locale, ShellId } from '../catalog/types';
import type { ClipboardService } from '../clipboard/ClipboardService';
import type { FavoritesStore } from '../favorites/FavoritesStore';
import type { HistoryEntry, HistoryStore } from '../history/HistoryStore';
import { isWebviewMessage, type ExtensionMessage, type HistoryItem } from '../messaging/protocol';
import { buildCommandText, validateValue } from '../params/escape';
import type { ParamPrompter } from '../params/ParamPrompter';
import type { SearchSnapshot } from '../quickPick/items';
import type { RiskAction, RiskConfirmer } from '../risk/RiskConfirmer';
import type { TargetShell } from '../terminal/TargetShell';
import type { TerminalService } from '../terminal/TerminalService';
import { buildWebviewHtml } from './webviewHtml';

/** Lo que se envía en cada `catalog`: el shell de los ejemplos, las categorías y las detectadas. */
export interface SentCatalog {
	readonly shell: ShellId;
	readonly categories: readonly CategorySummary[];
	readonly detected: readonly string[];
}

/** Lo que el proveedor usa de `ProjectDetector`. */
export interface DetectedCategories {
	current(): ReadonlySet<string>;
	onDidChange(listener: (detected: ReadonlySet<string>) => unknown): { dispose(): unknown };
}

/**
 * Texto de un comando listo para enviar o copiar (con los valores usados, que se registran en el
 * historial), o por qué no lo hay: id desconocido, cuadro de un valor cancelado o aviso de comando
 * destructivo rechazado.
 */
type CommandText =
	| { readonly kind: 'text'; readonly text: string; readonly values: ReadonlyMap<string, string> }
	| { readonly kind: 'unknown' }
	| { readonly kind: 'cancelled' }
	| { readonly kind: 'declined' };

/** Si todos los valores valen para ese shell (los del historial pueden venir de otro). */
const allValid = (values: ReadonlyMap<string, string>, shell: ShellId): boolean =>
	[...values.values()].every((value) => validateValue(value, shell) === undefined);

/** Proveedor de la vista lateral: carga el webview de React y atiende sus mensajes. */
export class CommandsViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
	static readonly viewId = 'devcommands.commands';

	private readonly catalogEmitter = new vscode.EventEmitter<SentCatalog>();
	/** Se dispara tras enviar `catalog` al webview: tras cada `ready` y al cambiar el shell de destino. */
	readonly onDidSendCatalog = this.catalogEmitter.event;
	private readonly favoritesEmitter = new vscode.EventEmitter<readonly string[]>();
	/** Se dispara tras enviar `favorites` al webview: tras cada `ready` y cada cambio. */
	readonly onDidSendFavorites = this.favoritesEmitter.event;
	private readonly historyEmitter = new vscode.EventEmitter<readonly HistoryItem[]>();
	/** Se dispara tras enviar `history` al webview: tras cada `ready`, cada cambio y cada cambio de shell. */
	readonly onDidSendHistory = this.historyEmitter.event;
	/** Webview que ya ha completado el handshake; solo a él se reenvía el catálogo. */
	private readyWebview: vscode.Webview | undefined;
	private readonly shellSubscription: { dispose(): unknown };
	private readonly catalogSubscription: { dispose(): unknown };
	private readonly projectSubscription: { dispose(): unknown };

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
		private readonly history: HistoryStore,
		private readonly project: DetectedCategories,
		/** Abre la página de patrocinio del manifiesto; nunca lanza. */
		private readonly openSponsor: () => Promise<void>,
		private readonly catalog = new CatalogService(),
	) {
		this.shellSubscription = targetShell.onDidChange((shell) => {
			if (this.readyWebview) {
				this.log.info('Shell de destino:', shell);
				this.postCatalog(this.readyWebview, shell);
				// Los textos del historial dependen del shell.
				this.postHistory(this.readyWebview);
			}
		});
		// Cambiaron las categorías del proyecto: solo cambia `detected`.
		this.projectSubscription = project.onDidChange(() => {
			if (this.readyWebview) {
				this.postCatalog(this.readyWebview, this.targetShell.current());
			}
		});
		// Cambiaron los comandos propios: catálogo nuevo y, con él, favoritos e historial filtrados.
		this.catalogSubscription = catalog.onDidChange(() => {
			if (this.readyWebview) {
				this.postCatalog(this.readyWebview, this.targetShell.current());
				this.postFavorites(this.readyWebview);
				this.postHistory(this.readyWebview);
			}
		});
	}

	/**
	 * Texto del comando con ese id para el shell de destino de este momento (el del clic). Sin
	 * parámetros es el ejemplo visible; con parámetros, pide los valores y los escapa para ese shell.
	 * Si el comando es `destructive`, pide después la confirmación con el texto ya construido.
	 * Lo usan la terminal y el portapapeles, para que lo enviado y lo copiado no puedan divergir.
	 *
	 * Con `stored` (los valores de una entrada del historial), los usa sin preguntar si todos son
	 * válidos para el shell de destino; si alguno no lo es, los pide con esos valores ya escritos.
	 */
	private async commandText(
		commandId: string,
		action: RiskAction,
		stored?: ReadonlyMap<string, string>,
	): Promise<CommandText> {
		const command = this.catalog.getCommand(commandId);
		if (!command) {
			return { kind: 'unknown' };
		}
		const locale = resolveLocale(vscode.env.language);
		const shell = this.targetShell.current();
		let text: string;
		let values: ReadonlyMap<string, string> = new Map();
		if (command.params?.length) {
			const asked =
				stored && allValid(stored, shell) ? stored : await this.params.ask(command, locale, shell, stored);
			if (!asked) {
				return { kind: 'cancelled' };
			}
			values = asked;
			text = buildCommandText(command, shell, values);
		} else {
			text = buildExample(command, locale, shell);
		}
		return (await this.risk.confirm(command, locale, text, action))
			? { kind: 'text', text, values }
			: { kind: 'declined' };
	}

	/** Categorías resumidas para `shell` y, en su orden, los ids de las detectadas en el proyecto. */
	private summaries(shell: ShellId): { categories: CategorySummary[]; detected: string[] } {
		const categories = buildCategorySummaries(this.catalog.getCategories(), resolveLocale(vscode.env.language), shell);
		const found = this.project.current();
		return { categories, detected: categories.filter((c) => found.has(c.id)).map((c) => c.id) };
	}

	/** Entradas del historial tal como las ve el webview con el shell de destino actual. */
	private historyItems(entries: readonly HistoryEntry[] = this.history.list()): HistoryItem[] {
		const locale = resolveLocale(vscode.env.language);
		const shell = this.targetShell.current();
		return entries.flatMap((entry) => this.historyItem(entry, locale, shell) ?? []);
	}

	/** Shell de destino actual (para los avisos del buscador). */
	currentShell(): ShellId {
		return this.targetShell.current();
	}

	/**
	 * Lo que muestra el buscador de la paleta: lo mismo que recibe el panel (catálogo, favoritos,
	 * historial y categorías detectadas) con el idioma y el shell de destino actuales.
	 */
	searchSnapshot(): SearchSnapshot {
		const { categories, detected } = this.summaries(this.targetShell.current());
		return { categories, detected, favorites: this.favorites.list(), history: this.historyItems() };
	}

	/** Envía `catalog` con los ejemplos construidos para `shell` y las categorías detectadas. */
	private postCatalog(webview: vscode.Webview, shell: ShellId): void {
		const { categories, detected } = this.summaries(shell);
		void webview.postMessage({ type: 'catalog', shell, categories, detected } satisfies ExtensionMessage);
		this.catalogEmitter.fire({ shell, categories, detected });
	}

	/** Envía `favorites` con la lista dada (o la guardada) al webview listo, si lo hay. */
	private postFavorites(webview: vscode.Webview | undefined, commandIds: readonly string[] = this.favorites.list()): void {
		if (webview) {
			void webview.postMessage({ type: 'favorites', commandIds } satisfies ExtensionMessage);
		}
		this.favoritesEmitter.fire(commandIds);
	}

	/**
	 * Entrada tal como la ve el webview con `shell`: con sus valores escapados si todos valen para
	 * ese shell; si no, con los valores sin escapar y `needsInput` (al enviarla se piden de nuevo).
	 * `undefined` si el comando ya no existe.
	 */
	private historyItem(entry: HistoryEntry, locale: Locale, shell: ShellId): HistoryItem | undefined {
		const command = this.catalog.getCommand(entry.commandId);
		if (!command) {
			return undefined;
		}
		const base = { id: entry.id, commandId: entry.commandId };
		if (!command.params?.length) {
			return { ...base, text: buildExample(command, locale, shell), needsInput: false };
		}
		const values = new Map(Object.entries(entry.values));
		return allValid(values, shell)
			? { ...base, text: buildCommandText(command, shell, values), needsInput: false }
			: { ...base, text: buildDisplayText(command, shell, values), needsInput: true };
	}

	/** Envía `history` con las entradas dadas (o las guardadas) al webview listo, si lo hay. */
	private postHistory(webview: vscode.Webview | undefined, entries: readonly HistoryEntry[] = this.history.list()): void {
		const items = this.historyItems(entries);
		if (webview) {
			void webview.postMessage({ type: 'history', entries: items } satisfies ExtensionMessage);
		}
		this.historyEmitter.fire(items);
	}

	/** La entrada del historial con esa clave, o `undefined` (con una advertencia) si ya no está. */
	private recentEntry(entryId: string): HistoryEntry | undefined {
		const entry = this.history.get(entryId);
		if (!entry) {
			this.log.warn('Entrada del historial desconocida:', entryId);
		}
		return entry;
	}

	/** Vacía el historial y envía la lista vacía. */
	async clearHistory(): Promise<void> {
		await this.history.clear();
		this.log.info('Historial borrado');
		this.postHistory(this.readyWebview, []);
	}

	/**
	 * Marca o desmarca como favorito el comando con ese id, envía la lista nueva y la devuelve. Con
	 * un id que no es del catálogo no cambia nada, registra una advertencia y devuelve `undefined`.
	 */
	async toggleFavorite(commandId: string): Promise<readonly string[] | undefined> {
		const next = await this.favorites.toggle(commandId);
		if (!next) {
			this.log.warn('Comando desconocido, no se marca como favorito:', commandId.slice(0, 200));
			return undefined;
		}
		this.log.info('Favoritos:', next.length);
		this.postFavorites(this.readyWebview, next);
		return next;
	}

	/**
	 * Escribe en la terminal, sin ejecutarlo, el comando del catálogo con ese id (pidiendo antes los
	 * valores de sus parámetros y, si es destructivo, la confirmación). Si el id no existe, el
	 * usuario cancela un valor o rechaza el aviso, no escribe nada.
	 */
	sendToTerminal(commandId: string): void {
		// Puede esperar a los cuadros de los valores, al aviso y a que el shell de una terminal nueva
		// esté listo; no bloquea la vista.
		void this.send(commandId);
	}

	/**
	 * Escribe en la terminal, sin ejecutarlo, el comando de esa entrada del historial con sus valores
	 * guardados (ver `commandText`). Si la entrada ya no está, no escribe nada. Termina cuando el
	 * comando se ha escrito y registrado, o se ha descartado.
	 */
	async sendRecent(entryId: string): Promise<void> {
		const entry = this.recentEntry(entryId);
		if (entry) {
			await this.send(entry.commandId, new Map(Object.entries(entry.values)));
		}
	}

	/** Escribe el comando en la terminal y, si se escribió, lo registra en el historial. */
	private send(commandId: string, stored?: ReadonlyMap<string, string>): Promise<void> {
		return this.commandText(commandId, 'send', stored)
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
				await this.record(commandId, result.values);
			})
			.catch((error: unknown) => this.log.error('No se pudo escribir en la terminal:', String(error)));
	}

	/** Registra un envío en el historial y envía la lista nueva. Un fallo al guardar no afecta al envío. */
	private async record(commandId: string, values: ReadonlyMap<string, string>): Promise<void> {
		try {
			const entries = await this.history.record(commandId, values);
			this.log.info('Historial:', entries.length);
			this.postHistory(this.readyWebview, entries);
		} catch (error) {
			this.log.error('No se pudo guardar el historial:', String(error));
		}
	}

	/**
	 * Copia al portapapeles el comando del catálogo con ese id (pidiendo antes los valores de sus
	 * parámetros y, si es destructivo, la confirmación). Devuelve `true` si se copió; con un id
	 * desconocido, si el usuario cancela un valor o rechaza el aviso, o si el portapapeles falla, no
	 * lo modifica y devuelve `false`.
	 */
	async copyToClipboard(commandId: string, stored?: ReadonlyMap<string, string>): Promise<boolean> {
		let result: CommandText;
		try {
			result = await this.commandText(commandId, 'copy', stored);
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

	/**
	 * Copia al portapapeles el comando de esa entrada del historial con sus valores guardados, sin
	 * registrarlo. Devuelve el id del comando si se copió; `undefined` si la entrada ya no está o la
	 * copia no se hizo.
	 */
	async copyRecent(entryId: string): Promise<string | undefined> {
		const entry = this.recentEntry(entryId);
		if (!entry) {
			return undefined;
		}
		const copied = await this.copyToClipboard(entry.commandId, new Map(Object.entries(entry.values)));
		return copied ? entry.commandId : undefined;
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
					this.postHistory(webview);
					break;
				}
				case 'sendToTerminal':
					this.sendToTerminal(message.commandId);
					break;
				case 'sendRecent':
					void this.sendRecent(message.entryId);
					break;
				case 'copyRecent': {
					const { entryId } = message;
					void this.copyRecent(entryId).then((commandId) => {
						if (commandId) {
							void webview.postMessage({ type: 'copied', commandId, entryId } satisfies ExtensionMessage);
						}
					});
					break;
				}
				case 'clearHistory':
					this.clearHistory().catch((error: unknown) =>
						this.log.error('No se pudo borrar el historial:', String(error)),
					);
					break;
				case 'openSponsor':
					// La URL la decide la extensión (manifiesto); el mensaje no lleva ninguna.
					void this.openSponsor();
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
		this.catalogSubscription.dispose();
		this.projectSubscription.dispose();
		this.catalogEmitter.dispose();
		this.favoritesEmitter.dispose();
		this.historyEmitter.dispose();
	}
}
