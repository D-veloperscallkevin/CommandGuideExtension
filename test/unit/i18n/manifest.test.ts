import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '../../../src/i18n/locales';

const readJson = (file: string): Record<string, unknown> => JSON.parse(readFileSync(resolve(file), 'utf8'));

const nlsFile = (locale: string) => (locale === 'en' ? 'package.nls.json' : `package.nls.${locale}.json`);
const translatedLocales = SUPPORTED_LOCALES.filter((l) => l !== 'en');

describe('manifiesto localizado (package.nls)', () => {
	const manifest = readFileSync(resolve('package.json'), 'utf8');
	const keys = [...new Set([...manifest.matchAll(/"%([^%"]+)%"/g)].map((m) => m[1]))].sort();

	it('el manifiesto usa al menos una clave', () => {
		expect(keys).toContain('description');
	});

	it.each(SUPPORTED_LOCALES)('%s tiene todas las claves, no vacías y sin sobrantes', (locale) => {
		const nls = readJson(nlsFile(locale));
		expect(Object.keys(nls).sort(), nlsFile(locale)).toEqual(keys);
		for (const key of keys) {
			expect(typeof nls[key] === 'string' && (nls[key] as string).trim() !== '', `${nlsFile(locale)}: ${key}`).toBe(true);
		}
	});
});

/** Archivos .ts de src/, recursivo. */
function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		return entry.isDirectory() ? sourceFiles(path) : entry.name.endsWith('.ts') ? [path] : [];
	});
}

/** Valor de un literal de string de TS (sin las comillas), decodificando los escapes. */
function decodeLiteral(quote: string, body: string): string {
	const json = quote === '"' ? body : body.replace(/\\'/g, "'").replace(/(?<!\\)"/g, '\\"');
	return JSON.parse(`"${json}"`) as string;
}

/** Textos de las llamadas `l10n.t('…')` / `l10n.t("…")` y llamadas cuyo primer argumento no es un literal. */
function l10nCalls(): { messages: string[]; nonLiteral: string[] } {
	const messages = new Set<string>();
	const nonLiteral: string[] = [];
	for (const file of sourceFiles(resolve('src'))) {
		const source = readFileSync(file, 'utf8');
		for (const match of source.matchAll(/\bl10n\.t\(\s*/g)) {
			const rest = source.slice(match.index + match[0].length);
			const literal = /^(['"])((?:\\.|(?!\1)[^\\])*)\1/.exec(rest);
			if (literal) {
				messages.add(decodeLiteral(literal[1], literal[2]));
			} else {
				nonLiteral.push(`${file}: l10n.t(${rest.slice(0, 30)}`);
			}
		}
	}
	return { messages: [...messages].sort(), nonLiteral };
}

describe('textos de la extensión (vscode.l10n)', () => {
	const { messages, nonLiteral } = l10nCalls();

	it('toda llamada a l10n.t usa un literal como primer argumento', () => {
		expect(nonLiteral).toEqual([]);
	});

	it.each(translatedLocales)('l10n/bundle.l10n.%s.json traduce todos los textos y no tiene sobrantes', (locale) => {
		const file = `l10n/bundle.l10n.${locale}.json`;
		const bundle = readJson(file);
		expect(Object.keys(bundle).sort(), file).toEqual(messages);
		for (const message of messages) {
			expect(typeof bundle[message] === 'string' && (bundle[message] as string).trim() !== '', `${file}: ${message}`).toBe(true);
		}
	});
});
