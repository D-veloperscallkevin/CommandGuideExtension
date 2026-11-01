import type { Catalog } from './types';

const placeholderPattern = /\$\{([A-Za-z][A-Za-z0-9_]*)\}/g;

/** Nombres de los placeholders `${x}` de una plantilla, en orden de aparición. */
export function placeholdersOf(template: string): string[] {
	return Array.from(template.matchAll(placeholderPattern), (m) => m[1]);
}

/**
 * Reglas del catálogo que JSON Schema no puede expresar. Devuelve un mensaje por
 * cada problema; un array vacío significa catálogo válido.
 */
export function checkCatalogRules(catalog: Catalog): string[] {
	const errors: string[] = [];
	const seenIds = new Map<string, string>();

	for (const category of catalog) {
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

			const paramNames = (cmd.params ?? []).map((p) => p.name);
			const declared = new Set(paramNames);
			if (declared.size !== paramNames.length) {
				const repeated = paramNames.filter((n, i) => paramNames.indexOf(n) !== i);
				errors.push(`${where}: parámetros repetidos: ${[...new Set(repeated)].join(', ')}`);
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
						errors.push(`${where}: \${${name}} en ${variant} no está declarado en params`);
					}
				}
			}

			const used = new Set(placeholdersOf(cmd.command));
			for (const name of declared) {
				if (!used.has(name)) {
					errors.push(`${where}: el parámetro "${name}" no aparece en command`);
				}
			}
		}
	}

	return errors;
}
