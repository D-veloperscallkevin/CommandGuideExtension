// Enlace de patrocinio: la URL sale del campo `sponsor` del manifiesto (la misma que usa el botón
// Sponsor de la ficha) y nunca del webview. No importa `vscode`: recibe `openExternal` y `parse`
// (en la extensión, `vscode.env.openExternal` y `vscode.Uri.parse`), así se testea con Vitest.

const SPONSORS_PREFIX = 'https://github.com/sponsors/';

/** URL de GitHub Sponsors declarada en `sponsor.url` del manifiesto, o `undefined` si no es válida. */
export function sponsorUrl(packageJSON: unknown): string | undefined {
	const sponsor = (packageJSON as { sponsor?: unknown } | null | undefined)?.sponsor;
	const url = (sponsor as { url?: unknown } | null | undefined)?.url;
	if (typeof url !== 'string' || !url.startsWith(SPONSORS_PREFIX) || url.length === SPONSORS_PREFIX.length) {
		return undefined;
	}
	try {
		new URL(url);
	} catch {
		return undefined;
	}
	return url;
}

/** Lo que usamos del canal de log. */
export interface SponsorLog {
	info(message: string, ...args: unknown[]): void;
	warn(message: string, ...args: unknown[]): void;
	error(message: string, ...args: unknown[]): void;
}

export interface OpenSponsorOptions<U> {
	readonly url: string | undefined;
	/** `vscode.env.openExternal`: puede pedir confirmación y devuelve `false` si no se abrió. */
	readonly openExternal: (target: U) => Thenable<boolean> | Promise<boolean>;
	readonly parse: (url: string) => U;
	readonly log: SponsorLog;
}

/** Abre la página de patrocinio en el navegador. Nunca lanza: los fallos se registran. */
export async function openSponsor<U>({ url, openExternal, parse, log }: OpenSponsorOptions<U>): Promise<void> {
	if (!url) {
		log.warn('El manifiesto no declara una URL de GitHub Sponsors válida en sponsor.url; no se abre nada.');
		return;
	}
	try {
		const opened = await openExternal(parse(url));
		if (!opened) {
			log.info('No se abrió la página de patrocinio (cancelado o bloqueado).');
		}
	} catch (error) {
		log.error('No se pudo abrir la página de patrocinio:', String(error));
	}
}
