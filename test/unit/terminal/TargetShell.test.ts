import { describe, expect, it } from 'vitest';
import type { ShellId } from '../../../src/catalog/types';
import { TargetShell, type ShellEnv, type ShellTerminal, type ShellWindow, type Subscribe } from '../../../src/terminal/TargetShell';

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

/** Ventana y entorno falsos, con el sistema operativo dado. */
function setup({ active, defaultShell = '', platform = 'win32' }: { active?: ShellTerminal; defaultShell?: string; platform?: string } = {}) {
	const activeChanged = fakeEvent<ShellTerminal | undefined>();
	const stateChanged = fakeEvent<ShellTerminal>();
	const shellChanged = fakeEvent<string>();
	const window: ShellWindow & { activeTerminal: ShellTerminal | undefined } = {
		activeTerminal: active,
		onDidChangeActiveTerminal: activeChanged.subscribe,
		onDidChangeTerminalState: stateChanged.subscribe,
	};
	const env: ShellEnv & { shell: string } = { shell: defaultShell, onDidChangeShell: shellChanged.subscribe };
	const target = new TargetShell(window, env, platform);
	const emitted: ShellId[] = [];
	target.onDidChange((shell) => emitted.push(shell));

	const activate = (next: ShellTerminal | undefined) => {
		window.activeTerminal = next;
		activeChanged.fire(next);
	};
	return { target, window, env, emitted, activate, stateChanged, shellChanged, activeChanged };
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

	it('dispose deja de escuchar los eventos de VS Code', () => {
		const { target, activeChanged, stateChanged, shellChanged, activate, emitted } = setup({ active: terminal('pwsh') });
		target.dispose();
		expect([activeChanged.size(), stateChanged.size(), shellChanged.size()]).toEqual([0, 0, 0]);
		activate(terminal('bash'));
		expect(emitted).toEqual([]);
	});
});
