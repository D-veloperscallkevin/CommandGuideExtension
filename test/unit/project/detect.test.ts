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
		expect(await ids({ root: [pattern] })).toEqual([categoryId]);
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
		expect(await ids({ root: ['.nvmrc', 'pnpm-workspace.yaml', 'Containerfile'] })).toEqual(['docker', 'node', 'pnpm']);
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
