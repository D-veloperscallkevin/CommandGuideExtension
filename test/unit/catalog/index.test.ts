import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bundledCatalog } from '../../../src/catalog/index';

describe('catálogo empaquetado', () => {
	it('registra todos los archivos de catalog/ (el nombre del archivo es el id de la categoría)', () => {
		const files = readdirSync(resolve('catalog')).filter((f) => f.endsWith('.json') && f !== 'schema.json');
		const registered = new Set(bundledCatalog.map((c) => `${c.id}.json`));
		const missing = files.filter((f) => !registered.has(f));
		expect(missing, `sin registrar en src/catalog/index.ts: ${missing.join(', ')}`).toEqual([]);
		expect([...registered].sort()).toEqual([...files].sort());
	});
});
