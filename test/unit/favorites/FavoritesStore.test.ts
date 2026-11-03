import { describe, expect, it } from 'vitest';
import { FavoritesStore, type FavoritesMemento } from '../../../src/favorites/FavoritesStore';

const known = new Set(['git.status', 'git.new-branch', 'docker.ps']);
const exists = (id: string) => known.has(id);

/** Memento falso en memoria que cuenta las escrituras. */
function fakeMemento(initial?: unknown) {
	const data = new Map<string, unknown>();
	if (initial !== undefined) {
		data.set(FavoritesStore.key, initial);
	}
	const writes: unknown[] = [];
	const memento: FavoritesMemento = {
		get: (key) => data.get(key),
		update: (key, value) => {
			data.set(key, value);
			writes.push(value);
			return Promise.resolve();
		},
	};
	return { memento, writes, saved: () => data.get(FavoritesStore.key) };
}

describe('FavoritesStore', () => {
	it('sin nada guardado, la lista está vacía', () => {
		expect(new FavoritesStore(fakeMemento().memento, exists).list()).toEqual([]);
	});

	it.each([
		['un número', 42, []],
		['un objeto', { 'git.status': true }, []],
		['un array mixto', [1, 'git.status', null], ['git.status']],
	])('un valor guardado corrupto (%s) se lee sin fallar', (_name, value, expected) => {
		expect(new FavoritesStore(fakeMemento(value).memento, exists).list()).toEqual(expected);
	});

	it('quita duplicados e ids que no existen, sin escribir', () => {
		const { memento, writes } = fakeMemento(['docker.ps', 'git.antiguo', 'git.status', 'docker.ps']);
		expect(new FavoritesStore(memento, exists).list()).toEqual(['docker.ps', 'git.status']);
		expect(writes).toHaveLength(0);
	});

	it('toggle añade al final en orden de marcado y guarda', async () => {
		const { memento, saved } = fakeMemento();
		const store = new FavoritesStore(memento, exists);
		expect(await store.toggle('docker.ps')).toEqual(['docker.ps']);
		expect(await store.toggle('git.status')).toEqual(['docker.ps', 'git.status']);
		expect(saved()).toEqual(['docker.ps', 'git.status']);
	});

	it('toggle quita un favorito', async () => {
		const { memento, saved } = fakeMemento(['docker.ps', 'git.status']);
		expect(await new FavoritesStore(memento, exists).toggle('docker.ps')).toEqual(['git.status']);
		expect(saved()).toEqual(['git.status']);
	});

	it('con un id inexistente devuelve undefined y no escribe', async () => {
		const { memento, writes } = fakeMemento(['git.status']);
		expect(await new FavoritesStore(memento, exists).toggle('git.nope')).toBeUndefined();
		expect(writes).toHaveLength(0);
	});

	it('al guardar limpia los ids desaparecidos', async () => {
		const { memento, saved } = fakeMemento(['git.antiguo', 'git.status']);
		await new FavoritesStore(memento, exists).toggle('docker.ps');
		expect(saved()).toEqual(['git.status', 'docker.ps']);
	});
});
