// Escribe comandos en la terminal de VS Code sin ejecutarlos. No importa `vscode`: recibe la
// ventana a través de interfaces mínimas (en la extensión, `vscode.window` encaja tal cual),
// así se testea con Vitest.

/** Lo que usamos de `vscode.Terminal`. */
export interface TerminalLike {
	show(preserveFocus?: boolean): void;
	sendText(text: string, shouldExecute?: boolean): void;
}

/** Lo que usamos de `vscode.window`. */
export interface TerminalHost {
	readonly activeTerminal: TerminalLike | undefined;
	createTerminal(options: { name: string }): TerminalLike;
}

export class TerminalService {
	static readonly terminalName = 'DevCommands';

	constructor(private readonly host: TerminalHost) {}

	/**
	 * Escribe `text` en la terminal activa (o en una nueva "DevCommands") sin ejecutarlo:
	 * primero la muestra con el foco, para que el usuario confirme con Enter.
	 */
	write(text: string): TerminalLike {
		const terminal = this.host.activeTerminal ?? this.host.createTerminal({ name: TerminalService.terminalName });
		terminal.show(false);
		// false: sin salto de línea. Nunca se ejecuta nada automáticamente.
		terminal.sendText(text, false);
		return terminal;
	}
}
