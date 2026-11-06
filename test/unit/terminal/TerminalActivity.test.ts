import { describe, expect, it } from 'vitest';
import {
	isProgramTerminal,
	pickTarget,
	TerminalActivity,
	type ActivityTerminal,
	type ActivityWindow,
	type ShellExecutionEvent,
} from '../../../src/terminal/TerminalActivity';
import type { Subscribe } from '../../../src/terminal/TargetShell';

/** Evento falso: `fire` avisa a los suscritos y `size` dice cuántos quedan. */
function fakeEvent<T>() {
	const listeners = new Set<(event: T) => unknown>();
	const subscribe: Subscribe<T> = (listener) => {
		listeners.add(listener);
		return { dispose: () => listeners.delete(listener) };
	};
	return {
		subscribe,
		fire: (event: T) => {
			for (const listener of [...listeners]) listener(event);
		},
		size: () => listeners.size,
	};
}

type Fake = ActivityTerminal & { name: string; state: { shell: string | undefined } };

function terminal(name: string, shell: string | undefined = name, creationOptions: object = {}): Fake {
	return { name, state: { shell }, creationOptions };
}

/** Ventana falsa con las terminales dadas; la activa es la última salvo que se indique. */
function setup(terminals: Fake[], active: Fake | undefined = terminals.at(-1)) {
	const activeChanged = fakeEvent<Fake | undefined>();
	const closed = fakeEvent<Fake>();
	const stateChanged = fakeEvent<Fake>();
	const started = fakeEvent<ShellExecutionEvent<Fake>>();
	const ended = fakeEvent<ShellExecutionEvent<Fake>>();
	const window: ActivityWindow<Fake> & { activeTerminal: Fake | undefined; terminals: Fake[] } = {
		activeTerminal: active,
		terminals: [...terminals],
		onDidChangeActiveTerminal: activeChanged.subscribe,
		onDidCloseTerminal: closed.subscribe,
		onDidChangeTerminalState: stateChanged.subscribe,
		onDidStartTerminalShellExecution: started.subscribe,
		onDidEndTerminalShellExecution: ended.subscribe,
	};
	const activity = new TerminalActivity(window);
	let changes = 0;
	activity.onDidChange(() => changes++);

	const focus = (next: Fake | undefined) => {
		window.activeTerminal = next;
		activeChanged.fire(next);
	};
	const close = (t: Fake) => {
		window.terminals = window.terminals.filter((x) => x !== t);
		if (window.activeTerminal === t) window.activeTerminal = undefined;
		closed.fire(t);
	};
	/** Empieza un comando en `t` y devuelve cómo terminarlo. */
	const run = (t: Fake) => {
		const execution = {};
		started.fire({ terminal: t, execution });
		return () => ended.fire({ terminal: t, execution });
	};
	const events = [activeChanged, closed, stateChanged, started, ended];
	return { activity, window, focus, close, run, stateChanged, ended, events, changes: () => changes };
}

describe('isProgramTerminal', () => {
	it.each(['node', 'python', 'julia', 'Node'])('state.shell = %s → programa', (shell) => {
		expect(isProgramTerminal(terminal('t', shell))).toBe(true);
	});

	it('pseudoterminal de otra extensión → programa', () => {
		expect(isProgramTerminal(terminal('t', undefined, { pty: {} }))).toBe(true);
	});

	it.each(['node', 'C:\\Users\\me\\AppData\\Roaming\\npm\\claude.exe', '/usr/bin/python3'])('shellPath = %s → programa', (shellPath) => {
		expect(isProgramTerminal(terminal('t', undefined, { shellPath }))).toBe(true);
	});

	it.each(['C:\\Windows\\System32\\wsl.exe', 'C:\\Program Files\\PowerShell\\7\\pwsh.exe', '/usr/bin/fish', '/bin/bash'])(
		'shellPath = %s → shell',
		(shellPath) => {
			expect(isProgramTerminal(terminal('t', undefined, { shellPath }))).toBe(false);
		},
	);

	it.each([
		['pwsh', {}],
		['bash', {}],
		[undefined, {}],
		[undefined, { shellPath: '' }],
	])('shell %s con opciones %o → shell', (shell, options) => {
		expect(isProgramTerminal(terminal('t', shell, options))).toBe(false);
	});
});

