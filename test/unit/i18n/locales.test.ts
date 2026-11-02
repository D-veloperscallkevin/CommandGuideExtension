import { describe, expect, it } from 'vitest';
import { resolveLocale as fromCatalog } from '../../../src/catalog/CatalogService';
import { isLocale, resolveLocale, SUPPORTED_LOCALES } from '../../../src/i18n/locales';

describe('resolveLocale', () => {
	it.each([
		['en', 'en'],
		['en-US', 'en'],
		['es', 'es'],
		['es-ES', 'es'],
		['es-419', 'es'],
		['ES_es', 'es'],
		['pt', 'pt-br'],
		['pt-PT', 'pt-br'],
		['pt-BR', 'pt-br'],
		['zh', 'zh-cn'],
		['zh-CN', 'zh-cn'],
		['zh-Hans', 'zh-cn'],
		['zh-TW', 'zh-tw'],
		['zh-HK', 'zh-tw'],
		['zh-Hant', 'zh-tw'],
		['zh-Hant-HK', 'zh-tw'],
		['de', 'de'],
		['de-CH', 'de'],
		['fr-CA', 'fr'],
		['it', 'it'],
		['ja', 'ja'],
		['ko-KR', 'ko'],
		['ru', 'ru'],
		['nl', 'en'],
		['xx', 'en'],
		['', 'en'],
	])('%s -> %s', (language, expected) => {
		expect(resolveLocale(language)).toBe(expected);
	});

	it('cada idioma soportado se resuelve a sí mismo', () => {
		for (const locale of SUPPORTED_LOCALES) {
			expect(resolveLocale(locale)).toBe(locale);
		}
	});

	it('CatalogService reexporta la misma función', () => {
		expect(fromCatalog).toBe(resolveLocale);
	});
});

describe('isLocale', () => {
	it('distingue idiomas soportados', () => {
		expect(isLocale('zh-tw')).toBe(true);
		expect(isLocale('zh')).toBe(false);
		expect(isLocale('pt')).toBe(false);
	});
});
