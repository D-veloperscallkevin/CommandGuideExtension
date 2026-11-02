import { describe, expect, it } from 'vitest';
import { TerminalService, type TerminalHost, type TerminalLike } from '../../../src/terminal/TerminalService';

/** Terminal falsa que registra las llamadas en orden. */
function fakeTerminal(name: string) {
	const calls: string[] = [];
	const terminal: TerminalLike & { name: string; calls: string[] } = {
		name,
		calls,
		show: (preserveFocus) => calls.push(`show(${preserveFocus})`),
		sendText: (text, shouldExecute) => calls.push(`sendText(${text}, ${shouldExecute})`),
	};
	return terminal;
}

function fakeHost(active?: ReturnType<typeof fakeTerminal>) {
	const created: ReturnType<typeof fakeTerminal>[] = [];
	const host: TerminalHost = {
		activeTerminal: active,
		createTerminal: ({ name }) => {
			const terminal = fakeTerminal(name);
			created.push(terminal);
			return terminal;
		},
	};
	return { host, created };
}

describe('TerminalService', () => {
	it('usa la terminal activa sin crear otra', () => {
		const active = fakeTerminal('pwsh');
		const { host, created } = fakeHost(active);
		expect(new TerminalService(host).write('git status')).toBe(active);
		expect(created).toEqual([]);
		expect(active.calls).toEqual(['show(false)', 'sendText(git status, false)']);
	});

	it('sin terminal activa crea "DevCommands"', () => {
		const { host, created } = fakeHost();
		const terminal = new TerminalService(host).write('git status');
		expect(created).toHaveLength(1);
		expect(created[0].name).toBe('DevCommands');
		expect(terminal).toBe(created[0]);
	});

	it('muestra la terminal con el foco antes de escribir, y nunca ejecuta', () => {
		const { host, created } = fakeHost();
		new TerminalService(host).write('git reset --hard');
		expect(created[0].calls).toEqual(['show(false)', 'sendText(git reset --hard, false)']);
		expect(created[0].calls.some((c) => c.endsWith(', true)'))).toBe(false);
	});
});
