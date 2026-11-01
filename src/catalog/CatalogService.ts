import { bundledCatalog } from './index';
import type { Catalog, Category, Command, Locale, LocalizedString, ShellId } from './types';

/** Idioma del catálogo a partir de `vscode.env.language`: español si empieza por "es", si no inglés. */
export function resolveLocale(language: string): Locale {
	return language.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function localize(text: LocalizedString, locale: Locale): string {
	return text[locale];
}

/** Variante del comando para un shell: `shells[shell]` si existe, si no `command` (POSIX). */
export function effectiveCommand(cmd: Command, shell: ShellId): string {
	return cmd.shells?.[shell] ?? cmd.command;
}

/** Ejemplo del comando: la plantilla efectiva con cada `${x}` sustituido por su placeholder. */
export function buildExample(cmd: Command, locale: Locale, shell: ShellId): string {
	const placeholders = new Map((cmd.params ?? []).map((p) => [p.name, localize(p.placeholder, locale)]));
	return effectiveCommand(cmd, shell).replace(
		/\$\{([A-Za-z][A-Za-z0-9_]*)\}/g,
		(match, name: string) => placeholders.get(name) ?? match,
	);
}

/** Consulta del catálogo. Sin acceso a disco, red ni a la API de VS Code. */
export class CatalogService {
	private readonly categories: readonly Category[];
	private readonly commandsById: ReadonlyMap<string, Command>;

	constructor(catalog: Catalog = bundledCatalog) {
		this.categories = [...catalog].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
		this.commandsById = new Map(catalog.flatMap((c) => c.commands.map((cmd) => [cmd.id, cmd] as const)));
	}

	/** Categorías por `order` ascendente y, si empatan, por `id`. Los comandos conservan el orden del archivo. */
	getCategories(): readonly Category[] {
		return this.categories;
	}

	getCommand(id: string): Command | undefined {
		return this.commandsById.get(id);
	}
}
