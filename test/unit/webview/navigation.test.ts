import { describe, expect, it } from 'vitest';
import {
	FAVORITES_CARD_ID,
	initialView,
	navigate,
	nextIndex,
	parseSavedView,
	RECENT_CARD_ID,
	resolveView,
} from '../../../webview-ui/src/navigation';

describe('navigate', () => {
	it('abre una categoría', () => {
		expect(navigate(initialView, { type: 'open', categoryId: 'git' })).toEqual({ screen: 'category', categoryId: 'git' });
	});

	it('al volver, devuelve el foco a la categoría de la que se salió', () => {
		const opened = navigate(initialView, { type: 'open', categoryId: 'git' });
		expect(navigate(opened, { type: 'back' })).toEqual({ screen: 'categories', focusCategoryId: 'git' });
	});

	it('volver desde la lista no cambia nada', () => {
		expect(navigate(initialView, { type: 'back' })).toBe(initialView);
	});
});

describe('foco', () => {
	it('focusCategory guarda la categoría con foco en la lista', () => {
		expect(navigate(initialView, { type: 'focusCategory', categoryId: 'npm' })).toEqual({
			screen: 'categories',
			focusCategoryId: 'npm',
		});
	});

	it('focusCommand guarda el comando con foco en la pantalla de la categoría', () => {
		const opened = navigate(initialView, { type: 'open', categoryId: 'git' });
		expect(navigate(opened, { type: 'focusCommand', commandId: 'git.status' })).toEqual({
			screen: 'category',
			categoryId: 'git',
			focusCommandId: 'git.status',
		});
	});

	it('sin cambios devuelve la misma vista (no provoca renders ni setState)', () => {
		const view = { screen: 'category', categoryId: 'git', focusCommandId: 'git.status' } as const;
		expect(navigate(view, { type: 'focusCommand', commandId: 'git.status' })).toBe(view);
		expect(navigate(view, { type: 'focusCategory', categoryId: 'git' })).toBe(view);
		expect(navigate(initialView, { type: 'focusCommand', commandId: 'git.status' })).toBe(initialView);
	});

	it('abrir otra categoría no arrastra el foco de comando anterior', () => {
		const view = { screen: 'category', categoryId: 'git', focusCommandId: 'git.status' } as const;
		expect(navigate(navigate(view, { type: 'back' }), { type: 'open', categoryId: 'npm' })).toEqual({
			screen: 'category',
			categoryId: 'npm',
		});
	});
});

describe('parseSavedView', () => {
	it.each([
		[{ screen: 'categories' }],
		[{ screen: 'categories', focusCategoryId: 'git' }],
		[{ screen: 'category', categoryId: 'git' }],
		[{ screen: 'category', categoryId: 'git', focusCommandId: 'git.status' }],
	])('acepta %j', (value) => {
		expect(parseSavedView(value)).toEqual(value);
	});

	it.each([
		[undefined],
		[null],
		['categories'],
		[[]],
		[{ screen: 42 }],
		[{ screen: 'settings' }],
		[{ screen: 'category' }],
		[{ screen: 'category', categoryId: 7 }],
		[{ screen: 'categories', focusCategoryId: null }],
		[{ screen: 'categories', extra: 'x' }],
		[{ screen: 'category', categoryId: 'git', focusCategoryId: 'git' }],
	])('rechaza %j', (value) => {
		expect(parseSavedView(value)).toBeUndefined();
	});
});

describe('resolveView', () => {
	const catalog = [
		{ id: 'git', commands: [{ id: 'git.status' }, { id: 'git.new-branch' }] },
		{ id: 'npm', commands: [] },
	];

	it('mantiene la vista si todo sigue en el catálogo', () => {
		const view = { screen: 'category', categoryId: 'git', focusCommandId: 'git.new-branch' } as const;
		expect(resolveView(view, catalog)).toBe(view);
		const list = { screen: 'categories', focusCategoryId: 'npm' } as const;
		expect(resolveView(list, catalog)).toBe(list);
	});

	it('vuelve a la lista si la categoría abierta desaparece', () => {
		expect(resolveView({ screen: 'category', categoryId: 'docker' }, catalog)).toEqual(initialView);
	});

	it('quita el foco de un comando que ya no existe', () => {
		expect(resolveView({ screen: 'category', categoryId: 'git', focusCommandId: 'git.gone' }, catalog)).toEqual({
			screen: 'category',
			categoryId: 'git',
		});
	});

	it('la acción resolve aplica resolveView', () => {
		expect(navigate({ screen: 'category', categoryId: 'docker' }, { type: 'resolve', categories: catalog })).toEqual(
			initialView,
		);
	});

	it('quita el foco de una categoría que ya no existe', () => {
		expect(resolveView({ screen: 'categories', focusCategoryId: 'docker' }, catalog)).toEqual(initialView);
	});

	it('un catalog reenviado al cambiar de shell (mismos ids) conserva pantalla, búsqueda y foco', () => {
		// Los ejemplos cambian, pero resolve solo mira los ids.
		const resent = catalog.map((c) => ({ ...c, commands: c.commands.map((cmd) => ({ ...cmd })) }));
		const inCategory = { screen: 'category', categoryId: 'git', focusCommandId: 'git.status' } as const;
		expect(navigate(inCategory, { type: 'resolve', categories: resent })).toBe(inCategory);
		const searching = { screen: 'categories', query: 'rama', focusCommandId: 'git.new-branch' } as const;
		expect(navigate(searching, { type: 'resolve', categories: resent })).toBe(searching);
	});
});

