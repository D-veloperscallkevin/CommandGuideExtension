import { describe, expect, it } from 'vitest';
import { bundledCatalog } from '../catalog/bundled';
import { detectCategories, PROJECT_SIGNALS, SIGNAL_GLOB } from '../../../src/project/detect';

/** Comprobación de existencia sobre un mapa raíz → entradas. */
const fs = (tree: Record<string, string[]>) => async (root: string, name: string) => (tree[root] ?? []).includes(name);
const ids = async (tree: Record<string, string[]>) => [...(await detectCategories(Object.keys(tree), fs(tree)))].sort();

describe('detectCategories', () => {
	it.each(PROJECT_SIGNALS.map((s) => [s.file, s.categoryId]))('%s en la raíz detecta %s', async (file, categoryId) => {
		expect(await ids({ root: [file] })).toEqual([categoryId]);
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

	it('una comprobación que falla cuenta como inexistente', async () => {
		const result = await detectCategories(['root'], async (_root, name) => {
			if (name === '.git') {
				throw new Error('EACCES');
			}
			return name === 'package.json';
		});
		expect([...result]).toEqual(['node']);
	});

	it('solo mira las entradas de las señales (no subcarpetas)', async () => {
		expect(await ids({ root: ['webview-ui/package.json', 'api/Dockerfile'] })).toEqual([]);
	});
});

describe('PROJECT_SIGNALS', () => {
	it('cada señal apunta a una categoría del catálogo incluido', () => {
		const catalogIds = new Set(bundledCatalog.map((c) => c.id));
		for (const signal of PROJECT_SIGNALS) {
			expect(catalogIds.has(signal.categoryId), signal.file).toBe(true);
		}
	});

	it('terminal nunca se detecta', () => {
		expect(PROJECT_SIGNALS.some((s) => s.categoryId === 'terminal')).toBe(false);
	});

	it('el glob del watcher incluye todas las señales', () => {
		expect(SIGNAL_GLOB).toBe(`{${PROJECT_SIGNALS.map((s) => s.file).join(',')}}`);
		for (const signal of PROJECT_SIGNALS) {
			expect(SIGNAL_GLOB).toContain(signal.file);
		}
	});
});
