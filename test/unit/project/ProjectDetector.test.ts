import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bundledCatalog } from '../catalog/bundled';
import { signalsFromCatalog } from '../../../src/project/detect';

const signals = signalsFromCatalog(bundledCatalog);
import { DETECT_DELAY_MS, ProjectDetector, type ProjectWorkspace, type Subscribe } from '../../../src/project/ProjectDetector';

function fakeEvent() {
	const listeners = new Set<(event: unknown) => unknown>();
	const subscribe: Subscribe<unknown> = (listener) => {
		listeners.add(listener);
		return { dispose: () => listeners.delete(listener) };
	};
	return { subscribe, fire: () => [...listeners].forEach((l) => l(undefined)), size: () => listeners.size };
}

/** Workspace falso: `tree` dice qué entradas hay en cada carpeta; los watchers se registran. */
function setup(initial: Record<string, string[]>, enabled = true) {
	const state = { tree: initial, enabled };
	const foldersChanged = fakeEvent();
	const enabledChanged = fakeEvent();
	const watchers = new Map<string, () => void>();
	const workspace: ProjectWorkspace<string> = {
		folders: () => Object.keys(state.tree),
		onDidChangeFolders: foldersChanged.subscribe,
		list: async (folder) => state.tree[folder] ?? [],
		watch: (folder, glob, onChange) => {
			expect(glob).toBe('{*,bin/*}');
			watchers.set(folder, onChange);
			return { dispose: () => watchers.delete(folder) };
		},
		enabled: () => state.enabled,
		onDidChangeEnabled: enabledChanged.subscribe,
	};
	const detector = new ProjectDetector(workspace, signals);
	const changes: string[][] = [];
	detector.onDidChange((ids) => changes.push([...ids].sort()));
	return { state, detector, changes, watchers, foldersChanged, enabledChanged };
}

const ids = (detector: ProjectDetector<string>) => [...detector.current()].sort();
/** Deja que terminen las detecciones en curso (promesas). */
const settle = () => vi.advanceTimersByTimeAsync(0);

describe('ProjectDetector', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('detecta al crearse y avisa', async () => {
		const { detector, changes, watchers } = setup({ root: ['package.json', 'pnpm-lock.yaml'] });
		expect(ids(detector)).toEqual([]);
		await settle();
		expect(ids(detector)).toEqual(['node', 'pnpm']);
		expect(changes).toEqual([['node', 'pnpm']]);
		expect([...watchers.keys()]).toEqual(['root']);
	});

	it('un cambio de archivos vuelve a detectar tras la espera, agrupando varios cambios', async () => {
		const { state, detector, changes, watchers } = setup({ root: ['package.json'] });
		await settle();
		state.tree = { root: ['package.json', 'Dockerfile'] };
		watchers.get('root')?.();
		await vi.advanceTimersByTimeAsync(DETECT_DELAY_MS / 2);
		watchers.get('root')?.();
		await vi.advanceTimersByTimeAsync(DETECT_DELAY_MS - 1);
		expect(ids(detector)).toEqual(['node']);
		await vi.advanceTimersByTimeAsync(1);
		expect(ids(detector)).toEqual(['docker', 'node']);
		expect(changes).toEqual([['node'], ['docker', 'node']]);
	});

	it('no avisa si el resultado no cambia', async () => {
		const { state, changes, watchers } = setup({ root: ['Dockerfile'] });
		await settle();
		state.tree = { root: ['Dockerfile', 'compose.yaml'] };
		watchers.get('root')?.();
		await vi.advanceTimersByTimeAsync(DETECT_DELAY_MS);
		expect(changes).toEqual([['docker']]);
	});

	it('al cambiar las carpetas rehace los watchers y detecta', async () => {
		const { state, detector, watchers, foldersChanged } = setup({ a: ['package-lock.json'] });
		await settle();
		state.tree = { a: ['package-lock.json'], b: ['.git'] };
		foldersChanged.fire();
		expect([...watchers.keys()].sort()).toEqual(['a', 'b']);
		await vi.advanceTimersByTimeAsync(DETECT_DELAY_MS);
		expect(ids(detector)).toEqual(['git', 'npm']);
	});

	it('con el ajuste desactivado no detecta ni vigila', async () => {
		const { detector, watchers, changes } = setup({ root: ['package.json'] }, false);
		await settle();
		expect(ids(detector)).toEqual([]);
		expect(watchers.size).toBe(0);
		expect(changes).toEqual([]);
	});

	it('desactivar vacía la detección y reactivar la recupera', async () => {
		const { state, detector, watchers, enabledChanged, changes } = setup({ root: ['package.json'] });
		await settle();
		state.enabled = false;
		enabledChanged.fire();
		await settle();
		expect(ids(detector)).toEqual([]);
		expect(watchers.size).toBe(0);
		state.enabled = true;
		enabledChanged.fire();
		await settle();
		expect(ids(detector)).toEqual(['node']);
		expect(watchers.size).toBe(1);
		expect(changes).toEqual([['node'], [], ['node']]);
	});

	it('descarta el resultado de una detección superada por otra', async () => {
		let release: (() => void) | undefined;
		const state = { tree: { root: ['package.json'] } as Record<string, string[]>, slow: true };
		const event = fakeEvent();
		const detector = new ProjectDetector<string>({
			folders: () => Object.keys(state.tree),
			onDidChangeFolders: event.subscribe,
			list: async (folder) => {
				if (state.slow) {
					await new Promise<void>((resolve) => (release = resolve));
				}
				return state.tree[folder];
			},
			watch: () => ({ dispose: () => undefined }),
			enabled: () => true,
			onDidChangeEnabled: event.subscribe,
		}, signals);
		// La primera detección queda colgada; la segunda ve un árbol nuevo y termina antes.
		state.slow = false;
		state.tree = { root: ['Dockerfile'] };
		await detector.refresh();
		expect(ids(detector)).toEqual(['docker']);
		release?.();
		await settle();
		expect(ids(detector)).toEqual(['docker']);
	});

	it('dispose suelta los watchers, las suscripciones y la espera pendiente', async () => {
		const { detector, watchers, foldersChanged, enabledChanged, changes } = setup({ root: ['package.json'] });
		await settle();
		watchers.get('root')?.();
		detector.dispose();
		await vi.advanceTimersByTimeAsync(DETECT_DELAY_MS);
		expect(watchers.size).toBe(0);
		expect(foldersChanged.size()).toBe(0);
		expect(enabledChanged.size()).toBe(0);
		expect(changes).toEqual([['node']]);
	});
});
