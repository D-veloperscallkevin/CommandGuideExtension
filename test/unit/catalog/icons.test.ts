import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bundledCatalog } from '../../../src/catalog/index';
import type { Category } from '../../../src/catalog/types';
import { makeCategory } from './fixtures';

const css = readFileSync(resolve('webview-ui/node_modules/@vscode/codicons/dist/codicon.css'), 'utf8');
const codicons = new Set([...css.matchAll(/\.codicon-([a-z0-9-]+):before/g)].map((m) => m[1]));

/** Categorías cuyo `icon` no es un Codicon, como "id: icon". */
function missingIcons(categories: readonly Category[]): string[] {
	return categories.filter((c) => !codicons.has(c.icon)).map((c) => `${c.id}: ${c.icon}`);
}

describe('iconos del catálogo', () => {
	it('el CSS de @vscode/codicons declara iconos', () => {
		expect(codicons.size).toBeGreaterThan(100);
	});

	it('cada categoría del catálogo empaquetado usa un Codicon existente', () => {
		expect(missingIcons(bundledCatalog)).toEqual([]);
	});

	it('detecta un icono inexistente nombrando la categoría', () => {
		expect(missingIcons([{ ...makeCategory('demo', []), icon: 'no-existe' }])).toEqual(['demo: no-existe']);
	});
});
