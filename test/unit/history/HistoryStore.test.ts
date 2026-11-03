import { describe, expect, it } from 'vitest';
import { HistoryStore, MAX_HISTORY, type HistoryMemento } from '../../../src/history/HistoryStore';

const params: Record<string, readonly string[]> = {
	'git.status': [],
	'git.new-branch': ['branch'],
	'terminal.copy': ['source', 'destination'],
};
const paramsOf = (id: string) => params[id];

/** Memento falso en memoria que cuenta las escrituras. */
function fakeMemento(initial?: unknown) {
	const data = new Map<string, unknown>();
	if (initial !== undefined) {
		data.set(HistoryStore.key, initial);
	}
	const writes: unknown[] = [];
	const memento: HistoryMemento = {
		get: (key) => data.get(key),
		update: (key, value) => {
			data.set(key, value);
			writes.push(value);
			return Promise.resolve();
		},
	};
	return { memento, writes };
}

/** Almacén con un generador de ids `e1`, `e2`… */
function makeStore(initial?: unknown) {
	const fake = fakeMemento(initial);
	let n = 0;
	const store = new HistoryStore(fake.memento, paramsOf, () => `e${++n}`);
	return { store, ...fake };
}

const values = (entries: Record<string, string> = {}) => new Map(Object.entries(entries));

describe('HistoryStore', () => {
	it('sin nada guardado, el historial está vacío', () => {
		expect(makeStore().store.list()).toEqual([]);
	});

	it.each([42, 'x', { a: 1 }, null])('un valor guardado corrupto (%j) se trata como vacío', (saved) => {
		expect(makeStore(saved).store.list()).toEqual([]);
	});

	it('omite las entradas sin la forma esperada y no escribe nada', () => {
		const ok = { id: 'a1', commandId: 'git.status', values: {} };
		const { store, writes } = makeStore([
			ok,
			42,
			{ commandId: 'git.status', values: {} },
			{ id: 'a2', commandId: 'git.status' },
			{ id: 'a3', commandId: 'git.status', values: [] },
			{ id: 'a4', commandId: 7, values: {} },
		]);
		expect(store.list()).toEqual([ok]);
		expect(writes).toEqual([]);
	});

	it('omite ids repetidos o con caracteres no admitidos', () => {
		const { store } = makeStore([
			{ id: 'a1', commandId: 'git.status', values: {} },
			{ id: 'a1', commandId: 'git.new-branch', values: { branch: 'main' } },
			{ id: 'a/2', commandId: 'git.new-branch', values: { branch: 'dev' } },
			{ id: 'a'.repeat(65), commandId: 'git.new-branch', values: { branch: 'x' } },
		]);
		expect(store.list().map((e) => e.id)).toEqual(['a1']);
	});

	it('omite comandos que ya no existen y valores que no encajan con sus parámetros', () => {
		const { store } = makeStore([
			{ id: 'a1', commandId: 'git.antiguo', values: {} },
			{ id: 'a2', commandId: 'git.new-branch', values: {} },
			{ id: 'a3', commandId: 'git.new-branch', values: { rama: 'main' } },
			{ id: 'a4', commandId: 'git.new-branch', values: { branch: 'main', extra: 'x' } },
			{ id: 'a5', commandId: 'git.status', values: { branch: 'main' } },
			{ id: 'a6', commandId: 'git.new-branch', values: { branch: 1 } },
			{ id: 'a7', commandId: 'git.new-branch', values: { branch: 'fix/login' } },
		]);
		expect(store.list().map((e) => e.id)).toEqual(['a7']);
	});

	it('omite valores vacíos, con caracteres de control o de más de 500 caracteres', () => {
		const { store } = makeStore([
			{ id: 'a1', commandId: 'git.new-branch', values: { branch: '  ' } },
			{ id: 'a2', commandId: 'git.new-branch', values: { branch: 'main\nrm -rf ~' } },
			{ id: 'a3', commandId: 'git.new-branch', values: { branch: 'a'.repeat(501) } },
			{ id: 'a4', commandId: 'git.new-branch', values: { branch: 'say "hi"' } },
		]);
		expect(store.list().map((e) => e.id)).toEqual(['a4']);
	});

	it('record pone la entrada nueva al principio y la guarda', async () => {
		const { store, writes } = makeStore();
		await store.record('git.status', values());
		const result = await store.record('git.new-branch', values({ branch: 'fix/login' }));
		expect(result).toEqual([
			{ id: 'e2', commandId: 'git.new-branch', values: { branch: 'fix/login' } },
			{ id: 'e1', commandId: 'git.status', values: {} },
		]);
		expect(store.list()).toEqual(result);
		expect(writes).toHaveLength(2);
	});

	it('el mismo comando con los mismos valores sube arriba y conserva su clave', async () => {
		const { store } = makeStore();
		await store.record('terminal.copy', values({ source: 'a', destination: 'b' }));
		await store.record('git.status', values());
		const result = await store.record('terminal.copy', values({ destination: 'b', source: 'a' }));
		expect(result.map((e) => [e.id, e.commandId])).toEqual([
			['e1', 'terminal.copy'],
			['e2', 'git.status'],
		]);
	});

	it('el mismo comando con otros valores son dos entradas', async () => {
		const { store } = makeStore();
		await store.record('git.new-branch', values({ branch: 'fix/login' }));
		const result = await store.record('git.new-branch', values({ branch: 'docs/readme' }));
		expect(result.map((e) => e.values.branch)).toEqual(['docs/readme', 'fix/login']);
	});

	it(`guarda como máximo ${MAX_HISTORY} entradas y descarta la más antigua`, async () => {
		const { store } = makeStore();
		for (let i = 0; i <= MAX_HISTORY; i++) {
			await store.record('git.new-branch', values({ branch: `b${i}` }));
		}
		const list = store.list();
		expect(list).toHaveLength(MAX_HISTORY);
		expect(list[0].values.branch).toBe(`b${MAX_HISTORY}`);
		expect(list.some((e) => e.values.branch === 'b0')).toBe(false);
	});

	it('record limpia lo que ya no es válido al guardar', async () => {
		const { store, writes } = makeStore([{ id: 'a1', commandId: 'git.antiguo', values: {} }]);
		await store.record('git.status', values());
		expect(writes).toEqual([[{ id: 'e1', commandId: 'git.status', values: {} }]]);
	});

	it('get busca por clave', async () => {
		const { store } = makeStore();
		await store.record('git.status', values());
		expect(store.get('e1')?.commandId).toBe('git.status');
		expect(store.get('e9')).toBeUndefined();
	});

	it('clear vacía el historial', async () => {
		const { store } = makeStore();
		await store.record('git.status', values());
		await store.clear();
		expect(store.list()).toEqual([]);
	});
});
