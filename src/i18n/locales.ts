// Idiomas de la interfaz y del catálogo. Lista única: de aquí salen los tipos, la
// resolución del idioma, el schema del catálogo (comprobado por test) y los
// diccionarios del webview (que importan solo el tipo).

export const SUPPORTED_LOCALES = ['en', 'es', 'pt-br', 'fr', 'de', 'it', 'ja', 'ko', 'zh-cn', 'zh-tw', 'ru'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Idiomas obligatorios en cada texto del catálogo; el resto son opcionales con fallback a `en`. */
export const REQUIRED_CATALOG_LOCALES = ['en', 'es'] as const;

export type RequiredCatalogLocale = (typeof REQUIRED_CATALOG_LOCALES)[number];

export function isLocale(value: string): value is Locale {
	return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Subetiquetas de chino que indican escritura tradicional. */
const traditionalChinese = new Set(['tw', 'hk', 'mo', 'hant']);

/**
 * Idioma activo a partir de `vscode.env.language`: coincidencia exacta, después por
 * idioma base (`pt` -> `pt-br`, chino tradicional -> `zh-tw`, resto de `zh` -> `zh-cn`)
 * y, si no, inglés.
 */
export function resolveLocale(language: string): Locale {
	const normalized = language.trim().toLowerCase().replace(/_/g, '-');
	if (isLocale(normalized)) {
		return normalized;
	}
	const [base, ...subtags] = normalized.split('-');
	if (base === 'zh') {
		return subtags.some((s) => traditionalChinese.has(s)) ? 'zh-tw' : 'zh-cn';
	}
	if (base === 'pt') {
		return 'pt-br';
	}
	return isLocale(base) ? base : 'en';
}
