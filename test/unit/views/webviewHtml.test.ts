import { describe, expect, it } from 'vitest';
import { buildCsp, buildWebviewHtml } from '../../../src/views/webviewHtml';

const opts = {
	scriptUri: 'https://file+.vscode-resource.vscode-cdn.net/ext/dist/webview/assets/index.js',
	styleUri: 'https://file+.vscode-resource.vscode-cdn.net/ext/dist/webview/assets/index.css',
	cspSource: 'https://*.vscode-cdn.net',
	nonce: 'abc123',
};

function cspOf(html: string): string {
	const match = /http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(html);
	expect(match, 'falta la meta CSP').not.toBeNull();
	return match![1];
}

describe('buildWebviewHtml', () => {
	const html = buildWebviewHtml(opts);
	const csp = cspOf(html);

	it('deniega todo por defecto y limita los scripts al nonce', () => {
		expect(csp).toContain("default-src 'none'");
		expect(csp).toContain("script-src 'nonce-abc123'");
		expect(csp).toContain(`style-src ${opts.cspSource}`);
	});

	it('no incluye unsafe-inline ni unsafe-eval', () => {
		expect(csp).not.toMatch(/unsafe-/);
	});

	it('el único <script> lleva el mismo nonce y apunta al bundle', () => {
		const scripts = html.match(/<script\b[^>]*>/g) ?? [];
		expect(scripts).toHaveLength(1);
		expect(scripts[0]).toContain('nonce="abc123"');
		expect(scripts[0]).toContain(`src="${opts.scriptUri}"`);
	});

	it('enlaza la hoja de estilos', () => {
		expect(html).toContain(`<link rel="stylesheet" href="${opts.styleUri}">`);
	});

	it('escapa los valores interpolados', () => {
		const evil = buildWebviewHtml({ ...opts, scriptUri: '"><script>alert(1)</script>', nonce: 'n"x' });
		expect(evil).not.toContain('"><script>alert(1)');
		expect(evil).toContain('&quot;&gt;&lt;script&gt;');
		expect(evil).toContain('nonce="n&quot;x"');
	});
});

describe('buildCsp', () => {
	it('genera una política distinta para cada nonce', () => {
		expect(buildCsp('src', 'a')).not.toBe(buildCsp('src', 'b'));
	});
});
