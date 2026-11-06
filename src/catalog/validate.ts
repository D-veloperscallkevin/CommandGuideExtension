import type { Catalog, Command } from './types';

const placeholderPattern = /\$\{([A-Za-z][A-Za-z0-9_]*)\}/g;

/** Prefijo de los ids de las categorías propias del usuario; el catálogo incluido no puede usarlo. */
export const CUSTOM_PREFIX = 'custom-';

/** Nombres de los placeholders `${x}` de una plantilla, en orden de aparición. */
export function placeholdersOf(template: string): string[] {
	return Array.from(template.matchAll(placeholderPattern), (m) => m[1]);
}

/** Problema de coherencia entre las plantillas y los parámetros de un comando. */
export type ParamProblem =
	| { readonly code: 'duplicateParam'; readonly names: readonly string[] }
	| { readonly code: 'undeclaredParam'; readonly name: string; readonly variant: string }
	| { readonly code: 'unusedParam'; readonly name: string };

/**
 * Parámetros repetidos, placeholders de `command` o de `shells.*` sin declarar en `params`, y
 * parámetros declarados que no aparecen en `command`. Vacío si todo es coherente.
 */
export function paramProblems(cmd: Command): ParamProblem[] {
	const problems: ParamProblem[] = [];
	const paramNames = (cmd.params ?? []).map((p) => p.name);
	const declared = new Set(paramNames);
	if (declared.size !== paramNames.length) {
		const repeated = paramNames.filter((n, i) => paramNames.indexOf(n) !== i);
		problems.push({ code: 'duplicateParam', names: [...new Set(repeated)] });
	}

	const variants: Array<[string, string]> = [['command', cmd.command]];
	for (const [shell, template] of Object.entries(cmd.shells ?? {})) {
		if (template !== undefined) {
			variants.push([`shells.${shell}`, template]);
		}
	}
	for (const [variant, template] of variants) {
		for (const name of placeholdersOf(template)) {
			if (!declared.has(name)) {
				problems.push({ code: 'undeclaredParam', name, variant });
			}
		}
	}

	const used = new Set(placeholdersOf(cmd.command));
	for (const name of declared) {
		if (!used.has(name)) {
			problems.push({ code: 'unusedParam', name });
		}
	}
	return problems;
}

/** Mensaje de un problema de parámetros para la validación del catálogo. */
function paramMessage(problem: ParamProblem): string {
	switch (problem.code) {
		case 'duplicateParam':
			return `parámetros repetidos: ${problem.names.join(', ')}`;
		case 'undeclaredParam':
			return `\${${problem.name}} en ${problem.variant} no está declarado en params`;
		case 'unusedParam':
			return `el parámetro "${problem.name}" no aparece en command`;
	}
}

/**
 * Reglas del catálogo que JSON Schema no puede expresar. Devuelve un mensaje por
 * cada problema; un array vacío significa catálogo válido.
 */
export function checkCatalogRules(catalog: Catalog): string[] {
	const errors: string[] = [];
	const seenIds = new Map<string, string>();

	for (const category of catalog) {
		if (category.id.startsWith(CUSTOM_PREFIX)) {
			errors.push(`${category.id}: el prefijo "${CUSTOM_PREFIX}" está reservado para los comandos propios`);
		}
		// El schema deja pasar "." y ".." como segmento; aquí se rechazan (no se sale de la raíz).
		for (const pattern of category.detect ?? []) {
			if (pattern.split('/').some((segment) => segment === '.' || segment === '..')) {
				errors.push(`${category.id}: patrón de detección no admitido "${pattern}"`);
			}
		}
		for (const cmd of category.commands) {
			const where = `${category.id}/${cmd.id}`;

			const previous = seenIds.get(cmd.id);
			if (previous !== undefined) {
				errors.push(`${where}: id duplicado "${cmd.id}" (ya existe en la categoría "${previous}")`);
			} else {
				seenIds.set(cmd.id, category.id);
			}

			if (!cmd.id.startsWith(`${category.id}.`)) {
				errors.push(`${where}: el id debe empezar por "${category.id}."`);
			}

			for (const problem of paramProblems(cmd)) {
				errors.push(`${where}: ${paramMessage(problem)}`);
			}
		}
	}

	return errors;
}
