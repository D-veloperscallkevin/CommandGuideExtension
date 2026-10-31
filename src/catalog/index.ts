// Catálogo incluido en el bundle. Cada catalog/<id>.json se registra aquí con un
// import estático para que esbuild lo meta en dist/extension.js.
// La forma la garantizan los tests (Ajv + checkCatalogRules), no el compilador:
// TypeScript ensancha los literales del JSON importado.
import git from '../../catalog/git.json';
import type { Catalog, Category } from './types';

export const bundledCatalog: Catalog = [git].map((json) => json as unknown as Category);
