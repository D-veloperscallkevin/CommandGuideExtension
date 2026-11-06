import { describe, expect, it } from 'vitest';
import type { ShellId } from '../../../src/catalog/types';
import { TargetShell, type ShellEnv, type ShellTerminal, type Subscribe } from '../../../src/terminal/TargetShell';
import { TerminalActivity, type ActivityWindow, type ShellExecutionEvent } from '../../../src/terminal/TerminalActivity';

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

function terminal(shell: string | undefined, creationOptions: object = {}): ShellTerminal & { state: { shell: string | undefined } } {
	return { state: { shell }, creationOptions };
}

/**
 * Ventana y entorno falsos, con el sistema operativo dado. El destino lo decide un
 * `TerminalActivity` real sobre la ventana falsa, como en la extensión.
 */
function setup({
	active,
	others = [],
	defaultShell = '',
	platform = 'win32',
}: { active?: ShellTerminal; others?: ShellTerminal[]; defaultShell?: string; platform?: string } = {}) {
	const activeChanged = fakeEvent<ShellTerminal | undefined>();
	const closed = fakeEvent<ShellTerminal>();
	const stateChanged = fakeEvent<ShellTerminal>();
	const started = fakeEvent<ShellExecutionEvent<ShellTerminal>>();
	const ended = fakeEvent<ShellExecutionEvent<ShellTerminal>>();
	const shellChanged = fakeEvent<string>();
	const window: ActivityWindow<ShellTerminal> & { activeTerminal: ShellTerminal | undefined; terminals: ShellTerminal[] } = {
		activeTerminal: active,
		terminals: active ? [...others, active] : [...others],
		onDidChangeActiveTerminal: activeChanged.subscribe,
		onDidCloseTerminal: closed.subscribe,
		onDidChangeTerminalState: stateChanged.subscribe,
		onDidStartTerminalShellExecution: started.subscribe,
		onDidEndTerminalShellExecution: ended.subscribe,
	};
	const env: ShellEnv & { shell: string } = { shell: defaultShell, onDidChangeShell: shellChanged.subscribe };
	const activity = new TerminalActivity(window);
	const target = new TargetShell(env, platform, activity);
	const emitted: ShellId[] = [];
	target.onDidChange((shell) => emitted.push(shell));

	/** Activa `next` (abriéndola si hace falta); `undefined` cierra todas las terminales. */
	const activate = (next: ShellTerminal | undefined) => {
		if (next) {
			if (!window.terminals.includes(next)) window.terminals.push(next);
		} else {
			for (const t of window.terminals.splice(0)) closed.fire(t);
		}
		window.activeTerminal = next;
		activeChanged.fire(next);
	};
	/** Empieza un comando en `t` y devuelve cómo terminarlo. */
	const run = (t: ShellTerminal) => {
		const execution = {};
		started.fire({ terminal: t, execution });
		return () => ended.fire({ terminal: t, execution });
	};
	return { target, activity, window, env, emitted, activate, run, stateChanged, shellChanged, activeChanged };
}

