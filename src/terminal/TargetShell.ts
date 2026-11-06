// Shell de la terminal de destino (la misma en la que se escribiría o, si hay que crear una, la
// del perfil por defecto) y aviso cuando cambia. No importa `vscode`: recibe el destino y
// `env` con interfaces mínimas (en la extensión, `TerminalActivity` y `vscode.env`), así se
// testea con Vitest.
import type { ShellId } from '../catalog/types';
import { resolveTargetShell } from './shell';

export interface Disposable {
	dispose(): unknown;
}

/** Forma de `vscode.Event`: se suscribe un listener y devuelve cómo darlo de baja. */
export type Subscribe<T> = (listener: (event: T) => unknown) => Disposable;

/** Lo que usamos de `vscode.Terminal`. */
export interface ShellTerminal {
	readonly state: { readonly shell: string | undefined };
	/** `TerminalOptions` (con `shellPath`) o `ExtensionTerminalOptions` (sin él). */
	readonly creationOptions: object;
}

/** Lo que usamos de `TerminalActivity`. */
export interface ShellTarget {
	/** Terminal en la que se escribiría ahora; `undefined` si hay que crear una. */
	target(): ShellTerminal | undefined;
	/** Avisa cuando cambia el foco, una terminal se cierra, empieza o acaba un comando, o cambia su estado. */
	onDidChange(listener: () => unknown): Disposable;
}

/** Lo que usamos de `vscode.env`. */
export interface ShellEnv {
	/** Shell del perfil por defecto (ruta del ejecutable; puede ser `''`). */
	readonly shell: string;
	readonly onDidChangeShell: Subscribe<string>;
}

function shellPathOf(terminal: ShellTerminal): string | undefined {
	const options = terminal.creationOptions as { readonly shellPath?: unknown };
	return typeof options.shellPath === 'string' ? options.shellPath : undefined;
}

export class TargetShell implements Disposable {
	private readonly listeners = new Set<(shell: ShellId) => unknown>();
	private readonly subscriptions: Disposable[];
	private last: ShellId;

	constructor(
		private readonly env: ShellEnv,
		private readonly platform: string,
		private readonly destination: ShellTarget,
	) {
		this.last = this.current();
		// `refresh` solo avisa si el shell cambia: un evento de otra terminal no tiene efecto.
		this.subscriptions = [destination.onDidChange(() => this.refresh()), env.onDidChangeShell(() => this.refresh())];
	}

	/** Shell de destino en este momento. */
	current(): ShellId {
		const terminal = this.destination.target();
		return resolveTargetShell(
			{
				detected: terminal?.state.shell,
				shellPath: terminal && shellPathOf(terminal),
				defaultShell: this.env.shell,
			},
			this.platform,
		);
	}

	/** Avisa con el nuevo shell de destino solo cuando cambia. */
	onDidChange(listener: (shell: ShellId) => unknown): Disposable {
		this.listeners.add(listener);
		return { dispose: () => this.listeners.delete(listener) };
	}

	private refresh(): void {
		const shell = this.current();
		if (shell === this.last) {
			return;
		}
		this.last = shell;
		for (const listener of [...this.listeners]) {
			listener(shell);
		}
	}

	dispose(): void {
		for (const subscription of this.subscriptions) {
			subscription.dispose();
		}
		this.listeners.clear();
	}
}
