import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '../../../src/i18n/locales';
import { dictionaries, toLocale, translate } from '../../../webview-ui/src/i18n';

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('diccionarios del webview', () => {
	const keys = Object.keys(dictionaries.en).sort();

	it('hay un diccionario por cada idioma soportado', () => {
		expect(Object.keys(dictionaries).sort()).toEqual([...SUPPORTED_LOCALES].sort());
	});

	it.each(SUPPORTED_LOCALES)('%s tiene las mismas claves que en, sin valores vacíos', (locale) => {
		const dictionary: Record<string, string> = dictionaries[locale];
		expect(Object.keys(dictionary).sort()).toEqual(keys);
		for (const key of keys) {
			expect(dictionary[key].trim(), `${locale}.${key}`).not.toBe('');
		}
	});

	it.each(SUPPORTED_LOCALES)('%s usa los mismos marcadores {nombre} que en', (locale) => {
		const dictionary: Record<string, string> = dictionaries[locale];
		const source: Record<string, string> = dictionaries.en;
		for (const key of keys) {
			expect(placeholders(dictionary[key]), `${locale}.${key}`).toEqual(placeholders(source[key]));
		}
	});
});

describe('translate', () => {
	it('devuelve el texto del idioma y sustituye los marcadores', () => {
		expect(translate('ko', 'loading')).toBe(dictionaries.ko.loading);
		expect(translate('ja', 'version', { version: '1.2.3' })).toBe('v1.2.3');
	});

	it('deja intacto un marcador sin valor', () => {
		expect(translate('en', 'version', {})).toBe('v{version}');
	});
});

describe('toLocale', () => {
	it('acepta idiomas soportados y cae a en en cualquier otro caso', () => {
		expect(toLocale('zh-tw')).toBe('zh-tw');
		expect(toLocale('nl')).toBe('en');
		expect(toLocale('')).toBe('en');
		expect(toLocale(null)).toBe('en');
		expect(toLocale('toString')).toBe('en');
	});
});
