// Copia al portapapeles sin depender de `vscode`: el portapapeles se inyecta (en la extensión,
// `vscode.env.clipboard`), así que se testea con un portapapeles falso.

/** Lo mínimo que se usa del portapapeles de VS Code. */
export interface ClipboardLike {
	writeText(value: string): Thenable<void>;
}

export class ClipboardService {
	constructor(private readonly clipboard: ClipboardLike) {}

	/** Copia `text`. Devuelve `true` si funcionó; nunca lanza (quien llama registra el fallo). */
	async copy(text: string): Promise<boolean> {
		try {
			await this.clipboard.writeText(text);
			return true;
		} catch {
			return false;
		}
	}
}
