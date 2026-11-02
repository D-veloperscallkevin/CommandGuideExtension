import { describe, expect, it } from 'vitest';
import { resolveTargetShell, shellIdFromName } from '../../../src/terminal/shell';

describe('shellIdFromName', () => {
	it.each([
		['C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', 'powershell'],
		['C:\\Program Files\\PowerShell\\7\\pwsh.exe', 'powershell'],
		['C:\\Program Files\\Git\\bin\\bash.exe', 'bash'],
		['C:\\Windows\\System32\\cmd.exe', 'cmd'],
		['C:\\Windows\\System32\\wsl.exe', 'bash'],
		['/bin/bash', 'bash'],
		['/usr/bin/zsh', 'zsh'],
		['PWSH.EXE', 'powershell'],
		['pwsh', 'powershell'],
		['gitbash', 'bash'],
		['sh', 'bash'],
		['ksh', 'bash'],
		['dash', 'bash'],
		['cmd', 'cmd'],
	])('%s → %s', (name, expected) => {
		expect(shellIdFromName(name)).toBe(expected);
	});

	it.each(['fish', 'nu', 'python', '/usr/bin/fish', '', '   '])('"%s" no es una variante del catálogo', (name) => {
		expect(shellIdFromName(name)).toBeUndefined();
	});

	it('sin nombre devuelve undefined', () => {
		expect(shellIdFromName(undefined)).toBeUndefined();
	});

	it('solo cuenta el ejecutable, no las carpetas', () => {
		expect(shellIdFromName('C:\\Users\\bash-fan\\tools\\pwsh.exe')).toBe('powershell');
		expect(shellIdFromName('/home/pwsh/bin/zsh')).toBe('zsh');
	});
});

describe('resolveTargetShell', () => {
	it('el shell detectado manda sobre el ejecutable y el perfil', () => {
		expect(
			resolveTargetShell({ detected: 'gitbash', shellPath: 'powershell.exe', defaultShell: 'cmd.exe' }, 'win32'),
		).toBe('bash');
	});

	it('sin detectado usa el ejecutable de la terminal', () => {
		expect(
			resolveTargetShell({ shellPath: 'C:\\Program Files\\Git\\bin\\bash.exe', defaultShell: 'powershell.exe' }, 'win32'),
		).toBe('bash');
	});

	it('sin terminal usa el perfil por defecto', () => {
		expect(resolveTargetShell({ defaultShell: 'C:\\Windows\\System32\\cmd.exe' }, 'win32')).toBe('cmd');
	});

	it('un shell desconocido salta al siguiente dato', () => {
		expect(resolveTargetShell({ detected: 'fish', defaultShell: '/bin/bash' }, 'linux')).toBe('bash');
		expect(resolveTargetShell({ detected: 'nu', shellPath: '/usr/bin/zsh' }, 'linux')).toBe('zsh');
	});

	it('sin datos usa el sistema operativo', () => {
		expect(resolveTargetShell({}, 'win32')).toBe('powershell');
		expect(resolveTargetShell({}, 'linux')).toBe('bash');
		expect(resolveTargetShell({ detected: 'fish' }, 'darwin')).toBe('bash');
	});
});
