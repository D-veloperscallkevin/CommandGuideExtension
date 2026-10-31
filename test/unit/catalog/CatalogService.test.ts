import { describe, expect, it } from 'vitest';
import {
	buildExample,
	CatalogService,
	effectiveCommand,
	localize,
	resolveLocale,
} from '../../../src/catalog/CatalogService';
import { branchParam, makeCategory, makeCommand } from './fixtures';

const newBranch = makeCommand({ id: 'git.new-branch', command: 'git checkout -b ${branch}', params: [branchParam] });
const status = makeCommand({ id: 'git.status', command: 'git status' });
const remove = makeCommand({ id: 'fs.remove', command: 'rm -rf dist', shells: { powershell: 'Remove-Item -Recurse dist' } });

describe('resolveLocale', () => {
	it.each([
		['es', 'es'],
		['es-ES', 'es'],
		['es-419', 'es'],
		['en', 'en'],
		['en-US', 'en'],
		['de', 'en'],
		['ja', 'en'],
	])('%s -> %s', (language, expected) => {
		expect(resolveLocale(language)).toBe(expected);
	});
});

describe('localize', () => {
	it('devuelve el texto del idioma pedido', () => {
		expect(localize({ en: 'Branch', es: 'Rama' }, 'es')).toBe('Rama');
		expect(localize({ en: 'Branch', es: 'Rama' }, 'en')).toBe('Branch');
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

	it('un comando sin parámetros usa su propio comando', () => {
		expect(buildExample(status, 'es', 'bash')).toBe('git status');
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
