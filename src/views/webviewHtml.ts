// HTML del webview de la vista lateral. Sin dependencia de `vscode` para poder
// testear la CSP con Vitest.

export interface WebviewHtmlOptions {
	/** URI del bundle (`dist/webview/assets/index.js`) ya convertida con `asWebviewUri`. */
	readonly scriptUri: string;
	/** URI de la hoja de estilos (`dist/webview/assets/index.css`) ya convertida. */
	readonly styleUri: string;
	/** `webview.cspSource`. */
	readonly cspSource: string;
	/** Valor aleatorio distinto en cada carga. */
	readonly nonce: string;
	/** Idioma del documento. */
	readonly lang?: string;
}

const htmlEscapes: Readonly<Record<string, string>> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
};

// Los atributos van siempre entre comillas dobles: la comilla simple (la CSP la usa) no se escapa.
function escapeAttr(value: string): string {
	return value.replace(/[&<>"]/g, (c) => htmlEscapes[c]);
}

export function buildCsp(cspSource: string, nonce: string): string {
	return [
		"default-src 'none'",
		`script-src 'nonce-${nonce}'`,
		`style-src ${cspSource}`,
		`img-src ${cspSource} data:`,
		`font-src ${cspSource}`,
	].join('; ');
}

export function buildWebviewHtml(opts: WebviewHtmlOptions): string {
	const nonce = escapeAttr(opts.nonce);
	return `<!doctype html>
<html lang="${escapeAttr(opts.lang ?? 'en')}">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${escapeAttr(buildCsp(opts.cspSource, opts.nonce))}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="${escapeAttr(opts.styleUri)}">
<title>DevCommands</title>
</head>
<body>
<div id="root"></div>
<script type="module" nonce="${nonce}" src="${escapeAttr(opts.scriptUri)}"></script>
</body>
</html>
`;
}
