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

/**
 * Ventana falsa. Con `withShellIntegration`, expone el evento de integración del shell y
 * `fireShellReady` lo dispara para una terminal.
 */
function fakeHost(active?: FakeTerminal, { withShellIntegration = true } = {}) {
	const created: FakeTerminal[] = [];
	const listeners = new Set<(event: { terminal: TerminalLike }) => unknown>();
	const host: TerminalHost = {
		activeTerminal: active,
		createTerminal: ({ name }) => {
			const terminal = fakeTerminal(name);
			created.push(terminal);
			return terminal;
		},
		onDidChangeTerminalShellIntegration: withShellIntegration
			? (listener) => {
					listeners.add(listener);
					return { dispose: () => listeners.delete(listener) };
				}
			: undefined,
	};
	const fireShellReady = (terminal: TerminalLike) => {
		for (const listener of [...listeners]) listener({ terminal });
	};
	return { host, created, listeners, fireShellReady };
}

describe('TerminalService', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('usa la terminal activa sin crear otra y escribe sin esperar', async () => {
		const active = fakeTerminal('pwsh');
		const { host, created, listeners } = fakeHost(active);
		expect(await new TerminalService(host).write('git status')).toBe(active);
		expect(created).toEqual([]);
		expect(listeners.size).toBe(0);
		expect(active.calls).toEqual(['show(false)', 'sendText(git status, false)']);
	});

	it('sin terminal activa crea "DevCommands"', async () => {
		const { host, created, fireShellReady } = fakeHost();
		const writing = new TerminalService(host).write('git status');
		fireShellReady(created[0]);
		const terminal = await writing;
		expect(created).toHaveLength(1);
		expect(created[0].name).toBe('DevCommands');
		expect(terminal).toBe(created[0]);
	});

	it('en una terminal nueva espera a que el shell esté listo antes de escribir', async () => {
		vi.useFakeTimers();
		const { host, created, listeners, fireShellReady } = fakeHost();
		const writing = new TerminalService(host).write('docker images');
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

	it('si el shell no avisa, escribe al agotar la espera', async () => {
		vi.useFakeTimers();
		const { host, created, listeners } = fakeHost();
		const writing = new TerminalService(host, 1000).write('git status');
		await vi.advanceTimersByTimeAsync(999);
		expect(created[0].calls).toEqual(['show(false)']);
		await vi.advanceTimersByTimeAsync(1);
		await writing;
		expect(created[0].calls).toEqual(['show(false)', 'sendText(git status, false)']);
		expect(listeners.size).toBe(0);
	});

	it('sin la API de integración del shell (VS Code < 1.93), escribe al agotar la espera', async () => {
		vi.useFakeTimers();
		const { host, created } = fakeHost(undefined, { withShellIntegration: false });
		const writing = new TerminalService(host, 1000).write('git status');
		await vi.advanceTimersByTimeAsync(1000);
		await writing;
		expect(created[0].calls).toEqual(['show(false)', 'sendText(git status, false)']);
	});

	it('muestra la terminal con el foco antes de escribir, y nunca ejecuta', async () => {
		const { host, created, fireShellReady } = fakeHost();
		const writing = new TerminalService(host).write('git reset --hard');
		fireShellReady(created[0]);
		await writing;
		expect(created[0].calls).toEqual(['show(false)', 'sendText(git reset --hard, false)']);
		expect(created[0].calls.some((c) => c.endsWith(', true)'))).toBe(false);
	});
});
