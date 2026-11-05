// Elementos del buscador de la paleta ("DevCommands: Buscar comandos"): grupos con el cuadro
// vacío y la búsqueda del panel al escribir. Lógica pura, sin `vscode`, para probarla con Vitest.
import type { CategorySummary, CommandSummary } from '../catalog/CatalogService';
import { queryWords, search } from '../catalog/search';
import type { HistoryItem } from '../messaging/protocol';

/** Lo que el buscador necesita: lo mismo que recibe el panel. */
export interface SearchSnapshot {
	readonly categories: readonly CategorySummary[];
	/** Ids favoritos en orden de marcado. */
	readonly favorites: readonly string[];
	/** Entradas del historial, de la más reciente a la más antigua. */
	readonly history: readonly HistoryItem[];
	/** Ids de las categorías detectadas en el proyecto, en el orden de `categories`. */
	readonly detected: readonly string[];
}

export interface SearchCommandEntry {
	readonly kind: 'command';
	/** Única en la lista: `fav:<id>`, `recent:<entryId>` o `cmd:<id>`. */
	readonly key: string;
	readonly commandId: string;
	/** Clave de la entrada del historial (solo en "Recientes"). */
	readonly entryId?: string;
	readonly title: string;
	/** Título de la categoría del comando. */
	readonly category: string;
	readonly description: string;
	/** Ejemplo del comando o, en "Recientes", el texto con sus valores. */
	readonly text: string;
	/** En "Recientes": algún valor no vale en el shell actual y se pedirá de nuevo. */
	readonly needsInput: boolean;
	readonly favorite: boolean;
}

export type SearchEntry = { readonly kind: 'separator'; readonly label: string } | SearchCommandEntry;

/** Nombres de los separadores de los grupos fijos, ya traducidos. */
export interface SearchLabels {
	readonly favorites: string;
	readonly recent: string;
}

/**
 * Elementos del buscador. Con `query` vacía (o solo espacios): grupos con separador (Favoritos,
 * Recientes, categorías detectadas y el resto, sin grupos vacíos). Con texto: los resultados de
 * `search`, en el orden del panel, sin separadores ni repetidos.
 */
export function searchEntries(snapshot: SearchSnapshot, query: string, labels: SearchLabels): SearchEntry[] {
	const favorites = new Set(snapshot.favorites);
	const byId = new Map<string, { command: CommandSummary; category: CategorySummary }>();
	for (const category of snapshot.categories) {
		for (const command of category.commands) {
			byId.set(command.id, { command, category });
		}
	}
	const entry = (key: string, command: CommandSummary, category: CategorySummary): SearchCommandEntry => ({
		kind: 'command',
		key,
		commandId: command.id,
		title: command.title,
		category: category.title,
		description: command.description,
		text: command.example,
		needsInput: false,
		favorite: favorites.has(command.id),
	});

	if (queryWords(query).length > 0) {
		const all = snapshot.categories.flatMap((category) => category.commands);
		return search(all, query).flatMap((command) => {
			const found = byId.get(command.id);
			return found ? [entry(`cmd:${command.id}`, command, found.category)] : [];
		});
	}

	const result: SearchEntry[] = [];
	const group = (label: string, items: readonly SearchCommandEntry[]) => {
		if (items.length > 0) {
			result.push({ kind: 'separator', label }, ...items);
		}
	};
	group(
		labels.favorites,
		snapshot.favorites.flatMap((id) => {
			const found = byId.get(id);
			return found ? [entry(`fav:${id}`, found.command, found.category)] : [];
		}),
	);
	group(
		labels.recent,
		snapshot.history.flatMap((item) => {
			const found = byId.get(item.commandId);
			return found
				? [{ ...entry(`recent:${item.id}`, found.command, found.category), entryId: item.id, text: item.text, needsInput: item.needsInput }]
				: [];
		}),
	);
	const detected = new Set(snapshot.detected);
	const ordered = [
		...snapshot.categories.filter((c) => detected.has(c.id)),
		...snapshot.categories.filter((c) => !detected.has(c.id)),
	];
	for (const category of ordered) {
		group(
			category.title,
			category.commands.map((command) => entry(`cmd:${command.id}`, command, category)),
		);
	}
	return result;
}
