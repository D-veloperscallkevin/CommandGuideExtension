// Confirmación modal de los comandos `destructive` antes de enviarlos o copiarlos.
// No depende de `vscode`: la ventana, el ajuste y los textos traducidos se inyectan.

import { localize } from '../catalog/CatalogService';
import type { Command, Locale } from '../catalog/types';

/** Qué se va a hacer con el texto del comando. */
export type RiskAction = 'send' | 'copy';

/** Lo que se usa de `MessageOptions` en un aviso modal. */
export interface RiskMessageOptions {
	readonly modal: true;
	readonly detail: string;
}

/** Lo mínimo que se usa de `vscode.window`. */
export interface ConfirmWindow {
	showWarningMessage(message: string, options: RiskMessageOptions, ...items: string[]): Thenable<string | undefined>;
}

/** Textos traducidos del aviso. */
export interface RiskMessages {
	/** Mensaje principal, con el título del comando en el idioma activo. */
	message(title: string): string;
	/** Detalle al enviar a la terminal, con el texto exacto. */
	sendDetail(text: string): string;
	/** Detalle al copiar, con el texto exacto. */
	copyDetail(text: string): string;
	readonly sendButton: string;
	readonly copyButton: string;
}

export class RiskConfirmer {
	/**
	 * @param isEnabled Lee el ajuste `devcommands.confirmDestructive`; se consulta en cada llamada
	 * para que un cambio se aplique sin recargar la ventana.
	 */
	constructor(
		private readonly window: ConfirmWindow,
		private readonly isEnabled: () => boolean,
		private readonly messages: RiskMessages,
	) {}

	/**
	 * `true` si se puede seguir con `text`: el comando no es `destructive`, la confirmación está
	 * desactivada o el usuario pulsa el botón de la acción. Cancelar o cerrar el aviso da `false`.
	 */
	async confirm(command: Command, locale: Locale, text: string, action: RiskAction): Promise<boolean> {
		if (command.risk !== 'destructive' || !this.isEnabled()) {
			return true;
		}
		const button = action === 'send' ? this.messages.sendButton : this.messages.copyButton;
		const detail = action === 'send' ? this.messages.sendDetail(text) : this.messages.copyDetail(text);
		const choice = await this.window.showWarningMessage(
			this.messages.message(localize(command.title, locale)),
			{ modal: true, detail },
			button,
		);
		return choice === button;
	}
}
