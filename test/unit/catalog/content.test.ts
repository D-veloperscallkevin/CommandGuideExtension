import { describe, expect, it } from 'vitest';
import { buildCategorySummaries, CatalogService } from '../../../src/catalog/CatalogService';
import { bundledCatalog } from '../../../src/catalog/index';
import type { Catalog, LocalizedString, LocalizedTags, ShellId } from '../../../src/catalog/types';
import { SUPPORTED_LOCALES } from '../../../src/i18n/locales';
import { branchParam, makeCategory, makeCommand } from './fixtures';

/** Mínimo de comandos por categoría del catálogo empaquetado. */
const MIN_COMMANDS = 15;

/** Categorías con menos de `min` comandos, como "id: n". */
function undersized(catalog: Catalog, min: number): string[] {
	return catalog.filter((c) => c.commands.length < min).map((c) => `${c.id}: ${c.commands.length}`);
}

/**
 * Textos del catálogo sin valor en alguno de los 11 idiomas, como "id: campo idioma".
 * Un texto vacío o una lista de tags vacía cuentan como ausentes.
 */
function missingTranslations(catalog: Catalog): string[] {
	const missing: string[] = [];
	const text = (owner: string, field: string, value: LocalizedString) => {
		for (const locale of SUPPORTED_LOCALES) {
			if (!value[locale]?.trim()) {
				missing.push(`${owner}: ${field} ${locale}`);
			}
		}
	};
	const tags = (owner: string, value: LocalizedTags) => {
		for (const locale of SUPPORTED_LOCALES) {
			const list = value[locale];
			if (!list || list.length === 0 || list.some((tag) => !tag.trim())) {
				missing.push(`${owner}: tags ${locale}`);
			}
		}
	};
	for (const category of catalog) {
		text(category.id, 'title', category.title);
		for (const cmd of category.commands) {
			text(cmd.id, 'title', cmd.title);
			text(cmd.id, 'description', cmd.description);
			tags(cmd.id, cmd.tags);
			for (const param of cmd.params ?? []) {
				text(cmd.id, `params.${param.name}.label`, param.label);
				text(cmd.id, `params.${param.name}.placeholder`, param.placeholder);
			}
		}
	}
	return missing;
}

/** Un texto con el mismo valor en los 11 idiomas. */
const all = (value: string): LocalizedString =>
	Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, value])) as unknown as LocalizedString;
const allTags = (value: string): LocalizedTags =>
	Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, [value]])) as unknown as LocalizedTags;

describe('contenido mínimo', () => {
	it('nombra las categorías con pocos comandos', () => {
		const few = makeCategory('demo', [makeCommand({ id: 'demo.a' }), makeCommand({ id: 'demo.b' })]);
		const enough = makeCategory('ok', [makeCommand({ id: 'ok.a' })]);
		expect(undersized([few, enough], 1)).toEqual([]);
		expect(undersized([few, enough], 2)).toEqual(['ok: 1']);
		expect(undersized([few, enough], 3)).toEqual(['demo: 2', 'ok: 1']);
	});

	it('el catálogo empaquetado tiene las 6 categorías en orden', () => {
		expect(new CatalogService().getCategories().map((c) => c.id)).toEqual([
			'git',
			'npm',
			'pnpm',
			'node',
			'docker',
			'terminal',
		]);
	});

	it(`cada categoría empaquetada tiene al menos ${MIN_COMMANDS} comandos`, () => {
		expect(undersized(bundledCatalog, MIN_COMMANDS)).toEqual([]);
	});

	it('cada comando empaquetado enlaza su documentación', () => {
		const withoutDocs = bundledCatalog.flatMap((c) => c.commands).filter((cmd) => !cmd.docs);
		expect(withoutDocs.map((cmd) => cmd.id)).toEqual([]);
	});

	/** Ejemplo de borrar una carpeta de Terminal para un shell. */
	const removeDirectoryFor = (shell: ShellId) =>
		buildCategorySummaries(new CatalogService().getCategories(), 'en', shell)
			.flatMap((c) => c.commands)
			.find((c) => c.id === 'terminal.remove-directory')?.example;

	it('en PowerShell, borrar una carpeta de Terminal usa Remove-Item y no rm -rf', () => {
		expect(removeDirectoryFor('powershell')).toMatch(/^Remove-Item -Recurse -Force /);
	});

	it('en cmd, borrar una carpeta de Terminal usa rmdir /s /q', () => {
		expect(removeDirectoryFor('cmd')).toMatch(/^rmdir \/s \/q /);
	});

	it('en bash y zsh, borrar una carpeta de Terminal usa rm -rf', () => {
		expect(removeDirectoryFor('bash')).toMatch(/^rm -rf /);
		expect(removeDirectoryFor('zsh')).toMatch(/^rm -rf /);
	});

	it('todos los comandos de Terminal tienen variante de cmd', () => {
		const terminal = bundledCatalog.find((c) => c.id === 'terminal');
		const withoutCmd = (terminal?.commands ?? []).filter((cmd) => !cmd.shells?.cmd);
		expect(withoutCmd.map((cmd) => cmd.id)).toEqual([]);
	});
});

describe('traducción completa', () => {
	it('con los 11 idiomas en todos los textos no falta nada', () => {
		const complete = {
			...makeCategory('demo', [
				makeCommand({
					id: 'demo.a',
					title: all('A'),
					description: all('Desc'),
					tags: allTags('tag'),
					command: 'git checkout -b ${branch}',
					params: [{ name: 'branch', label: all('Branch'), placeholder: all('main') }],
				}),
			]),
			title: all('Demo'),
		};
		expect(missingTranslations([complete])).toEqual([]);
	});

	it('nombra el comando, el campo y el idioma que faltan', () => {
		const { ko: _ko, ...withoutKo } = all('Desc') as Record<string, string>;
		const { ja: _ja, ...placeholderWithoutJa } = all('main') as Record<string, string>;
		const category = {
			...makeCategory('demo', [
				makeCommand({
					id: 'demo.a',
					title: all('A'),
					description: withoutKo as unknown as LocalizedString,
					tags: { ...allTags('tag'), fr: [] },
					command: 'git checkout -b ${branch}',
					params: [
						{ name: 'branch', label: all('Branch'), placeholder: placeholderWithoutJa as unknown as LocalizedString },
					],
				}),
			]),
			title: { ...all('Demo'), ru: ' ' },
		};
		expect(missingTranslations([category])).toEqual([
			'demo: title ru',
			'demo.a: description ko',
			'demo.a: tags fr',
			'demo.a: params.branch.placeholder ja',
		]);
	});

	it('un comando solo en en/es (válido para el schema) no está completo', () => {
		const category = makeCategory('demo', [makeCommand({ id: 'demo.a', params: [branchParam] })]);
		expect(missingTranslations([category])).toContain('demo.a: title de');
	});

	it('todo el catálogo empaquetado está en los 11 idiomas', () => {
		expect(missingTranslations(bundledCatalog)).toEqual([]);
	});
});
