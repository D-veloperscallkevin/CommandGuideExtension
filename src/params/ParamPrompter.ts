// Pide los valores de los parámetros de un comando con cuadros de texto nativos de VS Code.
// No depende de `vscode`: la ventana y los mensajes traducidos se inyectan.

import { localize } from '../catalog/CatalogService';
import type { Command, Locale, ShellId } from '../catalog/types';
import { validateValue, type ValueError } from './escape';

/** Lo que se usa de `InputBoxOptions`. */
export interface ParamInputBoxOptions {
	readonly title: string;
	readonly prompt: string;
	readonly placeHolder: string;
	/** Valor ya escrito al abrir el cuadro (p. ej. el guardado en el historial). */
	readonly value?: string;
	readonly ignoreFocusOut: boolean;
	readonly validateInput: (value: string) => string | undefined;
}

/** Lo mínimo que se usa de `vscode.window`. */
export interface PromptWindow {
	showInputBox(options: ParamInputBoxOptions): Thenable<string | undefined>;
}

/** Mensaje traducido de cada error de validación. */
export type ParamMessages = Readonly<Record<ValueError, string>>;

export class ParamPrompter {
	constructor(
		private readonly window: PromptWindow,
		private readonly messages: ParamMessages,
	) {}

	/**
	 * Pide en orden un valor por cada parámetro del comando. Devuelve los valores recortados por
	 * nombre, o `undefined` si el usuario cancela alguno (y entonces no pide los siguientes). Con
	 * `initial`, cada cuadro se abre con el valor de su parámetro ya escrito.
	 */
	async ask(
		command: Command,
		locale: Locale,
		shell: ShellId,
		initial?: ReadonlyMap<string, string>,
	): Promise<ReadonlyMap<string, string> | undefined> {
		const params = command.params ?? [];
		const title = localize(command.title, locale);
		const values = new Map<string, string>();
		for (const [index, param] of params.entries()) {
			const initialValue = initial?.get(param.name);
			const value = await this.window.showInputBox({
				...(initialValue === undefined ? {} : { value: initialValue }),
				title: params.length > 1 ? `${title} (${index + 1}/${params.length})` : title,
				prompt: localize(param.label, locale),
				placeHolder: localize(param.placeholder, locale),
				ignoreFocusOut: true,
				validateInput: (input) => {
					const error = validateValue(input, shell);
					return error && this.messages[error];
				},
			});
			// Un valor que no pasa la validación no debería llegar; se trata como cancelado por si acaso.
			if (value === undefined || validateValue(value, shell) !== undefined) {
				return undefined;
			}
			values.set(param.name, value.trim());
		}
		return values;
	}
}