describe('búsqueda', () => {
	const catalog = [
		{ id: 'git', commands: [{ id: 'git.status' }, { id: 'git.new-branch' }] },
		{ id: 'npm', commands: [] },
	];

	it('search guarda la consulta y quita el foco del resultado anterior', () => {
		const view = { screen: 'categories', focusCategoryId: 'git', query: 'ra', focusCommandId: 'git.status' } as const;
		expect(navigate(view, { type: 'search', query: 'rama' })).toEqual({
			screen: 'categories',
			focusCategoryId: 'git',
			query: 'rama',
		});
	});

	it('una consulta vacía quita la búsqueda; con solo espacios se conserva el texto escrito', () => {
		const view = { screen: 'categories', query: 'git', focusCommandId: 'git.status' } as const;
		expect(navigate(view, { type: 'search', query: '' })).toEqual(initialView);
		expect(navigate(initialView, { type: 'search', query: '  ' })).toEqual({ screen: 'categories', query: '  ' });
	});

	it('focusCommand guarda el resultado con foco solo si hay búsqueda', () => {
		const searching = { screen: 'categories', query: 'git' } as const;
		expect(navigate(searching, { type: 'focusCommand', commandId: 'git.status' })).toEqual({
			...searching,
			focusCommandId: 'git.status',
		});
		const blank = { screen: 'categories', query: '  ' } as const;
		expect(navigate(blank, { type: 'focusCommand', commandId: 'git.status' })).toBe(blank);
	});

	it('search no afecta a la pantalla de una categoría', () => {
		const view = { screen: 'category', categoryId: 'git' } as const;
		expect(navigate(view, { type: 'search', query: 'git' })).toBe(view);
	});

	it.each([
		[{ screen: 'categories', query: 'rama' }],
		[{ screen: 'categories', query: 'rama', focusCommandId: 'git.new-branch' }],
		[{ screen: 'categories', focusCategoryId: 'git', query: 'rama' }],
	])('parseSavedView acepta %j', (value) => {
		expect(parseSavedView(value)).toEqual(value);
	});

	it.each([
		[{ screen: 'categories', query: 42 }],
		[{ screen: 'categories', query: 'rama', focusCommandId: null }],
		[{ screen: 'category', categoryId: 'git', query: 'rama' }],
	])('parseSavedView rechaza %j', (value) => {
		expect(parseSavedView(value)).toBeUndefined();
	});

	it('resolveView quita el foco de un resultado que ya no existe y conserva la búsqueda', () => {
		expect(resolveView({ screen: 'categories', query: 'rama', focusCommandId: 'git.gone' }, catalog)).toEqual({
			screen: 'categories',
			query: 'rama',
		});
		const kept = { screen: 'categories', query: 'rama', focusCommandId: 'git.new-branch' } as const;
		expect(resolveView(kept, catalog)).toBe(kept);
	});
});

