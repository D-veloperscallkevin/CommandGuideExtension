import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildSearchText, normalize, queryWords, search } from '../../../src/catalog/search';

describe('normalize', () => {
	it('pasa a minúsculas y quita diacríticos', () => {
		expect(normalize('Índice ÁRBOL')).toBe('indice arbol');
		expect(normalize('Año Über Ça')).toBe('ano uber ca');
	});

	it('colapsa y recorta los espacios', () => {
		expect(normalize('  git \t  status \n')).toBe('git status');
	});

	it('no altera el japonés ni el coreano', () => {
		expect(normalize('ブランチ')).toBe('ブランチ');
		expect(normalize('브랜치')).toBe('브랜치');
	});

	it('quita la diéresis de la ё rusa', () => {
		expect(normalize('Всё')).toBe('все');
	});
});

describe('queryWords', () => {
	it('parte la búsqueda normalizada en palabras', () => {
		expect(queryWords('  Git  ESTADO ')).toEqual(['git', 'estado']);
	});

	it('devuelve [] si solo hay espacios', () => {
		expect(queryWords('   ')).toEqual([]);
		expect(queryWords('')).toEqual([]);
	});
});

describe('buildSearchText', () => {
	it('normaliza, quita vacíos y repetidos y separa las partes', () => {
		expect(buildSearchText(['Git', 'git', '', ' Ver   estado ', 'Índice'])).toBe('git · ver estado · indice');
	});
});

describe('search', () => {
	const items = [
		{ id: 'status', title: 'Ver estado', searchText: buildSearchText(['Ver estado', 'estado', 'cambios', 'git status']) },
		{ id: 'branch', title: 'Crear rama', searchText: buildSearchText(['Crear rama', 'git checkout -b x']) },
		{ id: 'reset', title: 'Descartar todos los cambios', searchText: buildSearchText(['Descartar todos los cambios', 'Índice', 'git reset --hard']) },
	];
	const ids = (query: string) => search(items, query).map((i) => i.id);

	it('exige todas las palabras', () => {
		expect(ids('git estado')).toEqual(['status']);
		expect(ids('git')).toEqual(['status', 'branch', 'reset']);
	});

	it('no distingue mayúsculas ni tildes', () => {
		expect(ids('INDICE')).toEqual(['reset']);
		expect(ids('índice')).toEqual(['reset']);
	});

	it('pone primero las coincidencias en el título y conserva el orden en cada grupo', () => {
		expect(ids('cambios')).toEqual(['reset', 'status']);
	});

	it('una búsqueda vacía o sin coincidencias no devuelve nada', () => {
		expect(ids('  ')).toEqual([]);
		expect(ids('zzz')).toEqual([]);
	});

	it('no une el final de un campo con el principio del siguiente', () => {
		const joined = [{ title: 'ab', searchText: buildSearchText(['ab', 'cd']) }];
		expect(search(joined, 'bc')).toEqual([]);
	});
});

describe('search.ts', () => {
	it('no importa nada (el webview lo empaqueta)', () => {
		const source = readFileSync(new URL('../../../src/catalog/search.ts', import.meta.url), 'utf8');
		expect(source).not.toMatch(/^\s*import\s/m);
		expect(source).not.toMatch(/require\(/);
	});
});
