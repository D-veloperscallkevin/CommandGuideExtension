// Protocolo de mensajes entre el webview y la extensión. El webview importa solo los
// tipos (`import type`); la validación se ejecuta en la extensión, que no confía en
// nada de lo que llega del webview.
import type { CategorySummary, CommandSummary } from '../catalog/CatalogService';
import type { Locale, ShellId } from '../catalog/types';

export type { CategorySummary, CommandSummary, ShellId };

/**
 * Entrada del historial tal como la ve el webview: su clave, el comando y su texto para el shell
 * actual. Si algún valor guardado no vale en ese shell, `needsInput` es `true` y `text` lleva los
 * valores tal como se escribieron, sin escapar: al enviarla se pedirán de nuevo.
 */
export interface HistoryItem {
	readonly id: string;
	readonly commandId: string;
	readonly text: string;
	readonly needsInput: boolean;
}

/**
 * Mensajes que envía el webview a la extensión. `sendToTerminal`, `copyToClipboard` y
 * `toggleFavorite` llevan solo el id: el texto y la lista de favoritos los maneja la extensión.
 * `sendRecent` y `copyRecent` llevan solo la clave de una entrada del historial: los valores de
 * sus parámetros nunca salen de la extensión. `openSponsor` no lleva la URL: la decide la extensión
 * a partir del manifiesto, así el webview nunca elige qué dirección se abre.
 */
export type WebviewMessage =
	| { readonly type: 'ready' }
	| { readonly type: 'sendToTerminal'; readonly commandId: string }
	| { readonly type: 'copyToClipboard'; readonly commandId: string }
	| { readonly type: 'toggleFavorite'; readonly commandId: string }
	| { readonly type: 'sendRecent'; readonly entryId: string }
	| { readonly type: 'copyRecent'; readonly entryId: string }
	| { readonly type: 'clearHistory' }
	| { readonly type: 'openSponsor' };

/** Longitud máxima de un `commandId` recibido (acota también lo que se registra en el log). */
export const MAX_COMMAND_ID_LENGTH = 200;

/**
 * Mensajes que envía la extensión al webview. `catalog` lleva el shell para el que se han
 * construido los ejemplos y se reenvía cuando cambia; `detected`, los ids de las categorías del
 * proyecto abierto, en el orden de `categories`. `copied` solo se envía si la copia funcionó.
 * `favorites` lleva los ids favoritos en orden de marcado, tras cada handshake y cada cambio.
 * `copied` lleva `entryId` si se copió una entrada del historial. `history` lleva las entradas de
 * la más reciente a la más antigua, tras cada handshake, cada cambio y cada cambio de shell.
 */
export type ExtensionMessage =
	| { readonly type: 'init'; readonly locale: Locale; readonly version: string }
	| {
			readonly type: 'catalog';
			readonly shell: ShellId;
			readonly categories: readonly CategorySummary[];
			readonly detected: readonly string[];
	  }
	| { readonly type: 'copied'; readonly commandId: string; readonly entryId?: string }
	| { readonly type: 'favorites'; readonly commandIds: readonly string[] }
	| { readonly type: 'history'; readonly entries: readonly HistoryItem[] };

type FieldValidator = (value: unknown) => boolean;

const isString: FieldValidator = (value) => typeof value === 'string';
const isCommandId: FieldValidator = (value) =>
	typeof value === 'string' && value.length > 0 && value.length <= MAX_COMMAND_ID_LENGTH;

/** Clave de una entrada del historial: letras, dígitos y guiones (un UUID), como mucho 64. */
const isEntryId: FieldValidator = (value) => typeof value === 'string' && /^[A-Za-z0-9-]{1,64}$/.test(value);

/** Campos exactos de cada tipo de mensaje del webview y el validador de cada uno. */
const webviewMessageFields: Readonly<
	Record<WebviewMessage['type'], Readonly<Record<string, FieldValidator>>>
> = {
	ready: { type: isString },
	sendToTerminal: { type: isString, commandId: isCommandId },
	copyToClipboard: { type: isString, commandId: isCommandId },
	toggleFavorite: { type: isString, commandId: isCommandId },
	sendRecent: { type: isString, entryId: isEntryId },
	copyRecent: { type: isString, entryId: isEntryId },
	clearHistory: { type: isString },
	openSponsor: { type: isString },
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
