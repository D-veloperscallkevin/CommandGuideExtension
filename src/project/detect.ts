// Señales del tipo de proyecto: patrones (campo `detect` de cada categoría del catálogo) que se
// comparan con las entradas de la raíz de cada carpeta del workspace. Solo se listan nombres;
// nunca se lee el contenido de un archivo ni se baja más de un nivel.

/** Un patrón de detección y la categoría del catálogo que sugiere. */
export interface ProjectSignal {
	readonly categoryId: string;
	/** Nombre de la raíz (`go.mod`), con comodines `*` (`*.csproj`) o ruta de un nivel (`prisma/schema.prisma`). */
	readonly pattern: string;
}

/** Lo mínimo de una categoría para sacar sus señales (en el bundle llega solo esto). */
export interface SignalSource {
	readonly id: string;
	readonly detect?: readonly string[];
}

/** Aplana los `detect` de las categorías en señales, en el orden recibido. */
export function signalsFromCatalog(categories: readonly SignalSource[]): ProjectSignal[] {
	return categories.flatMap((c) => (c.detect ?? []).map((pattern) => ({ categoryId: c.id, pattern })));
}

/** Señales listas para comparar: las de la raíz como expresiones y las de un nivel por carpeta. */
export interface CompiledSignals {
	readonly root: readonly { readonly categoryId: string; readonly test: RegExp }[];
	readonly nested: readonly { readonly categoryId: string; readonly dir: string; readonly name: string }[];
}

const escape = (text: string) => text.replace(/[.+^${}()|[\]\\?]/g, '\\$&');

/** Compila los patrones. La comparación no distingue mayúsculas en ninguna plataforma. */
export function compileSignals(signals: readonly ProjectSignal[]): CompiledSignals {
	const root: { categoryId: string; test: RegExp }[] = [];
	const nested: { categoryId: string; dir: string; name: string }[] = [];
	for (const { categoryId, pattern } of signals) {
		const slash = pattern.indexOf('/');
		if (slash === -1) {
			const source = pattern.split('*').map(escape).join('[^/]*');
			root.push({ categoryId, test: new RegExp(`^${source}$`, 'i') });
		} else {
			nested.push({ categoryId, dir: pattern.slice(0, slash).toLowerCase(), name: pattern.slice(slash + 1).toLowerCase() });
		}
	}
	return { root, nested };
}

/**
 * Glob del watcher de cada carpeta: cualquier entrada de la raíz y los archivos de las carpetas
 * que usan rutas de un nivel. Sin rutas, `*`.
 */
export function watchGlob(signals: CompiledSignals): string {
	const dirs = [...new Set(signals.nested.map((s) => `${s.dir}/*`))];
	return dirs.length === 0 ? '*' : `{${['*', ...dirs].join(',')}}`;
}

/**
 * Nombres de las entradas de la raíz de `root` (o de su subcarpeta `dir`). Un fallo cuenta como
 * carpeta vacía.
 */
export type ListEntries<R> = (root: R, dir?: string) => Promise<readonly string[]>;

/** Ids de las categorías detectadas en las raíces dadas (unión de todas). */
export async function detectCategories<R>(
	roots: readonly R[],
	signals: CompiledSignals,
	list: ListEntries<R>,
): Promise<Set<string>> {
	const safeList = (root: R, dir?: string) => list(root, dir).catch((): readonly string[] => []);
	const perRoot = await Promise.all(
		roots.map(async (root) => {
			const found = new Set<string>();
			const names = await safeList(root);
			for (const signal of signals.root) {
				if (names.some((name) => signal.test.test(name))) {
					found.add(signal.categoryId);
				}
			}
			// Cada carpeta de una ruta de un nivel se lista una sola vez, con el nombre real de la raíz.
			const dirs = new Map(names.map((name) => [name.toLowerCase(), name] as const));
			const listed = new Map<string, Promise<Set<string>>>();
			for (const signal of signals.nested) {
				const actual = dirs.get(signal.dir);
				if (actual === undefined) {
					continue;
				}
				let inside = listed.get(signal.dir);
				if (!inside) {
					inside = safeList(root, actual).then((entries) => new Set(entries.map((e) => e.toLowerCase())));
					listed.set(signal.dir, inside);
				}
				if ((await inside).has(signal.name)) {
					found.add(signal.categoryId);
				}
			}
			return found;
		}),
	);
	return new Set(perRoot.flatMap((found) => [...found]));
}
