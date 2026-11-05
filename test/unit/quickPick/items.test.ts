import { describe, expect, it } from 'vitest';
import type { CategorySummary } from '../../../src/catalog/CatalogService';
import { buildSearchText, search } from '../../../src/catalog/search';
import { searchEntries, type SearchEntry, type SearchSnapshot } from '../../../src/quickPick/items';

const labels = { favorites: 'Favoritos', recent: 'Recientes' };

function command(id: string, title: string, tags = '') {
	return {
		id,
		title,
		description: `Descripción de ${title}`,
		example: id.replace('.', ' '),
		risk: 'safe' as const,
		searchText: buildSearchText([title, tags]),
	};
}
const categories: CategorySummary[] = [
	{ id: 'git', title: 'Git', icon: 'git-branch', commands: [command('git.status', 'Ver estado', 'status'), command('git.commit', 'Hacer commit')] },
	{ id: 'pnpm', title: 'pnpm', icon: 'package', commands: [command('pnpm.install', 'Instalar dependencias', 'install')] },
	{ id: 'docker', title: 'Docker', icon: 'server', commands: [command('docker.ps', 'Ver contenedores', 'status ps')] },
];
const snapshot = (overrides: Partial<SearchSnapshot> = {}): SearchSnapshot => ({
	categories,
	favorites: [],
	history: [],
	detected: [],
	...overrides,
});
/** Lista compacta: separadores como "# nombre" y comandos como su clave. */
const outline = (entries: readonly SearchEntry[]) => entries.map((e) => (e.kind === 'separator' ? `# ${e.label}` : e.key));

describe('searchEntries con el cuadro vacío', () => {
	it('solo categorías en el orden del catálogo, sin grupos vacíos', () => {
		expect(outline(searchEntries(snapshot(), '', labels))).toEqual([
			'# Git',
			'cmd:git.status',
			'cmd:git.commit',
			'# pnpm',
			'cmd:pnpm.install',
			'# Docker',
			'cmd:docker.ps',
		]);
	});

	it('Favoritos, Recientes, las detectadas y después el resto', () => {
		const entries = searchEntries(
			snapshot({
				favorites: ['docker.ps', 'git.status'],
				history: [{ id: 'e1', commandId: 'git.commit', text: 'git commit -m "x"', needsInput: false }],
				detected: ['pnpm', 'docker'],
			}),
			'   ',
			labels,
		);
		expect(outline(entries)).toEqual([
			'# Favoritos',
			'fav:docker.ps',
			'fav:git.status',
			'# Recientes',
			'recent:e1',
			'# pnpm',
			'cmd:pnpm.install',
			'# Docker',
			'cmd:docker.ps',
			'# Git',
			'cmd:git.status',
			'cmd:git.commit',
		]);
	});

	it('ignora favoritos y recientes de comandos que ya no existen', () => {
		const entries = searchEntries(
			snapshot({ favorites: ['borrado.x'], history: [{ id: 'e1', commandId: 'borrado.y', text: 'y', needsInput: false }] }),
			'',
			labels,
		);
		expect(outline(entries)[0]).toBe('# Git');
	});

	it('una entrada reciente lleva su texto, su clave y needsInput', () => {
		const [, recent] = searchEntries(
			snapshot({ history: [{ id: 'e1', commandId: 'git.commit', text: 'git commit -m "a"b"', needsInput: true }] }),
			'',
			labels,
		);
		expect(recent).toMatchObject({
			kind: 'command',
			commandId: 'git.commit',
			entryId: 'e1',
			text: 'git commit -m "a"b"',
			needsInput: true,
			category: 'Git',
		});
	});

	it('marca los favoritos en todos los grupos y las claves son únicas', () => {
		const entries = searchEntries(snapshot({ favorites: ['git.status'] }), '', labels);
		const status = entries.filter((e) => e.kind === 'command' && e.commandId === 'git.status');
		expect(status).toHaveLength(2);
		expect(status.every((e) => e.kind === 'command' && e.favorite)).toBe(true);
		const keys = entries.flatMap((e) => (e.kind === 'command' ? [e.key] : []));
		expect(new Set(keys).size).toBe(keys.length);
	});

	it('cada comando lleva título, categoría, descripción y ejemplo', () => {
		const [, first] = searchEntries(snapshot(), '', labels);
		expect(first).toEqual({
			kind: 'command',
			key: 'cmd:git.status',
			commandId: 'git.status',
			title: 'Ver estado',
			category: 'Git',
			description: 'Descripción de Ver estado',
			text: 'git status',
			needsInput: false,
			favorite: false,
		});
	});
});

describe('searchEntries al escribir', () => {
	it('usa la búsqueda del panel: mismo orden, sin separadores ni repetidos', () => {
		const entries = searchEntries(snapshot({ favorites: ['docker.ps'], detected: ['docker'] }), 'status', labels);
		const expected = search(categories.flatMap((c) => c.commands), 'status').map((c) => `cmd:${c.id}`);
		expect(outline(entries)).toEqual(expected);
		expect(outline(entries)).toEqual(['cmd:git.status', 'cmd:docker.ps']);
		expect(entries[1]).toMatchObject({ category: 'Docker', favorite: true });
	});

	it('sin coincidencias devuelve una lista vacía', () => {
		expect(searchEntries(snapshot(), 'zzzz', labels)).toEqual([]);
	});
});