describe('pickTarget', () => {
	const busy = (...names: string[]) => (t: string) => names.includes(t);

	it('la activa libre gana', () => {
		expect(pickTarget({ active: 'a', recent: ['b', 'a'], terminals: ['a', 'b'], isBusy: busy() })).toBe('a');
	});

	it('activa ocupada → la libre usada más recientemente', () => {
		expect(pickTarget({ active: 'c', recent: ['a', 'b', 'c'], terminals: ['a', 'b', 'c'], isBusy: busy('c') })).toBe('b');
	});

	it('las nunca usadas van después de las usadas, de la última a la primera', () => {
		expect(pickTarget({ active: 'c', recent: ['a', 'c'], terminals: ['a', 'x', 'y', 'c'], isBusy: busy('c') })).toBe('a');
		expect(pickTarget({ active: 'c', recent: ['a', 'c'], terminals: ['a', 'x', 'y', 'c'], isBusy: busy('c', 'a') })).toBe('y');
	});

	it('todas ocupadas o ninguna → undefined', () => {
		expect(pickTarget({ active: 'a', recent: ['a'], terminals: ['a'], isBusy: busy('a') })).toBeUndefined();
		expect(pickTarget<string>({ active: undefined, recent: [], terminals: [], isBusy: busy() })).toBeUndefined();
	});
});

describe('TerminalActivity', () => {
	it('Windows: activa PowerShell libre → ella', () => {
		const pwsh = terminal('pwsh');
		expect(setup([terminal('gitbash'), pwsh]).activity.target()).toBe(pwsh);
	});

	it('Windows: activa PowerShell con `claude` en marcha → la otra libre; al salir vuelve', () => {
		const other = terminal('pwsh-2', 'pwsh');
		const pwsh = terminal('pwsh');
		const { activity, run } = setup([other, pwsh]);
		const stop = run(pwsh);
		expect(activity.isBusy(pwsh)).toBe(true);
		expect(activity.target()).toBe(other);
		stop();
		expect(activity.isBusy(pwsh)).toBe(false);
		expect(activity.target()).toBe(pwsh);
	});

	it('Linux: con `pnpm dev` en A va a la libre usada más recientemente', () => {
		const a = terminal('A', 'bash');
		const b = terminal('B', 'bash');
		const c = terminal('C', 'bash');
		const { activity, focus, run } = setup([a, b, c], a);
		focus(b);
		focus(a);
		run(a);
		expect(activity.target()).toBe(b);
	});

	it('el fin de otra ejecución no libera la terminal', () => {
		const bash = terminal('bash');
		const { activity, run, ended } = setup([bash]);
		run(bash);
		ended.fire({ terminal: bash, execution: {} });
		expect(activity.isBusy(bash)).toBe(true);
	});

	it('un comando nuevo sustituye al anterior: su fin libera la terminal', () => {
		const bash = terminal('bash');
		const { activity, run } = setup([bash]);
		run(bash); // su fin se pierde
		const stop = run(bash);
		stop();
		expect(activity.isBusy(bash)).toBe(false);
	});

	it('todas ocupadas → undefined (se creará "DevCommands")', () => {
		const bash = terminal('bash');
		const { activity, run } = setup([bash]);
		run(bash);
		expect(activity.target()).toBeUndefined();
	});

	it('sin terminales → undefined', () => {
		expect(setup([]).activity.target()).toBeUndefined();
	});

	it('`node` detectado sin integración del shell → ocupada', () => {
		const pwsh = terminal('pwsh');
		const claude = terminal('claude', 'node');
		const { activity } = setup([pwsh, claude]);
		expect(activity.target()).toBe(pwsh);
	});

	it('terminal creada con `node` o pseudoterminal → ocupada', () => {
		expect(setup([terminal('n', undefined, { shellPath: 'node' })]).activity.target()).toBeUndefined();
		expect(setup([terminal('p', undefined, { pty: {} })]).activity.target()).toBeUndefined();
	});

	it('terminal de WSL o fish → libre', () => {
		const wsl = terminal('wsl', undefined, { shellPath: 'C:\\Windows\\System32\\wsl.exe' });
		expect(setup([wsl]).activity.target()).toBe(wsl);
		const fish = terminal('fish', 'fish', { shellPath: '/usr/bin/fish' });
		expect(setup([fish]).activity.target()).toBe(fish);
	});

	it('al cerrar una terminal se olvida su ejecución y su orden', () => {
		const a = terminal('A', 'bash');
		const b = terminal('B', 'bash');
		const c = terminal('C', 'bash');
		const { activity, focus, close, run } = setup([a, b, c], a);
		focus(b);
		focus(c);
		run(c);
		close(b);
		expect(activity.target()).toBe(a);
		close(c);
		expect(activity.isBusy(c)).toBe(false);
	});

	it('avisa en cada evento relevante', () => {
		const a = terminal('A', 'bash');
		const b = terminal('B', 'bash');
		const { focus, close, run, stateChanged, changes } = setup([a, b]);
		focus(a);
		const stop = run(a);
		stop();
		stateChanged.fire(a);
		close(b);
		expect(changes()).toBe(5);
	});

	it('dispose da de baja todos los listeners de VS Code', () => {
		const { activity, events } = setup([terminal('bash')]);
		activity.dispose();
		expect(events.map((e) => e.size())).toEqual([0, 0, 0, 0, 0]);
	});
});
