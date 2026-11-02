// Protocolo de mensajes entre el webview y la extensión. El webview importa solo los
// tipos (`import type`); la validación se ejecuta en la extensión, que no confía en
// nada de lo que llega del webview.
import type { CategorySummary, CommandSummary } from '../catalog/CatalogService';
import type { Locale } from '../catalog/types';

export type { CategorySummary, CommandSummary };

/**
 * Mensajes que envía el webview a la extensión. `sendToTerminal` lleva solo el id: el texto
 * lo construye la extensión a partir del catálogo.
 */
export type WebviewMessage =
	| { readonly type: 'ready' }
	| { readonly type: 'sendToTerminal'; readonly commandId: string };

/** Longitud máxima de un `commandId` recibido (acota también lo que se registra en el log). */
export const MAX_COMMAND_ID_LENGTH = 200;

/** Mensajes que envía la extensión al webview. */
export type ExtensionMessage =
	| { readonly type: 'init'; readonly locale: Locale; readonly version: string }
	| { readonly type: 'catalog'; readonly categories: readonly CategorySummary[] };

type FieldValidator = (value: unknown) => boolean;

const isString: FieldValidator = (value) => typeof value === 'string';
const isCommandId: FieldValidator = (value) =>
	typeof value === 'string' && value.length > 0 && value.length <= MAX_COMMAND_ID_LENGTH;

/** Campos exactos de cada tipo de mensaje del webview y el validador de cada uno. */
const webviewMessageFields: Readonly<
	Record<WebviewMessage['type'], Readonly<Record<string, FieldValidator>>>
> = {
	ready: { type: isString },
	sendToTerminal: { type: isString, commandId: isCommandId },
};

/**
 * Valida un mensaje recibido del webview: objeto plano, `type` conocido, exactamente los
 * campos declarados y cada uno con su tipo.
 */
export function isWebviewMessage(value: unknown): value is WebviewMessage {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false;
	}
	const proto = Object.getPrototypeOf(value);
	if (proto !== Object.prototype && proto !== null) {
		return false;
	}
	const { type } = value as { type?: unknown };
	if (typeof type !== 'string' || !Object.hasOwn(webviewMessageFields, type)) {
		return false;
	}
	const fields = webviewMessageFields[type as WebviewMessage['type']];
	const record = value as Record<string, unknown>;
	const keys = Object.keys(record);
	return (
		keys.length === Object.keys(fields).length &&
		keys.every((k) => Object.hasOwn(fields, k) && fields[k](record[k]))
	);
}