describe('favoritos', () => {
	const catalog = [{ id: 'git', commands: [{ id: 'git.status' }, { id: 'git.new-branch' }] }];

	it('openFavorites abre la pantalla de favoritos sin foco', () => {
		expect(navigate({ screen: 'categories', focusCategoryId: 'git' }, { type: 'openFavorites' })).toEqual({
			screen: 'favorites',
		});
	});

	it('al volver, el foco queda en la tarjeta de favoritos', () => {
		expect(navigate({ screen: 'favorites', focusCommandId: 'git.status' }, { type: 'back' })).toEqual({
			screen: 'categories',
			focusCategoryId: FAVORITES_CARD_ID,
		});
	});

	it('focusCommand guarda el comando con foco en la pantalla de favoritos', () => {
		expect(navigate({ screen: 'favorites' }, { type: 'focusCommand', commandId: 'git.status' })).toEqual({
			screen: 'favorites',
			focusCommandId: 'git.status',
		});
	});

	it('la tarjeta no puede coincidir con un id de categoría del catálogo', () => {
		expect(FAVORITES_CARD_ID).not.toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
	});

	it.each([
		['sin foco', { screen: 'favorites' }],
		['con foco', { screen: 'favorites', focusCommandId: 'git.status' }],
	])('parseSavedView acepta la pantalla de favoritos %s', (_name, value) => {
		expect(parseSavedView(value)).toEqual(value);
	});

	it.each([
		['foco no string', { screen: 'favorites', focusCommandId: 3 }],
		['campos de más', { screen: 'favorites', categoryId: 'git' }],
	])('parseSavedView rechaza la pantalla de favoritos con %s', (_name, value) => {
		expect(parseSavedView(value)).toBeUndefined();
	});

	it('resolveView conserva la pantalla y quita el foco de un comando desaparecido', () => {
		const view = { screen: 'favorites', focusCommandId: 'git.status' } as const;
		expect(resolveView(view, catalog)).toBe(view);
		expect(resolveView({ screen: 'favorites', focusCommandId: 'git.gone' }, catalog)).toEqual({ screen: 'favorites' });
	});

	it('resolveView conserva el foco en la tarjeta aunque no sea una categoría', () => {
		const view = { screen: 'categories', focusCategoryId: FAVORITES_CARD_ID } as const;
		expect(resolveView(view, catalog)).toBe(view);
	});
});

describe('recientes', () => {
	const catalog = [{ id: 'git', commands: [{ id: 'git.status' }] }];
	const entryId = '3f2a9c1e-0b7d-4e6a-9c51-2d8f7a1b4e60';

	it('openRecent abre la pantalla de recientes sin foco', () => {
		expect(navigate({ screen: 'categories', focusCategoryId: 'git' }, { type: 'openRecent' })).toEqual({
			screen: 'recent',
		});
	});

	it('al volver, el foco queda en la tarjeta de recientes', () => {
		expect(navigate({ screen: 'recent', focusCommandId: entryId }, { type: 'back' })).toEqual({
			screen: 'categories',
			focusCategoryId: RECENT_CARD_ID,
		});
	});

	it('focusCommand guarda la entrada con foco', () => {
		expect(navigate({ screen: 'recent' }, { type: 'focusCommand', commandId: entryId })).toEqual({
			screen: 'recent',
			focusCommandId: entryId,
		});
	});

	it('la tarjeta no puede coincidir con un id de categoría ni con la de favoritos', () => {
		expect(RECENT_CARD_ID).not.toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
		expect(RECENT_CARD_ID).not.toBe(FAVORITES_CARD_ID);
	});

	it.each([
		['sin foco', { screen: 'recent' }],
		['con foco', { screen: 'recent', focusCommandId: entryId }],
	])('parseSavedView acepta la pantalla de recientes %s', (_name, value) => {
		expect(parseSavedView(value)).toEqual(value);
	});

	it.each([
		['foco no string', { screen: 'recent', focusCommandId: 3 }],
		['campos de más', { screen: 'recent', categoryId: 'git' }],
	])('parseSavedView rechaza la pantalla de recientes con %s', (_name, value) => {
		expect(parseSavedView(value)).toBeUndefined();
	});

	it('resolveView conserva la pantalla y la entrada con foco', () => {
		const view = { screen: 'recent', focusCommandId: entryId } as const;
		expect(resolveView(view, catalog)).toBe(view);
	});

	it('resolveView conserva el foco en la tarjeta aunque no sea una categoría', () => {
		const view = { screen: 'categories', focusCategoryId: RECENT_CARD_ID } as const;
		expect(resolveView(view, catalog)).toBe(view);
	});
});

describe('nextIndex', () => {
	it.each([
		[0, 'ArrowDown', 3, 1],
		[2, 'ArrowDown', 3, 2],
		[1, 'ArrowUp', 3, 0],
		[0, 'ArrowUp', 3, 0],
		[1, 'Home', 3, 0],
		[0, 'End', 3, 2],
		[0, 'Tab', 3, undefined],
		[0, 'Enter', 3, undefined],
		[0, 'ArrowDown', 0, undefined],
	])('desde %i con %s (longitud %i) -> %s', (current, key, length, expected) => {
		expect(nextIndex(current, key, length)).toBe(expected);
	});

	it('Fin y después Flecha arriba deja el foco en la penúltima', () => {
		expect(nextIndex(nextIndex(0, 'End', 5)!, 'ArrowUp', 5)).toBe(3);
	});
});
