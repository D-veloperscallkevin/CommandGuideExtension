import type { Category, Command } from '../../../src/catalog/types';

export function makeCommand(overrides: Partial<Command> & Pick<Command, 'id'>): Command {
	return {
		title: { en: 'Title', es: 'Título' },
		description: { en: 'Description', es: 'Descripción' },
		command: 'echo hello',
		tags: { en: [], es: [] },
		risk: 'safe',
		...overrides,
	};
}

export function makeCategory(id: string, commands: Command[], order = 1): Category {
	return { version: 1, id, title: { en: id, es: id }, icon: 'beaker', order, commands };
}

export const branchParam = {
	name: 'branch',
	label: { en: 'Branch name', es: 'Nombre de la rama' },
	placeholder: { en: 'feature/my-change', es: 'feature/mi-cambio' },
} as const;
