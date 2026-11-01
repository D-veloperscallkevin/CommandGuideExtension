import { describe, expect, it } from 'vitest';
import {
	buildCategorySummaries,
	buildExample,
	CatalogService,
	effectiveCommand,
	localize,
	localizeTags,
} from '../../../src/catalog/CatalogService';
import { branchParam, makeCategory, makeCommand } from './fixtures';

const newBranch = makeCommand({ id: 'git.new-branch', command: 'git checkout -b ${branch}', params: [branchParam] });
const status = makeCommand({ id: 'git.status', command: 'git status' });
const remove = makeCommand({ id: 'fs.remove', command: 'rm -rf dist', shells: { powershell: 'Remove-Item -Recurse dist' } });

describe('localize', () => {
	const title = { en: 'Branch', es: 'Rama', fr: 'Branche' };

	it('devuelve el texto del idioma pedido', () => {
		expect(localize(title, 'es')).toBe('Rama');
		expect(localize(title, 'en')).toBe('Branch');
	});

	it('usa un idioma opcional cuando existe', () => {
		expect(localize(title, 'fr')).toBe('Branche');
	});

	it('cae a en cuando falta el idioma opcional', () => {
		expect(localize(title, 'de')).toBe('Branch');
	});
});

describe('localizeTags', () => {
	const tags = { en: ['branch'], es: ['rama'], ja: ['ブランチ'] };

	it('usa los tags del idioma pedido o, si faltan, los de en', () => {
		expect(localizeTags(tags, 'ja')).toEqual(['ブランチ']);
		expect(localizeTags(tags, 'ko')).toEqual(['branch']);
	});
});

describe('effectiveCommand', () => {
	it('usa la variante de PowerShell cuando existe', () => {
		expect(effectiveCommand(remove, 'powershell')).toBe('Remove-Item -Recurse dist');
	});

	it('usa command en bash cuando no hay variante bash', () => {
		expect(effectiveCommand(remove, 'bash')).toBe('rm -rf dist');
	});
});

describe('buildExample', () => {
	it('ejemplo en español para bash', () => {
		expect(buildExample(newBranch, 'es', 'bash')).toBe('git checkout -b feature/mi-cambio');
	});

	it('ejemplo en inglés para PowerShell sin variante propia', () => {
		expect(buildExample(newBranch, 'en', 'powershell')).toBe('git checkout -b feature/my-change');
	});

	it('usa el placeholder en cuando falta el del idioma activo', () => {
		expect(buildExample(newBranch, 'ja', 'bash')).toBe('git checkout -b feature/my-change');
	});

	it('un comando sin parámetros usa su propio comando', () => {
		expect(buildExample(status, 'es', 'bash')).toBe('git status');
	});
});

describe('buildCategorySummaries', () => {
	const ordered = new CatalogService([
		makeCategory('npm', [makeCommand({ id: 'npm.install' })], 20),
		{ ...makeCategory('git', [newBranch, status], 10), title: { en: 'Git', es: 'Git (es)', fr: 'Git (fr)' } },
	]).getCategories();

	it('conserva el orden y cuenta los comandos', () => {
		expect(buildCategorySummaries(ordered, 'en')).toEqual([
			{ id: 'git', title: 'Git', icon: 'beaker', commandCount: 2 },
			{ id: 'npm', title: 'npm', icon: 'beaker', commandCount: 1 },
		]);
	});

	it('traduce el título y cae a en si falta el idioma', () => {
		expect(buildCategorySummaries(ordered, 'es')[0].title).toBe('Git (es)');
		expect(buildCategorySummaries(ordered, 'fr')[0].title).toBe('Git (fr)');
		expect(buildCategorySummaries(ordered, 'ja')[0].title).toBe('Git');
	});

	it('el resumen solo lleva id, title, icon y commandCount', () => {
		expect(Object.keys(buildCategorySummaries(ordered, 'en')[0]).sort()).toEqual(['commandCount', 'icon', 'id', 'title']);
	});
});

describe('CatalogService', () => {
	const service = new CatalogService([
		makeCategory('npm', [makeCommand({ id: 'npm.install' })], 20),
		makeCategory('git', [newBranch, status], 10),
		makeCategory('docker', [makeCommand({ id: 'docker.ps' })], 30),
		makeCategory('bash', [makeCommand({ id: 'bash.ls' })], 30),
	]);

	it('ordena categorías por order y desempata por id', () => {
		expect(service.getCategories().map((c) => c.id)).toEqual(['git', 'npm', 'bash', 'docker']);
	});

	it('conserva el orden de los comandos del archivo', () => {
		expect(service.getCategories()[0].commands.map((c) => c.id)).toEqual(['git.new-branch', 'git.status']);
	});

	it('encuentra un comando por id', () => {
		expect(service.getCommand('git.new-branch')).toBe(newBranch);
	});

	it('devuelve undefined para un id inexistente', () => {
		expect(service.getCommand('git.nope')).toBeUndefined();
	});

	it('por defecto usa el catálogo empaquetado, y todos sus comandos producen ejemplo en ambos idiomas y shells', () => {
		const bundled = new CatalogService();
		const commands = bundled.getCategories().flatMap((c) => c.commands);
		expect(bundled.getCommand('git.new-branch')).toBeDefined();
		for (const cmd of commands) {
			for (const locale of ['en', 'es'] as const) {
				expect(localize(cmd.title, locale)).not.toBe('');
				for (const shell of ['bash', 'powershell'] as const) {
					expect(buildExample(cmd, locale, shell)).not.toMatch(/\$\{/);
				}
			}
		}
	});
});
