import { afterEach, describe, expect, it, vi } from 'vitest';
import { TerminalService, type TerminalHost, type TerminalLike } from '../../../src/terminal/TerminalService';

/** Terminal falsa que registra las llamadas en orden. */
function fakeTerminal(name: string, shellIntegration?: unknown) {
	const calls: string[] = [];
	const terminal: TerminalLike & { name: string; calls: string[] } = {
		name,
		calls,
		shellIntegration,
		show: (preserveFocus) => calls.push(`show(${preserveFocus})`),
		sendText: (text, shouldExecute) => calls.push(`sendText(${text}, ${shouldExecute})`),
	};
	return terminal;
}

type FakeTerminal = ReturnType<typeof fakeTerminal>;

/** Ventana falsa con `target` como destino. `fireShellReady` dispara el evento de integración del shell para una terminal. */
function fakeHost(destination?: FakeTerminal) {
	const created: FakeTerminal[] = [];
	const listeners = new Set<(event: { terminal: TerminalLike }) => unknown>();
	const host: TerminalHost = {
		createTerminal: ({ name }) => {
			const terminal = fakeTerminal(name);
			created.push(terminal);
			return terminal;
		},
		onDidChangeTerminalShellIntegration: (listener) => {
			listeners.add(listener);
			return { dispose: () => listeners.delete(listener) };
		},
	};
	const fireShellReady = (terminal: TerminalLike) => {
		for (const listener of [...listeners]) listener({ terminal });
	};
	const target = () => destination;
	return { host, target, created, listeners, fireShellReady };
}

describe('TerminalService', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('usa la terminal activa sin crear otra y escribe sin esperar', async () => {
		const active = fakeTerminal('pwsh');
		const { host, target, created, listeners } = fakeHost(active);
		expect(await new TerminalService(host, target).write('git status')).toBe(active);
		expect(created).toEqual([]);
		expect(listeners.size).toBe(0);
		expect(active.calls).toEqual(['show(false)', 'sendText(git status, false)']);
	});

	it('sin terminal activa crea "DevCommands"', async () => {
		const { host, target, created, fireShellReady } = fakeHost();
		const writing = new TerminalService(host, target).write('git status');
		fireShellReady(created[0]);
		const terminal = await writing;
		expect(created).toHaveLength(1);
		expect(created[0].name).toBe('DevCommands');
		expect(terminal).toBe(created[0]);
	});

	it('en una terminal nueva espera a que el shell esté listo antes de escribir', async () => {
		vi.useFakeTimers();
		const { host, target, created, listeners, fireShellReady } = fakeHost();
		const writing = new TerminalService(host, target).write('docker images');
		await vi.advanceTimersByTimeAsync(500);
		expect(created[0].calls).toEqual(['show(false)']);

		// El evento de otra terminal no cuenta.
		fireShellReady(fakeTerminal('otra'));
		await vi.advanceTimersByTimeAsync(0);
		expect(created[0].calls).toEqual(['show(false)']);

		fireShellReady(created[0]);
		await writing;
		expect(created[0].calls).toEqual(['show(false)', 'sendText(docker images, false)']);
		expect(listeners.size).toBe(0);
	});

	it('con la integración del shell desactivada (sin aviso), escribe al agotar la espera', async () => {
		vi.useFakeTimers();
		const { host, target, created, listeners } = fakeHost();
		const writing = new TerminalService(host, target, 1000).write('git status');
		await vi.advanceTimersByTimeAsync(999);
		expect(created[0].calls).toEqual(['show(false)']);
		await vi.advanceTimersByTimeAsync(1);
		await writing;
		expect(created[0].calls).toEqual(['show(false)', 'sendText(git status, false)']);
		expect(listeners.size).toBe(0);
	});

	it('escribe en el destino aunque no sea la terminal activa (la activa está ocupada), sin crear otra', async () => {
		const free = fakeTerminal('gitbash', {});
		let asked = 0;
		const { host, created, listeners } = fakeHost();
		const service = new TerminalService(host, () => {
			asked++;
			return free;
		});
		expect(await service.write('git status')).toBe(free);
		expect(asked).toBe(1);
		expect(created).toEqual([]);
		expect(listeners.size).toBe(0);
		expect(free.calls).toEqual(['show(false)', 'sendText(git status, false)']);
	});

	it('sin destino libre (todas ocupadas) crea "DevCommands" y espera al shell', async () => {
		vi.useFakeTimers();
		const { host, target, created, fireShellReady } = fakeHost();
		const writing = new TerminalService(host, target).write('git status');
		await vi.advanceTimersByTimeAsync(100);
		expect(created[0].name).toBe('DevCommands');
		expect(created[0].calls).toEqual(['show(false)']);
		fireShellReady(created[0]);
		await writing;
		expect(created[0].calls).toEqual(['show(false)', 'sendText(git status, false)']);
	});

	it('muestra la terminal con el foco antes de escribir, y nunca ejecuta', async () => {
		const { host, target, created, fireShellReady } = fakeHost();
		const writing = new TerminalService(host, target).write('git reset --hard');
		fireShellReady(created[0]);
		await writing;
		expect(created[0].calls).toEqual(['show(false)', 'sendText(git reset --hard, false)']);
		expect(created[0].calls.some((c) => c.endsWith(', true)'))).toBe(false);
	});
});
