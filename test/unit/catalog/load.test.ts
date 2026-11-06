import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { catalogFiles, loadCatalogDir } from '../../../src/catalog/load';
import { catalogDir } from './bundled';

describe('loadCatalogDir', () => {
	let temp: string | undefined;
	afterEach(() => {
		if (temp) rmSync(temp, { recursive: true, force: true });
		temp = undefined;
	});

	it('lee todas las categorías de catalog/ e ignora schema.json', () => {
		const files = catalogFiles(catalogDir);
		expect(files).not.toContain('schema.json');
		expect(loadCatalogDir(catalogDir).map((c) => `${c.id}.json`)).toEqual(files);
	});

	it('en orden alfabético de archivo', () => {
		temp = mkdtempSync(join(tmpdir(), 'devcommands-catalog-'));
		writeFileSync(join(temp, 'b.json'), JSON.stringify({ id: 'b' }));
		writeFileSync(join(temp, 'a.json'), JSON.stringify({ id: 'a' }));
		writeFileSync(join(temp, 'notes.txt'), 'no es una categoría');
		expect(loadCatalogDir(temp).map((c) => c.id)).toEqual(['a', 'b']);
	});

	it('un JSON roto falla nombrando el archivo', () => {
		temp = mkdtempSync(join(tmpdir(), 'devcommands-catalog-'));
		writeFileSync(join(temp, 'roto.json'), '{ "id": ');
		expect(() => loadCatalogDir(temp as string)).toThrow(/roto\.json/);
	});

	it('el catálogo real se carga en menos de 200 ms', () => {
		const start = performance.now();
		loadCatalogDir(catalogDir);
		expect(performance.now() - start).toBeLessThan(200);
	});
});
