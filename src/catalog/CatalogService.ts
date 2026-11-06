import { buildSearchText } from './search';
import type { Catalog, Category, Command, Locale, LocalizedString, LocalizedTags, Risk, SectionId, ShellId } from './types';

export { resolveLocale } from '../i18n/locales';

/** Texto en el idioma pedido o, si el catálogo no lo tiene, en inglés. */
export function localize(text: LocalizedString, locale: Locale): string {
	return text[locale] ?? text.en;
}

/** Tags en el idioma pedido o, si el catálogo no los tiene, en inglés. */
export function localizeTags(tags: LocalizedTags, locale: Locale): readonly string[] {
	return tags[locale] ?? tags.en;
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

/**
 * La plantilla efectiva con cada `${x}` sustituido por su valor tal cual, sin escapar. Solo para
 * mostrarlo: nunca se envía ni se copia.
 */
export function buildDisplayText(cmd: Command, shell: ShellId, values: ReadonlyMap<string, string>): string {
	return effectiveCommand(cmd, shell).replace(
		/\$\{([A-Za-z][A-Za-z0-9_]*)\}/g,
		(match, name: string) => values.get(name) ?? match,
	);
}

/** Lo que el webview necesita para mostrar un comando (ya traducido y con el ejemplo resuelto). */
export interface CommandSummary {
	readonly id: string;
	readonly title: string;
	readonly description: string;
	readonly example: string;
	readonly risk: Risk;
	/** Texto normalizado para buscar: textos en en, es y el idioma activo, categoría y ejemplo. */
	readonly searchText: string;
}

/** Lo que el webview necesita para mostrar una categoría y sus comandos (ya traducido). */
export interface CategorySummary {
	readonly id: string;
	readonly title: string;
	readonly icon: string;
	/** Sección del panel; `custom` para las categorías propias. */
	readonly section: SectionId;
	readonly commands: readonly CommandSummary[];
}

/**
 * Shell por sistema operativo: PowerShell en Windows (el terminal por defecto de VS Code allí)
 * y bash en el resto. Es el último recurso de la detección del shell (`src/terminal/shell.ts`).
 */
export function defaultShellFor(platform: string): ShellId {
	return platform === 'win32' ? 'powershell' : 'bash';
}

/**
 * Resumen de las categorías en el orden recibido: textos en `locale` (fallback a `en`) y
 * ejemplos construidos para `shell`. No incluye plantillas, parámetros ni tags.
 */
export function buildCategorySummaries(
	categories: readonly Category[],
	locale: Locale,
	shell: ShellId,
): CategorySummary[] {
	// Se busca en los dos idiomas obligatorios del catálogo y en el activo (si es otro).
	const searchLocales: readonly Locale[] = [...new Set<Locale>(['en', 'es', locale])];
	return categories.map((c) => {
		const categoryTitles = searchLocales.map((l) => localize(c.title, l));
		return {
			id: c.id,
			title: localize(c.title, locale),
			icon: c.icon,
			section: c.section,
			commands: c.commands.map((cmd) => {
				const example = buildExample(cmd, locale, shell);
				return {
					id: cmd.id,
					title: localize(cmd.title, locale),
					description: localize(cmd.description, locale),
					example,
					risk: cmd.risk,
					searchText: buildSearchText([
						...searchLocales.flatMap((l) => [
							localize(cmd.title, l),
							localize(cmd.description, l),
							...localizeTags(cmd.tags, l),
						]),
						...categoryTitles,
						example,
					]),
				};
			}),
		};
	});
}

/**
 * Consulta del catálogo: el incluido y, detrás, las categorías propias del usuario, que se pueden
 * reemplazar. El incluido se recibe ya cargado o como una función que lo carga; en ese caso se
 * llama una sola vez, en la primera consulta, nunca al construir ni al fijar las propias.
 * Sin red ni API de VS Code.
 */
export class CatalogService {
	private bundled: readonly Category[] | undefined;
	private custom: readonly Category[] = [];
	private combined: { categories: readonly Category[]; commandsById: ReadonlyMap<string, Command> } | undefined;
	private readonly listeners = new Set<() => void>();

	private readonly source: Catalog | (() => Catalog);

	constructor(source: Catalog | (() => Catalog)) {
		this.source = source;
	}

	private static index(categories: readonly Category[]): ReadonlyMap<string, Command> {
		return new Map(categories.flatMap((c) => c.commands.map((cmd) => [cmd.id, cmd] as const)));
	}

	/** Si el catálogo incluido ya se ha cargado (para tests y diagnóstico). */
	get isLoaded(): boolean {
		return this.bundled !== undefined;
	}

	private data(): { categories: readonly Category[]; commandsById: ReadonlyMap<string, Command> } {
		if (!this.bundled) {
			const catalog = typeof this.source === 'function' ? this.source() : this.source;
			this.bundled = [...catalog].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
		}
		this.combined ??= {
			categories: [...this.bundled, ...this.custom],
			// Las ids de las incluidas tienen prioridad si coincidieran.
			commandsById: new Map([...CatalogService.index(this.custom), ...CatalogService.index(this.bundled)]),
		};
		return this.combined;
	}

	/**
	 * Categorías del catálogo por `order` ascendente y, si empatan, por `id`; después, las propias
	 * en el orden recibido. Los comandos conservan el orden del archivo o del ajuste.
	 */
	getCategories(): readonly Category[] {
		return this.data().categories;
	}

	/**
	 * Reemplaza las categorías propias (ya validadas, con ids `custom-…`) y avisa a quien escuche
	 * `onDidChange`. No carga el catálogo incluido.
	 */
	setCustomCategories(custom: readonly Category[]): void {
		this.custom = custom;
		this.combined = undefined;
		for (const listener of this.listeners) {
			listener();
		}
	}

	/** Se llama tras cada `setCustomCategories`. Devuelve un objeto para dejar de escuchar. */
	onDidChange(listener: () => void): { dispose(): void } {
		this.listeners.add(listener);
		return { dispose: () => this.listeners.delete(listener) };
	}

	getCommand(id: string): Command | undefined {
		return this.data().commandsById.get(id);
	}
}
