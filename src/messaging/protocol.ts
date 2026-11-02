// Protocolo de mensajes entre el webview y la extensión. El webview importa solo los
// tipos (`import type`); la validación se ejecuta en la extensión, que no confía en
// nada de lo que llega del webview.
import type { CategorySummary, CommandSummary } from '../catalog/CatalogService';
import type { Locale } from '../catalog/types';

export type { CategorySummary, CommandSummary };

/** Mensajes que envía el webview a la extensión. */
export type WebviewMessage = { readonly type: 'ready' };

/** Mensajes que envía la extensión al webview. */
export type ExtensionMessage =
	| { readonly type: 'init'; readonly locale: Locale; readonly version: string }
	| { readonly type: 'catalog'; readonly categories: readonly CategorySummary[] };

/** Claves exactas que admite cada tipo de mensaje del webview. */
const webviewMessageKeys: Readonly<Record<WebviewMessage['type'], readonly string[]>> = {
	ready: ['type'],
};

/** Valida un mensaje recibido del webview: objeto plano, `type` conocido y exactamente las claves declaradas. */
export function isWebviewMessage(value: unknown): value is WebviewMessage {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false;
	}
	const proto = Object.getPrototypeOf(value);
	if (proto !== Object.prototype && proto !== null) {
		return false;
	}
	const { type } = value as { type?: unknown };
	if (typeof type !== 'string' || !Object.hasOwn(webviewMessageKeys, type)) {
		return false;
	}
	const expected = webviewMessageKeys[type as WebviewMessage['type']];
	const keys = Object.keys(value);
	return keys.length === expected.length && keys.every((k) => expected.includes(k));
}
