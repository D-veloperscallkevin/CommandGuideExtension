import { describe, expect, it } from 'vitest';
import { initialView, navigate, nextIndex, resolveView } from '../../../webview-ui/src/navigation';

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

describe('resolveView', () => {
	it('mantiene la categoría abierta si sigue en el catálogo', () => {
		const view = { screen: 'category', categoryId: 'git' } as const;
		expect(resolveView(view, ['git', 'npm'])).toBe(view);
	});

	it('vuelve a la lista si la categoría abierta desaparece', () => {
		expect(resolveView({ screen: 'category', categoryId: 'git' }, ['npm'])).toEqual(initialView);
	});

	it('no toca la lista', () => {
		const view = { screen: 'categories', focusCategoryId: 'git' } as const;
		expect(resolveView(view, [])).toBe(view);
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
