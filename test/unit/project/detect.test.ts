import { describe, expect, it } from 'vitest';
import { bundledCatalog } from '../catalog/bundled';
import { compileSignals, detectCategories, signalsFromCatalog, watchGlob, type ProjectSignal } from '../../../src/project/detect';

const realSignals = signalsFromCatalog(bundledCatalog);
const real = compileSignals(realSignals);

/** Listado sobre un mapa raíz → entradas; una entrada `dir/nombre` hace de archivo dentro de `dir`. */
const lister = (tree: Record<string, string[]>) => async (root: string, dir?: string) => {
	const entries = tree[root] ?? [];
	if (dir === undefined) {
		return [...new Set(entries.map((e) => e.split('/')[0]))];
	}
	return entries.filter((e) => e.startsWith(`${dir}/`)).map((e) => e.slice(dir.length + 1));
};
const ids = async (tree: Record<string, string[]>, signals = real) =>
	[...(await detectCategories(Object.keys(tree), signals, lister(tree)))].sort();
const custom = (...signals: ProjectSignal[]) => compileSignals(signals);

describe('detectCategories', () => {
	it.each(realSignals.map((s) => [s.pattern, s.categoryId]))('%s en la raíz detecta %s', async (pattern, categoryId) => {
		expect(await ids({ root: [pattern] })).toContain(categoryId);
	});

	it('proyecto con pnpm y Docker', async () => {
		expect(await ids({ root: ['package.json', 'pnpm-lock.yaml', 'Dockerfile', 'README.md'] })).toEqual([
			'docker',
			'node',
			'pnpm',
		]);
	});

	it('une las categorías de todas las carpetas', async () => {
		expect(await ids({ a: ['package-lock.json'], b: ['compose.yaml'] })).toEqual(['docker', 'npm']);
	});

	it('sin carpetas no detecta nada', async () => {
		expect(await ids({})).toEqual([]);
	});

	it('solo mira la raíz (no subcarpetas)', async () => {
		expect(await ids({ root: ['webview-ui/package.json', 'api/Dockerfile'] })).toEqual([]);
	});

	it('las señales nuevas de las categorías existentes', async () => {
		expect(await ids({ root: ['.nvmrc', 'pnpm-workspace.yaml', 'Containerfile'] })).toEqual([
			'docker',
			'node',
			'pnpm',
			'version-managers',
		]);
	});

	it('Yarn y TypeScript (tsconfig.build.json)', async () => {
		expect(await ids({ root: ['package.json', 'yarn.lock', 'tsconfig.build.json'] })).toEqual([
			'node',
			'typescript',
			'yarn',
		]);
	});

	it('Deno sin package.json', async () => {
		expect(await ids({ root: ['deno.json', 'main.ts'] })).toEqual(['deno']);
	});

	it('.python-version detecta python y los gestores de versiones', async () => {
		expect(await ids({ root: ['.python-version'] })).toEqual(['python', 'version-managers']);
	});

	it('proyecto con Poetry', async () => {
		expect(await ids({ root: ['pyproject.toml', 'poetry.lock'] })).toEqual(['poetry', 'python']);
	});

	it('proyecto con uv', async () => {
		expect(await ids({ root: ['pyproject.toml', 'uv.lock', '.python-version'] })).toEqual(['python', 'uv', 'version-managers']);
	});

	it('requisitos con sufijo (requirements-dev.txt)', async () => {
		expect(await ids({ root: ['requirements-dev.txt'] })).toEqual(['python']);
	});

	it('entorno de conda (environment.yml)', async () => {
		expect(await ids({ root: ['environment.yml'] })).toEqual(['conda']);
	});

	it('proyecto Maven con wrapper', async () => {
		expect(await ids({ root: ['pom.xml', 'mvnw', 'mvnw.cmd'] })).toEqual(['java', 'maven']);
	});

	it('proyecto Gradle con Kotlin (la detección no depende del shell)', async () => {
		expect(await ids({ root: ['build.gradle.kts', 'settings.gradle.kts', 'gradlew', 'gradlew.bat'] })).toEqual([
			'gradle',
			'java',
		]);
	});

	it('solución de .NET', async () => {
		expect(await ids({ root: ['App.sln', 'global.json'] })).toEqual(['dotnet']);
	});

	it('proyecto de C#', async () => {
		expect(await ids({ root: ['Api.csproj'] })).toEqual(['dotnet']);
	});

	it('versión de Java fijada con sdkman', async () => {
		expect(await ids({ root: ['.sdkmanrc'] })).toEqual(['version-managers']);
	});

	it('proyecto de C++ con CMake', async () => {
		expect(await ids({ root: ['CMakeLists.txt', 'main.cpp'] })).toEqual(['c-cpp', 'cmake']);
	});

	it('un Makefile solo no detecta ninguna categoría', async () => {
		expect(await ids({ root: ['Makefile'] })).toEqual([]);
	});

	it('proyecto de Go con Makefile (la detección no depende del shell)', async () => {
		expect(await ids({ root: ['go.mod', 'go.sum', 'Makefile'] })).toEqual(['go']);
	});

	it('proyecto de Rust', async () => {
		expect(await ids({ root: ['Cargo.toml', 'Cargo.lock', 'rust-toolchain.toml'] })).toEqual(['rust']);
	});

	it('proyecto Laravel', async () => {
		expect(await ids({ root: ['composer.json', 'composer.lock', 'artisan'] })).toEqual(['php']);
	});

	it('proyecto Rails con versión de Ruby fijada', async () => {
		expect(await ids({ root: ['Gemfile', 'Gemfile.lock', 'Rakefile', '.ruby-version'] })).toEqual([
			'ruby',
			'version-managers',
		]);
	});

	it('proyecto Flutter (la detección no depende del shell)', async () => {
		expect(await ids({ root: ['pubspec.yaml', 'pubspec.lock'] })).toEqual(['dart', 'flutter']);
	});

	it('paquete de Swift', async () => {
		expect(await ids({ root: ['Package.swift'] })).toEqual(['swift']);
	});

	it('proyecto de Xcode (la entrada es una carpeta)', async () => {
		expect(await ids({ root: ['MyApp.xcodeproj'] })).toEqual(['swift']);
	});

	it('versiones fijadas con asdf o mise en varias carpetas', async () => {
		expect(await ids({ a: ['.tool-versions'], b: ['mise.toml'] })).toEqual(['version-managers']);
	});

	it('proyecto Phoenix', async () => {
		expect(await ids({ root: ['mix.exs', 'mix.lock', '.formatter.exs'] })).toEqual(['elixir']);
	});

	it('proyecto rebar3', async () => {
		expect(await ids({ root: ['rebar.config', 'rebar.lock'] })).toEqual(['erlang']);
	});

	it('proyecto Haskell con Stack (package.yaml no detecta nada por sí solo)', async () => {
		expect(await ids({ root: ['stack.yaml', 'stack.yaml.lock', 'package.yaml', 'my-app.cabal'] })).toEqual(['haskell']);
		expect(await ids({ root: ['package.yaml'] })).toEqual([]);
	});

	it('proyecto sbt', async () => {
		expect(await ids({ root: ['build.sbt', 'project'] })).toEqual(['scala']);
	});

	it('proyecto Clojure con deps.edn y Leiningen', async () => {
		expect(await ids({ root: ['deps.edn', 'project.clj'] })).toEqual(['clojure']);
	});

	it('proyecto Dune (la detección no depende del shell)', async () => {
		expect(await ids({ root: ['dune-project', 'my_lib.opam', '.ocamlformat'] })).toEqual(['ocaml']);
	});

	it('repositorio de GitHub con workflows (la detección no depende del shell)', async () => {
		expect(await ids({ root: ['.git', '.github'] })).toEqual(['git', 'github-cli']);
	});

	it('repositorio de GitLab con CI', async () => {
		expect(await ids({ root: ['.git', '.gitlab-ci.yml'] })).toEqual(['git', 'gitlab-cli']);
	});

	it('un repositorio Git sin carpeta de la plataforma solo detecta git', async () => {
		expect(await ids({ root: ['.git'] })).toEqual(['git']);
	});

	it('paquete de R con renv', async () => {
		expect(await ids({ root: ['DESCRIPTION', 'renv.lock', 'my-pkg.Rproj'] })).toEqual(['r']);
	});

	it('rock de Lua', async () => {
		expect(await ids({ root: ['my-lib-1.0-1.rockspec', '.luacheckrc'] })).toEqual(['lua']);
	});

	it('proyecto Zig (la detección no depende del shell)', async () => {
		expect(await ids({ root: ['build.zig', 'build.zig.zon', 'zig-out'] })).toEqual(['zig']);
	});

	it('proyecto Julia', async () => {
		expect(await ids({ root: ['Project.toml', 'Manifest.toml'] })).toEqual(['julia']);
	});

	it('proyecto Perl con cpanfile y MakeMaker (el Makefile no añade nada)', async () => {
		expect(await ids({ root: ['cpanfile', 'cpanfile.snapshot', 'Makefile.PL', 'Makefile'] })).toEqual(['perl']);
	});

	it('no distingue mayúsculas (dockerfile, PACKAGE.JSON)', async () => {
		expect(await ids({ root: ['dockerfile', 'PACKAGE.JSON'] })).toEqual(['docker', 'node']);
	});

	it('una raíz que no se puede listar cuenta como vacía, sin afectar a las demás', async () => {
		const result = await detectCategories(['rota', 'bien'], real, async (root) => {
			if (root === 'rota') {
				throw new Error('EACCES');
			}
			return ['.git'];
		});
		expect([...result]).toEqual(['git']);
	});

	describe('comodines', () => {
		const dotnet = custom({ categoryId: 'dotnet', pattern: '*.csproj' });

		it('coincide en la raíz', async () => {
			expect(await ids({ root: ['Api.csproj'] }, dotnet)).toEqual(['dotnet']);
			expect(await ids({ root: ['api.CSPROJ'] }, dotnet)).toEqual(['dotnet']);
		});

		it('no coincide fuera de la raíz ni con otra extensión', async () => {
			expect(await ids({ root: ['src/Api/Api.csproj', 'Api.csproj.user.txt'] }, dotnet)).toEqual([]);
		});

		it('escapa los demás caracteres (el punto no es comodín)', async () => {
			expect(await ids({ root: ['Apixcsproj'] }, dotnet)).toEqual([]);
		});
	});

	describe('rutas de un nivel', () => {
		const prisma = custom({ categoryId: 'prisma', pattern: 'prisma/schema.prisma' });

		it('con el archivo en la carpeta', async () => {
			expect(await ids({ root: ['prisma/schema.prisma'] }, prisma)).toEqual(['prisma']);
		});

		it('sin distinguir mayúsculas en la carpeta ni en el archivo', async () => {
			expect(await ids({ root: ['Prisma/Schema.prisma'] }, prisma)).toEqual(['prisma']);
		});

		it('con la carpeta vacía o con otro archivo, no', async () => {
			expect(await ids({ root: ['prisma/other.sql'] }, prisma)).toEqual([]);
		});

		it('lista la carpeta una sola vez aunque haya varias rutas en ella, y no la lista si no existe', async () => {
			const calls: (string | undefined)[] = [];
			const signals = custom(
				{ categoryId: 'a', pattern: 'conf/a.toml' },
				{ categoryId: 'b', pattern: 'conf/b.toml' },
				{ categoryId: 'c', pattern: 'missing/c.toml' },
			);
			const result = await detectCategories(['root'], signals, async (_root, dir) => {
				calls.push(dir);
				return dir === undefined ? ['conf'] : ['b.toml'];
			});
			expect([...result]).toEqual(['b']);
			expect(calls).toEqual([undefined, 'conf']);
		});
	});
});

describe('señales del catálogo', () => {
	it('signalsFromCatalog aplana los detect en el orden del catálogo', () => {
		expect(signalsFromCatalog([{ id: 'a', detect: ['x', 'y'] }, { id: 'b' }, { id: 'c', detect: ['z'] }])).toEqual([
			{ categoryId: 'a', pattern: 'x' },
			{ categoryId: 'a', pattern: 'y' },
			{ categoryId: 'c', pattern: 'z' },
		]);
	});

	it('terminal nunca se detecta', () => {
		expect(realSignals.some((s) => s.categoryId === 'terminal')).toBe(false);
	});
});

describe('watchGlob', () => {
	it('sin rutas de un nivel vigila toda la raíz', () => {
		expect(watchGlob(real)).toBe('*');
	});

	it('con rutas añade cada carpeta una vez', () => {
		const signals = custom(
			{ categoryId: 'go', pattern: 'go.mod' },
			{ categoryId: 'prisma', pattern: 'prisma/schema.prisma' },
			{ categoryId: 'other', pattern: 'Prisma/migrate.toml' },
		);
		expect(watchGlob(signals)).toBe('{*,prisma/*}');
	});
});