describe('TargetShell.current', () => {
	it('terminal activa con Git Bash detectado en Windows → bash', () => {
		const { target } = setup({ active: terminal('gitbash'), defaultShell: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe' });
		expect(target.current()).toBe('bash');
	});

	it('sin tipo detectado usa el ejecutable con el que se creó', () => {
		const { target } = setup({
			active: terminal(undefined, { shellPath: 'C:\\Program Files\\Git\\bin\\bash.exe' }),
			defaultShell: 'powershell.exe',
		});
		expect(target.current()).toBe('bash');
	});

	it('una terminal de extensión (sin shellPath) usa el perfil por defecto', () => {
		const { target } = setup({ active: terminal(undefined, { pty: {} }), defaultShell: 'C:\\Windows\\System32\\cmd.exe' });
		expect(target.current()).toBe('cmd');
	});

	it('sin terminal activa usa el perfil por defecto', () => {
		expect(setup({ defaultShell: 'cmd.exe' }).target.current()).toBe('cmd');
		expect(setup({ defaultShell: '/usr/bin/zsh', platform: 'linux' }).target.current()).toBe('zsh');
	});

	it('sin ningún dato usa el sistema operativo', () => {
		expect(setup().target.current()).toBe('powershell');
		expect(setup({ platform: 'linux' }).target.current()).toBe('bash');
	});
});

describe('TargetShell.onDidChange', () => {
	it('al pasar de PowerShell a Git Bash avisa una vez con bash', () => {
		const { activate, emitted } = setup({ active: terminal('pwsh'), defaultShell: 'powershell.exe' });
		activate(terminal('gitbash'));
		expect(emitted).toEqual(['bash']);
	});

	it('entre dos terminales bash no avisa', () => {
		const { activate, emitted } = setup({ active: terminal('bash'), platform: 'linux' });
		activate(terminal('bash'));
		expect(emitted).toEqual([]);
	});

	it('el cambio de estado de la terminal activa avisa; el de otra terminal no', () => {
		const active = terminal(undefined);
		const other = terminal(undefined);
		const { stateChanged, emitted } = setup({ active, defaultShell: 'powershell.exe' });

		other.state.shell = 'bash';
		stateChanged.fire(other);
		expect(emitted).toEqual([]);

		active.state.shell = 'bash';
		stateChanged.fire(active);
		expect(emitted).toEqual(['bash']);
	});

	it('al cerrar la última terminal avisa con el perfil por defecto', () => {
		const { activate, emitted } = setup({ active: terminal('gitbash'), defaultShell: 'powershell.exe' });
		activate(undefined);
		expect(emitted).toEqual(['powershell']);
	});

	it('el cambio del perfil por defecto avisa si no hay terminal activa', () => {
		const { env, shellChanged, emitted } = setup({ defaultShell: 'powershell.exe' });
		env.shell = 'cmd.exe';
		shellChanged.fire('cmd.exe');
		expect(emitted).toEqual(['cmd']);
	});

	it('dispose deja de escuchar el destino y el perfil por defecto', () => {
		const { target, shellChanged, activate, emitted } = setup({ active: terminal('pwsh') });
		target.dispose();
		expect(shellChanged.size()).toBe(0);
		activate(terminal('bash'));
		expect(emitted).toEqual([]);
	});
});

describe('TargetShell con terminales ocupadas', () => {
	it('Windows: activa PowerShell ocupada con `claude` y Git Bash libre → bash; al salir vuelve a powershell', () => {
		const gitbash = terminal('gitbash');
		const pwsh = terminal('pwsh');
		const { target, run, emitted } = setup({ active: pwsh, others: [gitbash], defaultShell: 'powershell.exe' });
		expect(target.current()).toBe('powershell');
		const stop = run(pwsh);
		expect(target.current()).toBe('bash');
		stop();
		expect(target.current()).toBe('powershell');
		expect(emitted).toEqual(['bash', 'powershell']);
	});

	it('Linux: la única terminal bash ocupada con `pnpm dev` → perfil por defecto zsh', () => {
		const bash = terminal('bash');
		const { target, run, emitted } = setup({ active: bash, defaultShell: '/usr/bin/zsh', platform: 'linux' });
		run(bash);
		expect(target.current()).toBe('zsh');
		expect(emitted).toEqual(['zsh']);
	});

	it('`node` detectado en la activa → shell de la otra terminal libre', () => {
		const gitbash = terminal('gitbash');
		const active = terminal('pwsh');
		const { target, stateChanged, emitted } = setup({ active, others: [gitbash], defaultShell: 'powershell.exe' });
		active.state.shell = 'node';
		stateChanged.fire(active);
		expect(target.current()).toBe('bash');
		expect(emitted).toEqual(['bash']);
	});

	it('un cambio de ocupación que no mueve el shell no avisa', () => {
		const a = terminal('bash');
		const b = terminal('bash');
		const { run, emitted } = setup({ active: a, others: [b], platform: 'linux' });
		const stop = run(a);
		stop();
		expect(emitted).toEqual([]);
	});
});
