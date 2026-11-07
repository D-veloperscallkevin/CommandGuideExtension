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

	it('el catálogo empaquetado tiene las 39 categorías en orden', () => {
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
			'c-cpp',
			'cmake',
			'go',
			'rust',
			'php',
			'ruby',
			'dart',
			'flutter',
			'swift',
			'elixir',
			'erlang',
			'haskell',
			'scala',
			'clojure',
			'ocaml',
			'r',
			'lua',
			'zig',
			'julia',
			'perl',
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

	/** Comando del catálogo empaquetado por id. */
	const commandById = (id: string) => {
		const found = bundledCatalog.flatMap((c) => c.commands).find((cmd) => cmd.id === id);
		if (!found) {
			throw new Error(`No existe el comando ${id}`);
		}
		return found;
	};

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

	it('ejecutar el binario de C/C++ usa ./app en bash y zsh, .\\app.exe en PowerShell y app.exe en cmd', () => {
		expect(exampleFor('c-cpp.run', 'bash')).toBe('./app');
		expect(exampleFor('c-cpp.run', 'zsh')).toBe('./app');
		expect(exampleFor('c-cpp.run', 'powershell')).toBe('.\\app.exe');
		expect(exampleFor('c-cpp.run', 'cmd')).toBe('app.exe');
	});

	it('la compilación cruzada de Go fija GOOS y GOARCH con la sintaxis de cada shell', () => {
		expect(exampleFor('go.cross-compile', 'bash')).toBe('GOOS=linux GOARCH=amd64 go build');
		expect(exampleFor('go.cross-compile', 'zsh')).toBe('GOOS=linux GOARCH=amd64 go build');
		expect(exampleFor('go.cross-compile', 'powershell')).toBe('$env:GOOS="linux"; $env:GOARCH="amd64"; go build');
		expect(exampleFor('go.cross-compile', 'cmd')).toBe('set GOOS=linux&& set GOARCH=amd64&& go build');
	});

	it('C/C++ no usa el compilador de Microsoft (cl)', () => {
		const cpp = bundledCatalog.find((c) => c.id === 'c-cpp');
		expect(cpp?.commands.length).toBeGreaterThan(0);
		const withCl = (cpp?.commands ?? []).filter((cmd) =>
			[cmd.command, ...Object.values(cmd.shells ?? {})].some((text) => text?.startsWith('cl ')),
		);
		expect(withCl.map((cmd) => cmd.id)).toEqual([]);
	});

	it('borrar la caché de módulos de Go es destructive', () => {
		const modcache = bundledCatalog.flatMap((c) => c.commands).find((cmd) => cmd.command === 'go clean -modcache');
		expect(modcache?.risk).toBe('destructive');
	});

	it('los clean de Maven, Gradle, .NET, C/C++, CMake y Rust son destructive', () => {
		const ids = ['maven.clean', 'gradle.clean', 'dotnet.clean', 'c-cpp.make-clean', 'cmake.clean', 'rust.clean'];
		const cleans = bundledCatalog.flatMap((c) => c.commands).filter((cmd) => ids.includes(cmd.id));
		expect(cleans.map((cmd) => cmd.id).sort()).toEqual([...ids].sort());
		expect(cleans.filter((cmd) => cmd.risk !== 'destructive').map((cmd) => cmd.id)).toEqual([]);
	});

	it('activar mise usa eval en bash y zsh, e Invoke-Expression en PowerShell', () => {
		expect(exampleFor('version-managers.mise-activate', 'bash')).toBe('eval "$(mise activate bash)"');
		expect(exampleFor('version-managers.mise-activate', 'zsh')).toBe('eval "$(mise activate zsh)"');
		expect(exampleFor('version-managers.mise-activate', 'powershell')).toBe(
			'(&mise activate pwsh) | Out-String | Invoke-Expression',
		);
	});

	it('asdf usa asdf set y nunca asdf local ni asdf global', () => {
		const asdf = bundledCatalog.flatMap((c) => c.commands).filter((cmd) => cmd.command.startsWith('asdf '));
		expect(asdf.length).toBeGreaterThan(0);
		expect(asdf.filter((cmd) => /^asdf (local|global)\b/.test(cmd.command)).map((cmd) => cmd.id)).toEqual([]);
		expect(asdf.some((cmd) => cmd.command.startsWith('asdf set '))).toBe(true);
	});

	it('rbenv y asdf avisan en español de que no funcionan en PowerShell ni en cmd', () => {
		const posix = bundledCatalog
			.flatMap((c) => c.commands)
			.filter((cmd) => /^(rbenv|asdf) /.test(cmd.command));
		expect(posix.length).toBe(10);
		expect(posix.filter((cmd) => !cmd.description.es.includes('no funciona en PowerShell ni en cmd')).map((cmd) => cmd.id)).toEqual([]);
	});

	it('xcodebuild, xcrun y flutter build ios avisan en español de que solo funcionan en macOS', () => {
		const mac = bundledCatalog
			.flatMap((c) => c.commands)
			.filter((cmd) => /^(xcodebuild|xcrun) /.test(cmd.command) || cmd.command === 'flutter build ios');
		expect(mac.map((cmd) => cmd.id).sort()).toEqual(
			['flutter.build-ios', 'swift.simulators', 'swift.xcodebuild-build', 'swift.xcodebuild-list'].sort(),
		);
		expect(mac.filter((cmd) => !cmd.description.es.includes('Solo en macOS')).map((cmd) => cmd.id)).toEqual([]);
	});

	it('cargar el entorno de opam usa eval en bash, Invoke-Expression en PowerShell y for /f en cmd', () => {
		expect(exampleFor('ocaml.opam-env', 'bash')).toBe('eval $(opam env)');
		expect(exampleFor('ocaml.opam-env', 'zsh')).toBe('eval $(opam env)');
		expect(exampleFor('ocaml.opam-env', 'powershell')).toBe(
			"(& opam env) -split '\\r?\\n' | ForEach-Object { Invoke-Expression $_ }",
		);
		expect(exampleFor('ocaml.opam-env', 'cmd')).toBe(`for /f "tokens=*" %i in ('opam env') do @%i`);
	});

	it('iex usa iex.bat en PowerShell, porque iex es el alias de Invoke-Expression', () => {
		expect(exampleFor('elixir.iex-mix', 'powershell')).toBe('iex.bat -S mix');
		expect(exampleFor('elixir.iex-mix', 'bash')).toBe('iex -S mix');
		expect(exampleFor('elixir.iex-mix', 'cmd')).toBe('iex -S mix');
		expect(exampleFor('elixir.iex', 'powershell')).toBe('iex.bat');
	});

	it('Clojure CLI avisa en español de que en Windows no funciona en cmd', () => {
		const cli = bundledCatalog
			.flatMap((c) => c.commands)
			.filter((cmd) => /^(clj|clojure)\b/.test(cmd.command));
		expect(cli.length).toBe(8);
		expect(cli.filter((cmd) => !cmd.description.es.includes('no en cmd')).map((cmd) => cmd.id)).toEqual([]);
	});

	it('el código en línea de R y Julia va entre comillas dobles, sin comillas dobles dentro ni variantes', () => {
		const inline = bundledCatalog
			.filter((c) => c.id === 'r' || c.id === 'julia')
			.flatMap((c) => c.commands)
			.filter((cmd) => / -e "/.test(cmd.command));
		expect(inline.length).toBe(18);
		for (const cmd of inline) {
			const code = /-e "([^"]*)"/.exec(cmd.command);
			expect(code, cmd.id).not.toBeNull();
			expect(cmd.command.split('"').length, cmd.id).toBe(3);
			expect(cmd.shells?.powershell, cmd.id).toBeUndefined();
			expect(cmd.shells?.cmd, cmd.id).toBeUndefined();
		}
	});

	it('añadir un paquete de Julia es igual en bash y en PowerShell', () => {
		const expected = 'julia --project -e "using Pkg; Pkg.add(ARGS)" Example';
		expect(exampleFor('julia.pkg-add', 'bash')).toBe(expected);
		expect(exampleFor('julia.pkg-add', 'powershell')).toBe(expected);
	});

	it('R usa R.exe en PowerShell, porque r es el alias de Invoke-History', () => {
		expect(exampleFor('r.cmd-check', 'powershell')).toBe('R.exe CMD check mypkg_0.1.0.tar.gz');
		expect(exampleFor('r.cmd-check', 'bash')).toBe('R CMD check mypkg_0.1.0.tar.gz');
		expect(exampleFor('r.cmd-check', 'cmd')).toBe('R CMD check mypkg_0.1.0.tar.gz');
		const r = bundledCatalog.find((c) => c.id === 'r')!.commands.filter((cmd) => /^R\b/.test(cmd.command));
		expect(r.filter((cmd) => !cmd.shells?.powershell?.startsWith('R.exe')).map((cmd) => cmd.id)).toEqual([]);
	});

	it('borrar la salida de Zig usa la sintaxis de cada shell y es destructive', () => {
		expect(exampleFor('zig.clean', 'bash')).toBe('rm -rf zig-out .zig-cache');
		expect(exampleFor('zig.clean', 'powershell')).toBe('Remove-Item -Recurse -Force zig-out, .zig-cache');
		expect(exampleFor('zig.clean', 'cmd')).toBe('rmdir /s /q zig-out .zig-cache');
		expect(commandById('zig.clean').risk).toBe('destructive');
		expect(commandById('lua.rocks-remove').risk).toBe('destructive');
	});

	it('zig init y zig fetch indican que siguen Zig 0.17, y make test avisa de gmake', () => {
		for (const id of ['zig.init', 'zig.fetch-save']) {
			expect(commandById(id).description.es, id).toContain('Zig 0.17');
		}
		expect(commandById('perl.make-test').description.es).toContain('gmake');
	});

	it('los clean de Mix, rebar3, Cabal, Stack, sbt, Leiningen y Dune son destructive', () => {
		const commands = ['mix clean', 'rebar3 clean', 'cabal clean', 'stack clean', 'sbt clean', 'lein clean', 'dune clean'];
		const cleans = bundledCatalog.flatMap((c) => c.commands).filter((cmd) => commands.includes(cmd.command));
		expect(cleans.map((cmd) => cmd.command).sort()).toEqual([...commands].sort());
		expect(cleans.filter((cmd) => cmd.risk !== 'destructive').map((cmd) => cmd.id)).toEqual([]);
	});

	it('gem uninstall, flutter clean y swift package clean son destructive', () => {
		const ids = ['ruby.gem-uninstall', 'flutter.clean', 'swift.package-clean'];
		const found = bundledCatalog.flatMap((c) => c.commands).filter((cmd) => ids.includes(cmd.id));
		expect(found.map((cmd) => cmd.id).sort()).toEqual([...ids].sort());
		expect(found.filter((cmd) => cmd.risk !== 'destructive').map((cmd) => cmd.id)).toEqual([]);
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
