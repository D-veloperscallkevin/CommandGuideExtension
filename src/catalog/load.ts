// Lectura del catálogo desde disco. En la extensión, la carpeta es dist/catalog/ (el build copia
// allí catalog/*.json); en los tests, catalog/. Síncrona a propósito: se llama una sola vez, en
// el primer uso, y así CatalogService mantiene su API síncrona.
// La forma la garantizan los tests (Ajv + checkCatalogRules) sobre catalog/, no esta función.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Catalog, Category } from './types';

/** Archivos de categoría de una carpeta: todos los `*.json` salvo `schema.json`, en orden alfabético. */
export function catalogFiles(dir: string): string[] {
	return readdirSync(dir)
		.filter((file) => file.endsWith('.json') && file !== 'schema.json')
		.sort();
}

/** Lee y parsea cada categoría de `dir`. Un archivo ilegible o con JSON roto lanza un error que lo nombra. */
export function loadCatalogDir(dir: string): Catalog {
	return catalogFiles(dir).map((file) => {
		try {
			return JSON.parse(readFileSync(join(dir, file), 'utf8')) as Category;
		} catch (error) {
			throw new Error(`No se pudo leer el catálogo ${file}: ${String(error)}`);
		}
	});
}
