// Señales del tipo de proyecto: entradas (archivos o carpetas) en la raíz de cada carpeta del
// workspace que indican qué categorías del catálogo le interesan. Solo se comprueba si existen.

export interface ProjectSignal {
	/** Nombre de la entrada en la raíz de la carpeta. */
	readonly file: string;
	/** Id de la categoría del catálogo incluido que sugiere. */
	readonly categoryId: string;
}

export const PROJECT_SIGNALS: readonly ProjectSignal[] = [
	{ file: '.git', categoryId: 'git' },
	{ file: 'package.json', categoryId: 'node' },
	{ file: 'pnpm-lock.yaml', categoryId: 'pnpm' },
	{ file: 'package-lock.json', categoryId: 'npm' },
	{ file: 'Dockerfile', categoryId: 'docker' },
	{ file: 'compose.yaml', categoryId: 'docker' },
	{ file: 'compose.yml', categoryId: 'docker' },
	{ file: 'docker-compose.yml', categoryId: 'docker' },
	{ file: 'docker-compose.yaml', categoryId: 'docker' },
];

/** Patrón glob con todas las señales, para vigilarlas en la raíz de una carpeta. */
export const SIGNAL_GLOB = `{${PROJECT_SIGNALS.map((s) => s.file).join(',')}}`;

/**
 * Ids de las categorías detectadas en las raíces dadas (unión de todas). Una comprobación que
 * falla cuenta como que la entrada no existe.
 */
export async function detectCategories<R>(
	roots: readonly R[],
	exists: (root: R, name: string) => Promise<boolean>,
): Promise<Set<string>> {
	const checks = roots.flatMap((root) =>
		PROJECT_SIGNALS.map(async (signal) => ((await exists(root, signal.file).catch(() => false)) ? signal.categoryId : undefined)),
	);
	const found = await Promise.all(checks);
	return new Set(found.filter((id): id is string => id !== undefined));
}
