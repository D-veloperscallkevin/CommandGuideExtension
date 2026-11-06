import { describe, expect, it } from 'vitest';
import { buildCategorySummaries, CatalogService } from '../../../src/catalog/CatalogService';
import { bundledCatalog } from './bundled';
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

	it('el catálogo empaquetado tiene las 19 categorías en orden', () => {
		expect(new CatalogService(bundledCatalog).getCategories().map((c) => c.id)).toEqual([
			'git',
			'npm',
			'pnpm',
			'yarn',
			'bun',
			'node',
			'deno',
			'typescript',
			'version-managers',
			'docker',
			'python',
			'poetry',
			'uv',
			'conda',
			'terminal',
			'java',
			'maven',
			'gradle',
			'dotnet',
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
		buildCategorySummaries(new CatalogService(bundledCatalog).getCategories(), 'en', shell)
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

	it('Terminal no declara patrones de detección', () => {
		expect(bundledCatalog.find((c) => c.id === 'terminal')?.detect).toBeUndefined();
	});

	it('todos los comandos de Terminal tienen variante de cmd', () => {
		const terminal = bundledCatalog.find((c) => c.id === 'terminal');
		const withoutCmd = (terminal?.commands ?? []).filter((cmd) => !cmd.shells?.cmd);
		expect(withoutCmd.map((cmd) => cmd.id)).toEqual([]);
	});

	/** Ejemplo de un comando del catálogo empaquetado para un shell. */
	const exampleFor = (id: string, shell: ShellId) =>
		buildCategorySummaries(new CatalogService(bundledCatalog).getCategories(), 'en', shell)
			.flatMap((c) => c.commands)
			.find((c) => c.id === id)?.example;

	it('activar fnm en bash usa eval con --shell bash', () => {
		expect(exampleFor('version-managers.fnm-env', 'bash')).toBe('eval "$(fnm env --use-on-cd --shell bash)"');
		expect(exampleFor('version-managers.fnm-env', 'zsh')).toBe('eval "$(fnm env --use-on-cd --shell zsh)"');
	});

	it('activar fnm en PowerShell usa Invoke-Expression', () => {
		expect(exampleFor('version-managers.fnm-env', 'powershell')).toBe(
			'fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression',
		);
	});

	it('la LTS de nvm usa --lts en bash y la sintaxis de nvm-windows en PowerShell y cmd', () => {
		expect(exampleFor('version-managers.nvm-install-lts', 'bash')).toBe('nvm install --lts');
		expect(exampleFor('version-managers.nvm-install-lts', 'powershell')).toBe('nvm install lts');
		expect(exampleFor('version-managers.nvm-install-lts', 'cmd')).toBe('nvm install lts');
	});

	it('todo comando de los gestores de versiones que desinstala es destructive', () => {
		const managers = bundledCatalog.find((c) => c.id === 'version-managers');
		const uninstalls = (managers?.commands ?? []).filter((cmd) => / uninstall /.test(` ${cmd.command} `));
		expect(uninstalls.length).toBeGreaterThan(0);
		expect(uninstalls.filter((cmd) => cmd.risk !== 'destructive').map((cmd) => cmd.id)).toEqual([]);
	});

	it('activar el venv usa Scripts en PowerShell y cmd, y bin en bash y zsh', () => {
		expect(exampleFor('python.venv-activate', 'powershell')).toBe('.venv\\Scripts\\Activate.ps1');
		expect(exampleFor('python.venv-activate', 'cmd')).toBe('.venv\\Scripts\\activate.bat');
		expect(exampleFor('python.venv-activate', 'bash')).toBe('source .venv/bin/activate');
		expect(exampleFor('python.venv-activate', 'zsh')).toBe('source .venv/bin/activate');
	});

	it('instalar requirements.txt usa python3 en bash y python en PowerShell y cmd', () => {
		expect(exampleFor('python.pip-install-requirements', 'bash')).toBe('python3 -m pip install -r requirements.txt');
		expect(exampleFor('python.pip-install-requirements', 'powershell')).toBe('python -m pip install -r requirements.txt');
		expect(exampleFor('python.pip-install-requirements', 'cmd')).toBe('python -m pip install -r requirements.txt');
	});

	it('python nunca usa pip a secas', () => {
		const python = bundledCatalog.find((c) => c.id === 'python');
		const pipCommands = (python?.commands ?? []).filter((cmd) => /\bpip\b/.test(cmd.command) && !cmd.command.startsWith('pipx'));
		expect(pipCommands.length).toBeGreaterThan(0);
		const wrong = pipCommands.filter(
			(cmd) =>
				!cmd.command.startsWith('python3 -m pip ') ||
				!cmd.shells?.powershell?.startsWith('python -m pip ') ||
				!cmd.shells?.cmd?.startsWith('python -m pip '),
		);
		expect(wrong.map((cmd) => cmd.id)).toEqual([]);
	});

	it('en python, poetry, uv y conda, borrar cachés, entornos o versiones es destructive', () => {
		const ids = ['python', 'poetry', 'uv', 'conda'];
		const deletes = bundledCatalog
			.filter((c) => ids.includes(c.id))
			.flatMap((c) => c.commands)
			.filter((cmd) => /cache (purge|clear|clean)|\bclean --all|env remove|python uninstall/.test(cmd.command));
		expect(deletes.map((cmd) => cmd.id).sort()).toEqual([
			'conda.clean',
			'conda.env-remove',
			'poetry.cache-clear',
			'poetry.env-remove',
			'python.pip-cache-purge',
			'uv.cache-clean',
			'uv.python-uninstall',
		]);
		expect(deletes.filter((cmd) => cmd.risk !== 'destructive').map((cmd) => cmd.id)).toEqual([]);
	});

	it('el wrapper de Gradle usa ./gradlew en bash y zsh, .\\gradlew en PowerShell y gradlew en cmd', () => {
		expect(exampleFor('gradle.build', 'bash')).toBe('./gradlew build');
		expect(exampleFor('gradle.build', 'zsh')).toBe('./gradlew build');
		expect(exampleFor('gradle.build', 'powershell')).toBe('.\\gradlew build');
		expect(exampleFor('gradle.build', 'cmd')).toBe('gradlew build');
	});

	it('el wrapper de Maven usa ./mvnw en bash, .\\mvnw en PowerShell y mvnw en cmd', () => {
		expect(exampleFor('maven.package', 'bash')).toBe('./mvnw package');
		expect(exampleFor('maven.package', 'powershell')).toBe('.\\mvnw package');
		expect(exampleFor('maven.package', 'cmd')).toBe('mvnw package');
	});

	it('todo comando de Maven y Gradle con el wrapper declara variantes de PowerShell y cmd', () => {
		const wrapped = bundledCatalog
			.filter((c) => c.id === 'maven' || c.id === 'gradle')
			.flatMap((c) => c.commands)
			.filter((cmd) => cmd.command.startsWith('./mvnw ') || cmd.command.startsWith('./gradlew '));
		expect(wrapped.length).toBeGreaterThan(0);
		const wrong = wrapped.filter((cmd) => {
			const tool = cmd.command.slice(2).split(' ')[0];
			const args = cmd.command.slice(2 + tool.length);
			return cmd.shells?.powershell !== `.\\${tool}${args}` || cmd.shells?.cmd !== `${tool}${args}`;
		});
		expect(wrong.map((cmd) => cmd.id)).toEqual([]);
	});

	it('los clean de Maven, Gradle y .NET son destructive', () => {
		const ids = ['maven.clean', 'gradle.clean', 'dotnet.clean'];
		const cleans = bundledCatalog.flatMap((c) => c.commands).filter((cmd) => ids.includes(cmd.id));
		expect(cleans.map((cmd) => cmd.id).sort()).toEqual([...ids].sort());
		expect(cleans.filter((cmd) => cmd.risk !== 'destructive').map((cmd) => cmd.id)).toEqual([]);
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
