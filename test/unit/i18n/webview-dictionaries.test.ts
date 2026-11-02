import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '../../../src/i18n/locales';
import { dictionaries, intlLocale, toLocale, translate, type PluralForms } from '../../../webview-ui/src/i18n';

type Entry = string | PluralForms;

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const forms = (entry: Entry): string[] => (typeof entry === 'string' ? [entry] : Object.values(entry));
const isPlural = (entry: Entry): entry is PluralForms => typeof entry !== 'string';
const pluralCategories = (locale: (typeof SUPPORTED_LOCALES)[number]) =>
	[...new Intl.PluralRules(intlLocale(locale)).resolvedOptions().pluralCategories].sort();

describe('diccionarios del webview', () => {
	const source: Record<string, Entry> = dictionaries.en;
	const keys = Object.keys(source).sort();

	it('hay un diccionario por cada idioma soportado', () => {
		expect(Object.keys(dictionaries).sort()).toEqual([...SUPPORTED_LOCALES].sort());
	});

	it.each(SUPPORTED_LOCALES)('%s tiene las mismas claves que en, sin valores vacíos', (locale) => {
		const dictionary: Record<string, Entry> = dictionaries[locale];
		expect(Object.keys(dictionary).sort()).toEqual(keys);
		for (const key of keys) {
			for (const form of forms(dictionary[key])) {
				expect(form.trim(), `${locale}.${key}`).not.toBe('');
			}
		}
	});

	it.each(SUPPORTED_LOCALES)('%s usa los mismos marcadores {nombre} que en, en todas las formas', (locale) => {
		const dictionary: Record<string, Entry> = dictionaries[locale];
		for (const key of keys) {
			const expected = placeholders(forms(source[key])[0]);
			for (const form of forms(dictionary[key])) {
				expect(placeholders(form), `${locale}.${key}: "${form}"`).toEqual(expected);
			}
		}
	});

	it.each(SUPPORTED_LOCALES)('%s: las claves plurales tienen exactamente las formas de Intl.PluralRules', (locale) => {
		const dictionary: Record<string, Entry> = dictionaries[locale];
		for (const key of keys) {
			const entry = dictionary[key];
			expect(isPlural(entry), `${locale}.${key}: plural en un idioma y no en otro`).toBe(isPlural(source[key]));
			if (isPlural(entry)) {
				expect(Object.keys(entry).sort(), `${locale}.${key}`).toEqual(pluralCategories(locale));
			}
		}
	});
});

describe('translate', () => {
	it('devuelve el texto del idioma', () => {
		expect(translate('ko', 'loading')).toBe(dictionaries.ko.loading);
	});

	it.each([
		['en', 1, '1 command'],
		['en', 3, '3 commands'],
		['es', 1, '1 comando'],
		['es', 3, '3 comandos'],
		['ru', 1, '1 команда'],
		['ru', 3, '3 команды'],
		['ru', 5, '5 команд'],
		['ja', 3, '3 個のコマンド'],
	] as const)('plural %s con %i -> %s', (locale, count, expected) => {
		expect(translate(locale, 'commandCount', { count })).toBe(expected);
	});

	it('una clave plural sin count usa la forma "other"', () => {
		expect(translate('en', 'commandCount')).toBe('{count} commands');
	});
});

describe('intlLocale', () => {
	it('convierte los ids propios a BCP 47', () => {
		expect(intlLocale('pt-br')).toBe('pt-BR');
		expect(intlLocale('zh-tw')).toBe('zh-TW');
		expect(intlLocale('de')).toBe('de');
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
