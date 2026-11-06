// Categorías del proyecto abierto, actualizadas en vivo. No importa `vscode`: recibe interfaces
// mínimas (en la extensión las rellena `vscode.workspace`), así se testea con Vitest.
import { compileSignals, detectCategories, watchGlob, type CompiledSignals, type ProjectSignal } from './detect';

export interface Disposable {
	dispose(): unknown;
}

/** Forma de `vscode.Event`. */
export type Subscribe<T> = (listener: (event: T) => unknown) => Disposable;

/** Lo que la detección necesita del workspace. `F` es la carpeta (en la extensión, `vscode.Uri`). */
export interface ProjectWorkspace<F> {
	/** Carpetas abiertas (vacío sin carpeta). */
	folders(): readonly F[];
	readonly onDidChangeFolders: Subscribe<unknown>;
	/** Nombres de las entradas de la raíz de `folder`, o de su subcarpeta `dir`. */
	list(folder: F, dir?: string): Promise<readonly string[]>;
	/** Vigila la creación y el borrado de entradas de `glob`, relativo a la raíz de `folder`. */
	watch(folder: F, glob: string, onChange: () => void): Disposable;
	/** Valor del ajuste `devcommands.detectProject`. */
	enabled(): boolean;
	readonly onDidChangeEnabled: Subscribe<unknown>;
}

/** Espera tras un cambio de archivos o carpetas, para agrupar varios en una detección. */
export const DETECT_DELAY_MS = 200;

const EMPTY: ReadonlySet<string> = new Set();

export class ProjectDetector<F> implements Disposable {
	private readonly listeners = new Set<(detected: ReadonlySet<string>) => unknown>();
	private readonly subscriptions: Disposable[];
	private watchers: Disposable[] = [];
	private detected: ReadonlySet<string> = EMPTY;
	private timer: ReturnType<typeof setTimeout> | undefined;
	/** Sube en cada detección: un resultado de una generación anterior se descarta. */
	private generation = 0;
	private disposed = false;
	private readonly workspace: ProjectWorkspace<F>;
	private readonly signals: CompiledSignals;
	private readonly glob: string;

	/** `signals`: los patrones `detect` del catálogo (en la extensión, generados en el build). */
	constructor(workspace: ProjectWorkspace<F>, signals: readonly ProjectSignal[]) {
		this.workspace = workspace;
		this.signals = compileSignals(signals);
		this.glob = watchGlob(this.signals);
		this.subscriptions = [
			workspace.onDidChangeFolders(() => {
				this.rewatch();
				this.schedule();
			}),
			workspace.onDidChangeEnabled(() => {
				this.rewatch();
				void this.refresh();
			}),
		];
		this.rewatch();
		void this.refresh();
	}

	/** Ids de las categorías detectadas ahora (vacío si la detección está desactivada). */
	current(): ReadonlySet<string> {
		return this.detected;
	}

	/** Se llama cuando cambian las categorías detectadas. */
	onDidChange(listener: (detected: ReadonlySet<string>) => unknown): Disposable {
		this.listeners.add(listener);
		return { dispose: () => this.listeners.delete(listener) };
	}

	/** Detecta ahora y avisa si el resultado cambió. */
	async refresh(): Promise<void> {
		this.cancelTimer();
		const generation = ++this.generation;
		const next = this.workspace.enabled()
			? await detectCategories(this.workspace.folders(), this.signals, (folder, dir) => this.workspace.list(folder, dir))
			: EMPTY;
		if (this.disposed || generation !== this.generation || sameIds(next, this.detected)) {
			return;
		}
		this.detected = next;
		for (const listener of this.listeners) {
			listener(next);
		}
	}

	dispose(): void {
		this.disposed = true;
		this.cancelTimer();
		this.disposeWatchers();
		for (const subscription of this.subscriptions) {
			subscription.dispose();
		}
		this.listeners.clear();
	}

	private schedule(): void {
		this.cancelTimer();
		this.timer = setTimeout(() => void this.refresh(), DETECT_DELAY_MS);
	}

	private cancelTimer(): void {
		if (this.timer !== undefined) {
			clearTimeout(this.timer);
			this.timer = undefined;
		}
	}

	/** Un watcher por carpeta, solo con la detección activa. */
	private rewatch(): void {
		this.disposeWatchers();
		if (this.workspace.enabled()) {
			this.watchers = this.workspace.folders().map((folder) => this.workspace.watch(folder, this.glob, () => this.schedule()));
		}
	}

	private disposeWatchers(): void {
		for (const watcher of this.watchers) {
			watcher.dispose();
		}
		this.watchers = [];
	}
}

function sameIds(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
	return a.size === b.size && [...a].every((id) => b.has(id));
}
