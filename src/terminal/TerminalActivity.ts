// Qué terminales están ocupadas con un programa y en cuál se escribiría. No importa `vscode`:
// recibe `window` con una interfaz mínima (en la extensión, `vscode.window` encaja tal cual),
// así se testea con Vitest.
import { isKnownShell } from './shell';
import type { Disposable, Subscribe } from './TargetShell';

/** Lo que usamos de `vscode.Terminal`. */
export interface ActivityTerminal {
	readonly state: { readonly shell: string | undefined };
	/** `TerminalOptions` (con `shellPath`) o `ExtensionTerminalOptions` (con `pty`). */
	readonly creationOptions: object;
}

/** Lo que usamos de los eventos de ejecución del shell. */
export interface ShellExecutionEvent<T> {
	readonly terminal: T;
	readonly execution: object;
}

/** Lo que usamos de `vscode.window`. */
export interface ActivityWindow<T extends ActivityTerminal> {
	readonly activeTerminal: T | undefined;
	readonly terminals: readonly T[];
	readonly onDidChangeActiveTerminal: Subscribe<T | undefined>;
	readonly onDidCloseTerminal: Subscribe<T>;
	readonly onDidChangeTerminalState: Subscribe<T>;
	readonly onDidStartTerminalShellExecution: Subscribe<ShellExecutionEvent<T>>;
	readonly onDidEndTerminalShellExecution: Subscribe<ShellExecutionEvent<T>>;
}

/** Tipos de `state.shell` que VS Code usa para programas que no son un shell. */
const programShells: ReadonlySet<string> = new Set(['node', 'python', 'julia']);

/**
 * Si la terminal tiene un programa en lugar de un shell: VS Code detecta `node`, `python` o
 * `julia`; es una pseudoterminal de otra extensión (`pty`); o se creó con un ejecutable que no
 * es un shell conocido.
 */
export function isProgramTerminal(terminal: ActivityTerminal): boolean {
	const shell = terminal.state.shell?.toLowerCase();
	if (shell && programShells.has(shell)) {
		return true;
	}
	const options = terminal.creationOptions as { readonly pty?: unknown; readonly shellPath?: unknown };
	if (options.pty) {
		return true;
	}
	return typeof options.shellPath === 'string' && options.shellPath.trim() !== '' && !isKnownShell(options.shellPath);
}

/** Datos para elegir la terminal de destino. */
export interface TargetCandidates<T> {
	readonly active: T | undefined;
	/** Terminales por orden de foco, la más reciente al final. */
	readonly recent: readonly T[];
	/** Todas las terminales abiertas, en el orden de VS Code. */
	readonly terminals: readonly T[];
	readonly isBusy: (terminal: T) => boolean;
}

/**
 * Primera terminal libre de: la activa, las usadas de la más reciente a la más antigua y el
 * resto de abiertas de la última a la primera. `undefined` si todas están ocupadas (o no hay).
 */
export function pickTarget<T>({ active, recent, terminals, isBusy }: TargetCandidates<T>): T | undefined {
	const order = [active, ...[...recent].reverse(), ...[...terminals].reverse()];
	return order.find((terminal): terminal is T => terminal !== undefined && !isBusy(terminal));
}

export class TerminalActivity<T extends ActivityTerminal> implements Disposable {
	/** Ejecución del shell en curso por terminal. */
	private readonly running = new Map<T, object>();
	/** Terminales por orden de foco, la más reciente al final. */
	private readonly recent: T[];
	private readonly listeners = new Set<() => unknown>();
	private readonly subscriptions: Disposable[];

	constructor(private readonly window: ActivityWindow<T>) {
		const active = window.activeTerminal;
		this.recent = window.terminals.filter((t) => t !== active);
		if (active) {
			this.recent.push(active);
		}
		this.subscriptions = [
			window.onDidChangeActiveTerminal((terminal) => {
				if (terminal) {
					this.touch(terminal);
				}
				this.fire();
			}),
			window.onDidCloseTerminal((terminal) => {
				this.running.delete(terminal);
				this.forget(terminal);
				this.fire();
			}),
			window.onDidChangeTerminalState(() => this.fire()),
			window.onDidStartTerminalShellExecution(({ terminal, execution }) => {
				// Un shell solo ejecuta un comando desde su prompt: el nuevo sustituye al anterior,
				// así un fin perdido no deja la terminal ocupada para siempre.
				this.running.set(terminal, execution);
				this.fire();
			}),
			window.onDidEndTerminalShellExecution(({ terminal, execution }) => {
				if (this.running.get(terminal) === execution) {
					this.running.delete(terminal);
					this.fire();
				}
			}),
		];
	}

	/** Si la terminal ejecuta un comando o tiene un programa en lugar de un shell. */
	isBusy(terminal: T): boolean {
		return this.running.has(terminal) || isProgramTerminal(terminal);
	}

	/** Terminal en la que se escribiría ahora; `undefined` si hay que crear una. */
	target(): T | undefined {
		return pickTarget({
			active: this.window.activeTerminal,
			recent: this.recent,
			terminals: this.window.terminals,
			isBusy: (terminal) => this.isBusy(terminal),
		});
	}

	/** Avisa cuando algo puede haber cambiado la terminal de destino o su shell. */
	onDidChange(listener: () => unknown): Disposable {
		this.listeners.add(listener);
		return { dispose: () => this.listeners.delete(listener) };
	}

	private touch(terminal: T): void {
		this.forget(terminal);
		this.recent.push(terminal);
	}

	private forget(terminal: T): void {
		const index = this.recent.indexOf(terminal);
		if (index >= 0) {
			this.recent.splice(index, 1);
		}
	}

	private fire(): void {
		for (const listener of [...this.listeners]) {
			listener();
		}
	}

	dispose(): void {
		for (const subscription of this.subscriptions) {
			subscription.dispose();
		}
		this.listeners.clear();
		this.running.clear();
	}
}
