// Escribe comandos en la terminal de VS Code sin ejecutarlos. No importa `vscode`: recibe la
// ventana a través de interfaces mínimas (en la extensión, `vscode.window` encaja tal cual),
// así se testea con Vitest.

/** Lo que usamos de `vscode.Terminal`. */
export interface TerminalLike {
	show(preserveFocus?: boolean): void;
	sendText(text: string, shouldExecute?: boolean): void;
	/** VS Code 1.93+: presente cuando el shell ya ha cargado su integración (prompt listo). */
	readonly shellIntegration?: unknown;
}

/** Lo que usamos de `vscode.window`. */
export interface TerminalHost {
	readonly activeTerminal: TerminalLike | undefined;
	createTerminal(options: { name: string }): TerminalLike;
	/**
	 * VS Code 1.93+. Opcional porque el engine mínimo es 1.90: sin él, se espera el tiempo
	 * máximo antes de escribir en una terminal nueva.
	 */
	readonly onDidChangeTerminalShellIntegration?: (
		listener: (event: { readonly terminal: TerminalLike }) => unknown,
	) => { dispose(): unknown };
}

export class TerminalService {
	static readonly terminalName = 'DevCommands';
	/** Espera máxima a que el shell de una terminal nueva esté listo (WSL puede tardar). */
	static readonly readyTimeoutMs = 3000;

	constructor(
		private readonly host: TerminalHost,
		private readonly readyTimeoutMs = TerminalService.readyTimeoutMs,
	) {}

	/**
	 * Escribe `text` en la terminal activa (o en una nueva "DevCommands") sin ejecutarlo:
	 * primero la muestra con el foco, para que el usuario confirme con Enter. En una terminal
	 * recién creada espera a que el shell esté listo; si no, el texto llega antes que el prompt
	 * y se ve mezclado con él (`git statususer@host:~$ git status`).
	 */
	async write(text: string): Promise<TerminalLike> {
		const active = this.host.activeTerminal;
		const terminal = active ?? this.host.createTerminal({ name: TerminalService.terminalName });
		terminal.show(false);
		if (!active) {
			await this.whenShellReady(terminal);
		}
		// false: sin salto de línea. Nunca se ejecuta nada automáticamente.
		terminal.sendText(text, false);
		return terminal;
	}

	/** Se resuelve cuando la integración del shell se activa en `terminal`, o al agotar la espera. */
	private whenShellReady(terminal: TerminalLike): Promise<void> {
		if (terminal.shellIntegration) {
			return Promise.resolve();
		}
		return new Promise((resolve) => {
			let subscription: { dispose(): unknown } | undefined;
			const done = () => {
				clearTimeout(timer);
				subscription?.dispose();
				resolve();
			};
			const timer = setTimeout(done, this.readyTimeoutMs);
			subscription = this.host.onDidChangeTerminalShellIntegration?.((event) => {
				if (event.terminal === terminal) {
					done();
				}
			});
		});
	}
}
