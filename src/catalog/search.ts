// Búsqueda de comandos: lógica pura, sin imports, para que la usen la extensión, el webview y
// Vitest. Un test comprueba que este archivo no importa nada (el webview lo empaqueta).

/** Separa las partes de `searchText` para que una palabra no coincida uniendo dos campos. */
const SEPARATOR = ' · ';

/**
 * Minúsculas, sin diacríticos (tildes, diéresis, ñ → n) y con los espacios colapsados. Solo se
 * quitan los diacríticos combinantes (U+0300–U+036F): otras marcas, como el dakuten japonés
 * (ブ) o los jamo del coreano, se recomponen con NFC y no cambian.
 */
export function normalize(text: string): string {
	return text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.normalize('NFC')
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.trim();
}

/** Une las partes normalizadas, sin vacías ni repetidas. */
export function buildSearchText(parts: readonly string[]): string {
	return [...new Set(parts.map(normalize).filter((part) => part.length > 0))].join(SEPARATOR);
}

/** Palabras de una búsqueda, normalizadas; `[]` si solo hay espacios. */
export function queryWords(query: string): string[] {
	const normalized = normalize(query);
	return normalized ? normalized.split(' ') : [];
}

export interface Searchable {
	/** Título en el idioma activo (decide qué resultados van primero). */
	readonly title: string;
	/** Texto ya normalizado con `buildSearchText`. */
	readonly searchText: string;
}

/**
 * Elementos cuyo `searchText` contiene todas las palabras de `query`: primero los que las tienen
 * todas en el título y después el resto, conservando el orden de `items` en cada grupo.
 */
export function search<T extends Searchable>(items: readonly T[], query: string): T[] {
	const words = queryWords(query);
	if (words.length === 0) {
		return [];
	}
	const inTitle: T[] = [];
	const rest: T[] = [];
	for (const item of items) {
		if (!words.every((word) => item.searchText.includes(word))) {
			continue;
		}
		const title = normalize(item.title);
		(words.every((word) => title.includes(word)) ? inTitle : rest).push(item);
	}
	return [...inTitle, ...rest];
}
