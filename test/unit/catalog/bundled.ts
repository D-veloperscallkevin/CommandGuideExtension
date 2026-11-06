// Catálogo real (catalog/*.json) para los tests, leído con el mismo cargador que usa la extensión.
import { resolve } from 'node:path';
import { loadCatalogDir } from '../../../src/catalog/load';

export const catalogDir = resolve('catalog');

export const bundledCatalog = loadCatalogDir(catalogDir);
